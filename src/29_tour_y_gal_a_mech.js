/* ============================================================
   THE UNFLATTERING GALLERY: the land's mechanics (world 30).
   Shared: the area system `gal` (rides onto the built area and the checker's copy), the THROW claim (a prop takes the
   action button only while Brady touches it or stands on its mark), the velvet-rope barrier (a lock), the picture-cord
   rack (a two-faced climbing surface: the drying-net physics of 29_tour_y_wash_a_net.js, re-dressed as twisted
   powder-blue hanging cords on a dark backing board; brass rings are the places to cross to the far face).
   30-1 SITTER     a portrait with a piece missing: Brady's dashed outline stands, crouches (stick down) or perches
                   (jump up onto a plinth) in it. Fit the outline and hold still for a full breath (a ring fills): the
                   portrait is finished and the velvet rope beside it lifts. The last one: Pupo yawning, and only Brady's
                   bent knee (crouched on the plinth) makes the lower lip.
   30-2 VANTAGE    a wheeled viewing frame on a floor rail: stand at it and walk to roll it along. Two painted scraps (the
                   halves of a bridge or a stair, dashed in powder blue where they would be) slide toward each other in
                   its window; at the one right spot they meet, the joined edge glows, and after a full breath still the
                   object is real. The last frame: the painted handrail lines up one spot early (it glows), the stair
                   below it does not: one more nudge.
   30-3 SCRAPE     thick brush ridges of top coat: cross one holding RUN (without it Brady only polishes it) and his shoes scrape it off,
                   showing the older painting under it: the old painted balcony there becomes solid, but the scraped
                   ridge is gone. The last stretch: scrape only the ridges that give balcony; one ridge holds you up.
   30-4 PIVOT      a square frame hangs from a picture rail by its corner hooks; its bottom edge is a ledge. Walk to the
                   far end and keep walking past the hook: it pivots a quarter turn and hangs by the other hook, a
                   frame's width further on, its new bottom edge right under your feet. Walk back past it to undo.
   30-5 AUCTION    a paddle gives a small fixed handful of buttons; lots on podiums show a price (1 to 4 buttons) and the
                   dashed gap their frame would fill. Stand at a podium and THROW to bid: sold, the frame flies to its
                   gap and becomes a step. THROW at a sold podium to send it back for a refund. A handsome decoy fills
                   nothing; the wide lot near the end fills two gaps hung sideways: let the decoy go to afford it.
   30-6 SITTING    the Retoucher's posing mark on a floor rail: roll it until the sight line from his huge self-portrait
                   catches the embarrassing card on its easel; hold still a breath: that sitting's rope lifts.
   The checker: each puzzle's result is a lock (the rope; its key the spot that solves it) or a toggle group (B tiles:
   the bridge, the balcony, the frame's new edge, the sold frame; A tiles: what goes away) switched where it is solved.
   ============================================================ */
(function () {
const K = Tour.galKit, INK = K.INK, GA = K.GalArt;
const AUB = K.AUB, AUB_HI = K.AUB_HI, AUB_LO = K.AUB_LO, MUS = K.MUS, MUS_HI = K.MUS_HI, MUS_LO = K.MUS_LO, BLUE = K.BLUE, BLUE_LO = K.BLUE_LO, CHALK = K.CHALK, WHITE = K.WHITE;
LIQUIDS.gal_varnish = ['#e8b84a', '#b0801c', '#6a4a10', 'rgba(255,240,180,0.35)', null, 'rgba(255,250,220,0.75)'];
const BREATH = 1.2;

/* ---------------- the `gal` area system ---------------- */
if (TourBuild.SYSTEMS.indexOf('gal') < 0) TourBuild.SYSTEMS.push('gal');
{
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.gal) A.gal = area.gal; return A; };
}
const inGal = g => !!(g && g.area && g.area.gal);
const setRect = (g, r, t) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) g.setTile(x, y, t); };
const hideRect = (g, r, v) => { const A = g.area; if (!A.hide) return; for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) if (x >= 0 && y >= 0 && x < A.W && y < A.H) A.hide[y * A.W + x] = v; };
const buildRect = (B, r, t, hide) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) { B.set(x, y, t); if (hide) B.setHide(x, y, 1); } };
const bodyIn = (p, r) => p && p.x < (r[2] + 1) * TS && p.x + p.w > r[0] * TS && p.y < (r[3] + 1) * TS && p.y + p.h > r[1] * TS;
// a stair's tiles: one column per tile, rising to the right from the rect's bottom-left to its top-right
const stairRects = O => { const out = []; for (let c = O[0]; c <= O[2]; c++) out.push([c, O[3] - Math.round((c - O[0]) * (O[3] - O[1]) / Math.max(1, O[2] - O[0])), c, O[3]]); return out; };
const objRects = (O, kind) => kind === 'stair' ? stairRects(O) : [O.slice(0, 4)];
const box = (e, x0, y0, x1, y1) => { e.x = x0 * TS; e.y = y0 * TS; e.w = (x1 - x0 + 1) * TS; e.h = (y1 - y0 + 1) * TS; };
const say = (g, x, y, text, col) => K.pill(g, x, y, text, col);
const breathRing = (ctx, x, y, k, r) => { ctx.save(); ctx.strokeStyle = 'rgba(28,20,38,0.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r || 14, 0, TAU); ctx.stroke(); ctx.strokeStyle = MUS_HI; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r || 14, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(k, 0, 1)); ctx.stroke(); ctx.restore(); };

/* ---------------- the THROW claim ---------------- */
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (inGal(g) && inp && this.state === 'play' && !this.dead) {
      let claim = null;
      for (const e of g.entities) if (e.galClaim && !e.remove && e.galClaim(this)) { claim = e; break; }
      g.galIn = claim ? { pressed: !!inp.actionPressed, held: !!inp.action, by: claim } : null;
      if (claim) inp = Object.assign({}, inp, { actionPressed: false, action: false });
    } else if (g && g.galIn) g.galIn = null;
    return up0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined') { const vis0 = TourPicker.visible; TourPicker.visible = function (play) { if (play && play.galIn) return false; return vis0.call(this, play); }; }
}
// a word on a dark pill over a prop Brady stands at (THROW's meaning there)
const hint = (e, ctx, x, y, word) => {
  const p = e.g.player; if (p) { y = Math.min(y, p.y - 30); x = clamp(x, p.cx - 70, p.cx + 70); }
  ctx.save(); ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(word).width + 14, yy = y + Math.sin(e.t * 5) * 1.5; ctx.fillStyle = 'rgba(28,20,38,0.88)'; rr(ctx, x - w / 2, yy - 9, w, 18, 9); ctx.fill();
  ctx.fillStyle = '#ffe08a'; ctx.fillText(word, x, yy); ctx.restore();
};

/* ---------------- the velvet rope barrier: a lock drawn as two brass posts and a sagging rope ---------------- */
{
  const L = ENTITY_TYPES.lock, d0 = L.prototype.draw;
  L.prototype.draw = function (ctx) {
    if (this.lookName !== 'galVelvet') return d0.call(this, ctx);
    const x = this.cx, yb = this.y + this.h, top = this.y + 6, k = this.open ? 1 - Math.max(0, this.openT || 0) / 0.6 : 0;
    ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    for (const s of [-1, 1]) { ctx.fillStyle = MUS; ctx.fillRect(x + s * 12 - 3, top, 6, yb - top); ctx.strokeRect(x + s * 12 - 3, top, 6, yb - top); ctx.beginPath(); ctx.arc(x + s * 12, top - 3, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    for (let yy = top + 10; yy < yb - 8; yy += 22) { ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - 12, yy - k * 30); ctx.quadraticCurveTo(x, yy + 10, x + 12, yy - k * 30); ctx.stroke(); ctx.strokeStyle = '#8a2a4a'; ctx.lineWidth = 4.5; ctx.stroke(); }
    ctx.restore();
  };
}
// open every rope with this id at once (the puzzle that holds its key is solved, wherever Brady stands)
const openRopes = (g, id) => {
  for (const e of g.entities) if (e instanceof ENTITY_TYPES.lock && e.id === id && !e.open) { e.open = true; e.openT = 0.6; for (const [x, y] of e.tiles) g.setTile(x, y, T.EMPTY); g.burst(e.cx, e.cy, 14, '#e2b33a', 'confetti'); }
  TourKit.sfx('rope', 'secret', { vol: 0.5, pitch: 1.3 });
};
// a column of rope (h tiles, its bottom on the letter's row): { id, h }
Tour.pieces['gal.rope'] = function (st, o) { st.B.lock(st.x, st.gy - (o.h || 4), st.gy - 1, o.id, 'galVelvet'); return st.x; };

/* ======================= 30-1 SITTER: fit Brady's outline into the portrait ======================= */
// { pose: 'stand' | 'crouch', who: 'piwi' | 'pupo', lock: id, dx (outline offset in tiles), side: -1 | 1 (where Piwi
// stands in the picture) }. The letter is the outline's cell (its feet on the floor below).
class GalSitter extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s;
    this.ox = s.x + (s.dx || 0) * TS; this.fy = Math.round(s.y / TS);
    this.k = 0; this.done = false; this.fw = s.who === 'pupo' ? 5 * TS : 4 * TS; this.fh = s.who === 'pupo' ? 4 * TS : 3.6 * TS;
    this.x = this.ox - this.fw / 2 - 10; this.y = this.fy * TS - this.fh - 10; this.w = this.fw + 20; this.h = this.fh + 14;
  }
  matched() {
    const p = this.g.player, inp = p && p.inp; if (!p || p.dead || !p.onGround || p.groundTy !== this.fy) return false;
    if (Math.abs(p.cx - this.ox) > 12 || Math.abs(p.vx) > 30) return false;
    const low = p.crouch || (p.power === 0 && inp && inp.down);
    return this.s.pose === 'crouch' ? !!low : !low;
  }
  update(dt) {
    this.t += dt; if (this.done) { this.doneT = (this.doneT || 0) + dt; return; }
    const m = this.matched();
    this.k = m ? this.k + dt / BREATH : Math.max(0, this.k - dt * 2);
    if (m && !this.wasM) TourKit.sfx('hush', 'select', { vol: 0.25, pitch: 0.8 });
    this.wasM = m;
    if (this.k >= 1) {
      this.done = true; const g = this.g;
      if (this.s.lock) openRopes(g, this.s.lock);
      say(g, this.ox, this.fy * TS - this.fh - 16, this.s.who === 'pupo' ? 'WHAT A LOWER LIP!' : 'LOVELY. HOLD THAT!', '#ffe08a');
      Sound.play('secret', { vol: 0.5 }); g.burst(this.ox, this.fy * TS - 40, 18, '#f6d872', 'confetti');
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, p = g.player, t = this.t, x0 = this.ox - this.fw / 2, y0 = this.fy * TS - this.fh, big = !p || p.power > 0;
    const pose = this.s.pose, pupo = this.s.who === 'pupo';
    GA.frame(ctx, x0, y0, this.fw, this.fh, (c, ix, iy, iw, ih) => {
      // the painted room behind the sitter: a drape and a chair rail
      c.fillStyle = pupo ? '#4a6a5a' : '#3a4a6a'; c.fillRect(ix, iy, iw, ih);
      c.fillStyle = pupo ? '#3a5a4a' : '#2e3c58'; for (let xx = ix; xx < ix + iw; xx += 14) c.fillRect(xx, iy, 6, ih);
      c.fillStyle = '#7a3a4a'; c.fillRect(ix, iy + ih - 12, iw, 12);
      if (pupo) {
        // Pupo yawning, his chin missing: the outline makes his lower lip
        if (typeof Pupo !== 'undefined') { try { Pupo.draw(c, { x: this.ox - (this.s.dx || 0) * TS * 0, y: iy + ih + 6, scale: 1.25, t: 0.6, pose: 'yawn', facing: 1 }); } catch (e) { /* drawn without him */ } }
      } else {
        // Piwi beside the missing sitter, his mouth wide open (that's why it was rejected)
        const side = this.s.side || -1, px = this.ox + side * 1.25 * TS;
        c.fillStyle = '#d6307a'; c.fillRect(px - 12, iy + ih - 40, 24, 30);
        GA.piwi(c, px, iy + ih - 52, 1.25, t, { jaw: 3 + Math.sin(t * 3) * 1.5, look: -side });
      }
      // the missing part: a cut-out showing the wall behind
      c.save(); c.globalCompositeOperation = 'source-over';
      GA.outline(c, this.ox, this.fy * TS, pose, big, { fill: 'rgba(20,14,30,0.55)', dash: false, lw: 0.01, col: 'rgba(0,0,0,0)' });
      c.restore();
    }, { b: 7 });
    if (this.done) {
      // finished: the outline filled in gold, a little brass plate
      GA.outline(ctx, this.ox, this.fy * TS, pose, big, { fill: 'rgba(246,216,114,' + (0.55 + 0.2 * Math.sin(t * 3)) + ')', col: MUS_LO, dash: false, lw: 2 });
      return;
    }
    const k = 0.5 + 0.5 * Math.sin(t * 5);
    GA.outline(ctx, this.ox, this.fy * TS, pose, big, { col: this.wasM ? MUS_HI : `rgba(255,255,255,${0.7 + 0.3 * k})`, t, lw: 3 });
    if (pose === 'crouch') { ctx.save(); ctx.fillStyle = WHITE; ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('▼', this.ox, this.fy * TS - 40 - k * 3); ctx.restore(); }
    if (this.k > 0) breathRing(ctx, this.ox, this.fy * TS - (pose === 'crouch' ? 50 : big ? 74 : 48), this.k);
  }
}
ENTITY_TYPES.galSitter = GalSitter;
Tour.pieces['gal.sitter'] = function (st, o) {
  const B = st.B; B.spawn('galSitter', st.x, st.gy - 1, o);
  if (o.lock) B.vkey(o.lock, [[st.x + (o.dx || 0), st.gy - 1]]);
  return st.x;
};

/* ======================= the carriage: a prop on a floor rail that rolls along with Brady ======================= */
// { rail: [x0, x1, y] (the carriage's left tile from x0 to x1; y the floor row), w (tiles), at (start tile) }
const carriage = {
  init(e, s) { e.rail = s.rail; e.cw = s.w || 2; e.cxF = ((s.at != null ? s.at : s.rail[0]) + e.cw / 2) * TS; e.holding = false; e.still = 0; },
  sx(e) { return Math.round(e.cxF / TS - e.cw / 2); },
  update(e, dt) {
    const p = e.g.player, R = e.rail, lo = (R[0] + e.cw / 2) * TS, hi = (R[1] + e.cw / 2) * TS, was = e.cxF;
    e.holding = !!(p && !p.dead && p.onGround && p.groundTy === R[2] && Math.abs(p.cx - e.cxF) < e.cw * TS / 2 + 2 && p.cx > lo - e.cw * TS / 2 && p.cx < hi + e.cw * TS / 2);
    if (e.holding) { const nx = clamp(p.cx, lo, hi); if (Math.abs(nx - e.cxF) > 0.5) TourKit.sfx('roll', 'select', { vol: 0.1, pitch: 0.6 }); e.cxF = nx; }
    else { const tgt = (carriage.sx(e) + e.cw / 2) * TS; e.cxF = lerp(e.cxF, tgt, Math.min(1, dt * 10)); }
    e.still = Math.abs(e.cxF - was) < 0.4 ? e.still + dt : 0;
  },
  drawRail(ctx, e) {
    const R = e.rail, y = R[2] * TS, x0 = R[0] * TS + 4, x1 = (R[1] + e.cw) * TS - 4;
    ctx.save(); ctx.strokeStyle = 'rgba(28,20,38,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y + 4); ctx.lineTo(x1, y + 4); ctx.stroke();
    for (const xx of [x0, x1]) { ctx.fillStyle = MUS; ctx.beginPath(); ctx.arc(xx, y + 4, 3.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
};

/* ======================= 30-2 VANTAGE: line two scraps up in the viewing frame ======================= */
// { rail, at, good (the left tile where they meet), decoy (a tile where only the handrail meets), obj: [x0, y0, x1, y1]
// (the walkable object's tiles), kind: 'bridge' | 'stair', g }
class GalViewer extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; carriage.init(this, s);
    const O = s.obj; this.done = false; this.k = 0;
    const xs = [s.rail[0], s.rail[1] + 2, O[0], O[2] + 1], ys = [s.rail[2] - 4, O[1] - 3, O[3] + 2];
    this.x = Math.min(...xs) * TS - 40; this.w = (Math.max(...xs) - Math.min(...xs)) * TS + 80; this.y = Math.min(...ys) * TS; this.h = (Math.max(...ys) + 1) * TS - this.y;
  }
  off() { return carriage.sx(this) - this.s.good; }
  update(dt) {
    this.t += dt; carriage.update(this, dt);
    if (this.done) return;
    const ok = this.off() === 0;
    this.k = ok ? this.k + dt / BREATH : 0;
    if (ok && !this.wasOk) TourKit.sfx('click', 'select', { vol: 0.3, pitch: 1.4 });
    this.wasOk = ok;
    if (this.s.decoy != null && carriage.sx(this) === this.s.decoy && !this.decoySaid && this.still > 0.6) { this.decoySaid = true; say(this.g, this.cxF, this.s.rail[2] * TS - 90, 'THE RAIL MEETS... THE STAIR DOESN\'T', '#c8d8ff'); }
    if (this.k >= 1) {
      this.done = true; const g = this.g, O = this.s.obj;
      for (const r of objRects(O, this.s.kind)) { setRect(g, r, this.s.kind === 'stair' ? T.HARD : T.SEMI); hideRect(g, r, 1); } g.refreshPlatforms && g.refreshPlatforms();
      Sound.play('secret', { vol: 0.5 }); g.burst((O[0] + O[2] + 1) * TS / 2, O[1] * TS, 18, BLUE, 'spark');
      say(g, (O[0] + O[2] + 1) * TS / 2, O[1] * TS - 20, 'IT\'S REAL NOW!', '#ffe08a');
    }
  }
  touchPlayer() {}
  // the object's two halves: the left one raised by the offset, the right one lowered (in pixels)
  paintObj(ctx, O, dy, alpha, solid) {
    const x0 = O[0] * TS, x1 = (O[2] + 1) * TS, y0 = O[1] * TS, y1 = (O[3] + 1) * TS, mid = (x0 + x1) / 2, stair = this.s.kind === 'stair';
    ctx.save(); ctx.globalAlpha *= alpha;
    for (const [a, b, d] of [[x0, mid, -dy], [mid, x1, dy]]) {
      ctx.save(); ctx.translate(0, d);
      if (solid) { ctx.fillStyle = MUS; ctx.strokeStyle = INK; ctx.lineWidth = 2; }
      else { ctx.fillStyle = 'rgba(154,184,232,0.22)'; ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -this.t * 10; }
      if (stair) { ctx.beginPath(); ctx.moveTo(a, y1); for (let xx = a; xx < b; xx += TS) { const yy = y0 + (y1 - y0) * (1 - (xx - x0 + TS) / (x1 - x0)); ctx.lineTo(xx, Math.min(y1, yy + TS)); ctx.lineTo(xx, yy); ctx.lineTo(xx + TS, yy); } ctx.lineTo(b, y1); ctx.closePath(); }
      else { ctx.beginPath(); ctx.rect(a, y0, b - a, 12); }
      ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    ctx.restore();
  }
  draw(ctx) {
    const s = this.s, t = this.t, O = s.obj, off = this.off(), d = this.done ? 0 : clamp(off, -4, 4) * 14 + (this.cxF / TS - 1 - carriage.sx(this)) * 14;
    ctx.save();
    carriage.drawRail(ctx, this);
    if (this.done) { this.paintObj(ctx, O, 0, 1, true); }
    else {
      // the live preview: the two scraps where they are now, and the joined edge
      const meet = off === 0;
      this.paintObj(ctx, O, d, meet ? 1 : 0.85, false);
      const mid = (O[0] + O[2] + 1) * TS / 2;
      if (meet) { ctx.strokeStyle = `rgba(255,240,160,${0.6 + 0.4 * Math.sin(t * 8)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(mid, O[1] * TS - 10); ctx.lineTo(mid, (O[3] + 1) * TS + 4); ctx.stroke(); if (this.k > 0) breathRing(ctx, mid, O[1] * TS - 30, this.k); }
      // the decoy handrail: painted above the stair, meeting one spot early
      if (s.decoy != null) {
        const dh = clamp(carriage.sx(this) - s.decoy, -4, 4) * 14, y = O[1] * TS - 2 * TS;
        ctx.strokeStyle = Math.abs(dh) < 3 ? MUS_HI : BLUE; ctx.lineWidth = 4; ctx.setLineDash([8, 5]);
        ctx.beginPath(); ctx.moveTo(O[0] * TS, y - dh); ctx.lineTo(mid, y - dh + 8); ctx.moveTo(mid, y + dh + 8); ctx.lineTo((O[2] + 1) * TS, y + dh + 16); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // the viewing frame itself: an aubergine frame on little wheels, its window showing a sliver of each scrap
    const cx = this.cxF, fy = s.rail[2] * TS, w = 2 * TS - 8;
    ctx.translate(cx, fy);
    for (const sx of [-w / 2 + 6, w / 2 - 6]) { ctx.fillStyle = '#3a3440'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sx, -5, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = AUB_LO; ctx.fillRect(-3, -40, 6, 32);
    GA.frame(ctx, -w / 2, -96, w, 58, (c, ix, iy, iw, ih) => { c.fillStyle = '#cfe0f4'; c.fillRect(ix, iy, iw, ih); c.fillStyle = BLUE; c.fillRect(ix, iy + ih / 2 - 4 - d * 0.4, iw / 2, 8); c.fillRect(ix + iw / 2, iy + ih / 2 - 4 + d * 0.4, iw / 2, 8); }, { b: 6, ground: '#cfe0f4' });
    ctx.restore();
  }
}
ENTITY_TYPES.galViewer = GalViewer;
Tour.pieces['gal.viewer'] = function (st, o) {
  const B = st.B; B.spawn('galViewer', st.x, st.gy - 1, o);
  if (o.g != null) { B.toggle(o.g, [], objRects(o.obj, o.kind).map(r => r.concat([o.kind === 'stair' ? T.HARD : T.SEMI])), { kind: 'galViewer' }); B.switchAt(o.g, o.good, o.rail[2] - 1); }
  return st.x;
};

/* ======================= 30-3 SCRAPE: run the top coat off, the old painting shows ======================= */
// { cells: [x0, x1, y] (the ridge: top-coat tiles), reveal: [[x0, y0, x1, y1], ...] (old painted balcony), g }
class GalRidge extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; const C = s.cells;
    this.cols = {}; this.done = false; this.fade = 0;
    const xs = [C[0], C[1] + 1], ys = [C[2], C[2] + 1]; for (const r of s.reveal) { xs.push(r[0], r[2] + 1); ys.push(r[1], r[3] + 1); }
    this.x = Math.min(...xs) * TS - 8; this.w = (Math.max(...xs) - Math.min(...xs)) * TS + 16; this.y = Math.min(...ys) * TS - 8; this.h = (Math.max(...ys) - Math.min(...ys)) * TS + 16;
  }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player, C = this.s.cells;
    if (this.done) { this.fade = Math.min(1, this.fade + dt * 3); return; }
    if (p && !p.dead && p.onGround && p.groundTy === C[2]) {
      const tx = Math.floor(p.cx / TS);
      if (tx >= C[0] && tx <= C[1]) {
        if (p.inp && p.inp.action && Math.abs(p.vx) > PHYS.walk * 0.8) { if (!this.cols[tx]) { this.cols[tx] = true; TourKit.sfx('scrape', 'kick', { vol: 0.25, pitch: 1.4 + Math.random() * 0.4 }); g.burst(p.cx, C[2] * TS, 5, MUS_HI, 'spark'); } }
        else if (Math.abs(p.vx) > 20 && !(this.polT > 0) && !this.cols[tx]) { this.polT = 2.5; say(g, p.cx, p.y - 20, 'POLISHED... HOLD RUN TO SCRAPE', '#c8d8ff'); }
      }
    }
    if (this.polT > 0) this.polT -= dt;
    let miss = 0; for (let x = C[0]; x <= C[1]; x++) if (!this.cols[x]) miss++;
    const all = this.s.solid ? miss === 0 : miss <= 1;
    if (all) {
      this.done = true;
      if (this.s.solid) setRect(g, [C[0], C[2], C[1], C[2]], T.EMPTY);
      for (const r of this.s.reveal) { setRect(g, r, T.HARD); hideRect(g, r, 1); }
      g.refreshPlatforms && g.refreshPlatforms();
      Sound.play('break', { vol: 0.45, pitch: 1.3 }); say(g, (C[0] + C[1] + 1) * TS / 2, C[2] * TS - 30, 'THE OLD PAINTING!', '#ffe08a');
      for (const r of this.s.reveal) g.burst((r[0] + r[2] + 1) * TS / 2, r[1] * TS, 12, '#c8a878', 'dust');
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const C = this.s.cells, t = this.t, y = C[2] * TS;
    ctx.save();
    // the old painting under the top coat: a sepia balcony, hidden (only a faint ghost) until scraped
    for (const r of this.s.reveal) {
      const x0 = r[0] * TS, y0 = r[1] * TS, w = (r[2] - r[0] + 1) * TS, h = (r[3] - r[1] + 1) * TS;
      ctx.save(); ctx.globalAlpha = this.done ? this.fade : 0.16;
      ctx.fillStyle = '#c8a070'; ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.fillRect(x0, y0, w, h); ctx.strokeRect(x0, y0, w, h);
      ctx.fillStyle = '#8a6040'; for (let xx = x0 + 6; xx < x0 + w - 4; xx += 10) ctx.fillRect(xx, y0 - 14, 3, 14);
      ctx.fillRect(x0, y0 - 16, w, 3); ctx.fillStyle = '#e8c898'; ctx.fillRect(x0, y0, w, 3);
      ctx.restore();
    }
    // the ridge: thick glossy brush strokes of mustard top coat, one per tile; scraped ones show bare ochre
    if (!this.done) for (let x = C[0]; x <= C[1]; x++) {
      const x0 = x * TS, sc = this.cols[x];
      if (sc) { ctx.fillStyle = '#b89a6a'; ctx.fillRect(x0, y, TS, this.s.solid ? TS : 8); ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = 4; q < TS; q += 7) { ctx.moveTo(x0 + q, y + 4); ctx.lineTo(x0 + q - 3, y + TS - 4); } ctx.stroke(); continue; }
      const bot = this.s.solid ? y + TS : y + 7, top = y - 7;
      ctx.fillStyle = MUS_LO; ctx.fillRect(x0, top + 6, TS, bot - top - 6);
      ctx.fillStyle = MUS; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, top + 10); for (let q = 0; q <= 4; q++) ctx.quadraticCurveTo(x0 + q * 8 - 4, top - 2 + (q % 2) * 4, x0 + q * 8, top + 4 + (q % 2) * 3); ctx.lineTo(x0 + TS, bot); ctx.lineTo(x0, bot); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,250,210,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 6, y - 2 + Math.sin(t * 2 + x) * 0.6); ctx.quadraticCurveTo(x0 + 14, y - 5, x0 + 22, y - 1); ctx.stroke();
    }
    ctx.restore();
  }
}
ENTITY_TYPES.galRidge = GalRidge;
Tour.pieces['gal.ridge'] = function (st, o) {
  const B = st.B, C = o.cells; B.spawn('galRidge', st.x, st.gy - 1, o);
  // a ridge on the floor is paint on the floor's top (the floor stays); a solid one (over a gap) is the top coat alone
  if (o.solid) for (let x = C[0]; x <= C[1]; x++) { B.set(x, C[2], T.HARD); B.setHide(x, C[2], 1); }
  if (o.g != null) { B.toggle(o.g, o.solid ? [[C[0], C[2], C[1], C[2]]] : [], o.reveal.map(r => r.slice(0, 4)), { kind: 'galRidge' }); B.switchAt(o.g, C[1], C[2] - 1); }
  return st.x;
};

/* ======================= 30-4 PIVOT: walk past the hook, the frame turns over and hangs on ======================= */
// { L (the frame's left column at rest), top (its top row), n (its side), dir (+1: it turns to the right), g }
class GalTumble extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; this.n = s.n || 3; this.dir = s.dir || 1;
    this.pos = 0; this.anim = 0; this.creak = 0; this.from = 0;
    const L = s.L, n = this.n, lo = Math.min(L, L + this.dir * n), hi = Math.max(L, L + this.dir * n) + n;
    this.x = lo * TS - 20; this.w = (hi - lo) * TS + 40; this.y = (s.top - 2) * TS; this.h = (n + 3) * TS;
  }
  left(pos) { return this.s.L + pos * this.dir * this.n; }
  edge(pos) { const l = this.left(pos), y = this.s.top + this.n - 1; return [l, y, l + this.n - 1, y]; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player, inp = p && p.inp, n = this.n, y = this.s.top + n - 1;
    if (this.anim > 0) {
      this.anim -= dt;
      if (this.anim <= 0) { const E = this.edge(this.from); const N = this.edge(this.pos); for (let x = E[0]; x <= E[2]; x++) if (x < N[0] || x > N[2]) g.setTile(x, y, T.EMPTY); }
      return;
    }
    if (!p || p.dead || !p.onGround || p.groundTy !== y || !inp) { this.creak = 0; return; }
    const E = this.edge(this.pos), tx = Math.floor(p.cx / TS);
    // the far end (the way it turns from here) with the stick pushing on past the hook
    const out = this.pos === 0 ? this.dir : -this.dir, endX = out > 0 ? E[2] : E[0];
    const push = tx === endX && (out > 0 ? inp.right : inp.left);
    this.creak = push ? this.creak + dt : 0;
    if (this.creak > 0.03) {
      this.creak = 0; this.from = this.pos; this.pos = 1 - this.pos; this.anim = 0.5;
      const N = this.edge(this.pos); setRect(g, N, T.SEMI); hideRect(g, N, 1); g.refreshPlatforms && g.refreshPlatforms();
      TourKit.sfx('creak', 'bump', { vol: 0.5, pitch: 0.6 }); Sound.play('stomp', { pitch: 0.6, vol: 0.35 });
      if (!g.galPivotSaid) { g.galPivotSaid = true; say(g, p.cx, p.y - 24, 'IT HANGS BY THE OTHER HOOK!', '#ffe08a'); }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, n = this.n, t = this.t, top = s.top * TS, S = n * TS;
    ctx.save();
    // the picture rail and its hooks (every hook this frame can hang from)
    const lo = Math.min(this.left(0), this.left(1)), hi = Math.max(this.left(0), this.left(1)) + n;
    ctx.strokeStyle = AUB_LO; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lo * TS - 10, top - 18); ctx.lineTo(hi * TS + 10, top - 18); ctx.stroke();
    for (let x = lo; x <= hi; x += n) { ctx.strokeStyle = MUS; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x * TS, top - 18); ctx.quadraticCurveTo(x * TS + 5, top - 10, x * TS, top - 4); ctx.stroke(); GA.nail(ctx, x * TS, top - 18, 2.6); }
    // the frame: square, at rest or turning about its hook corner (the corner on the side it turns toward)
    const pic = (c, ix, iy, iw, ih) => { c.fillStyle = '#3a5a6a'; c.fillRect(ix, iy, iw, ih); GA.piwi(c, ix + iw / 2, iy + ih * 0.52, iw / 32, t, { jaw: 4, look: 0 }); };
    let ang = 0, px = this.left(this.pos) * TS, piv = null;
    if (this.anim > 0) {
      const k = 1 - this.anim / 0.5, e = k * k * (3 - 2 * k), turnRight = (this.pos === 1) === (this.dir > 0);
      const hookX = turnRight ? (this.left(this.from) + n) * TS : this.left(this.from) * TS;
      piv = [hookX, top]; ang = (turnRight ? 1 : -1) * e * Math.PI / 2; px = this.left(this.from) * TS;
    }
    ctx.save();
    if (piv) { ctx.translate(piv[0], piv[1]); ctx.rotate(ang); ctx.translate(-piv[0], -piv[1]); }
    // the cords up to the hooks
    ctx.strokeStyle = BLUE_LO; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 6, top + 4); ctx.lineTo(px, top); ctx.moveTo(px + S - 6, top + 4); ctx.lineTo(px + S, top); ctx.stroke();
    GA.frame(ctx, px, top, S, S, pic, { b: 9 });
    // the bottom edge (the ledge): a mustard moulding, bright
    ctx.fillStyle = MUS_HI; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(px - 2, top + S - 10, S + 4, 10); ctx.strokeRect(px - 2, top + S - 10, S + 4, 10);
    ctx.restore();
    // at rest: the far end's hook glows when Brady stands on the ledge's end
    ctx.restore();
  }
}
ENTITY_TYPES.galTumble = GalTumble;
Tour.pieces['gal.tumble'] = function (st, o) {
  const B = st.B, n = o.n || 3, dir = o.dir || 1, y = o.top + n - 1;
  B.spawn('galTumble', st.x, st.gy - 1, o);
  const e0 = [o.L, y, o.L + n - 1, y], l1 = o.L + dir * n, e1 = [l1, y, l1 + n - 1, y];
  buildRect(B, e0, T.SEMI, true);
  if (o.g != null) {
    B.toggle(o.g, [e0], [e1.concat([T.SEMI])], { kind: 'galTumble' });
    B.switchAt(o.g, dir > 0 ? e0[2] : e0[0], y - 1);
  }
  return st.x;
};

/* ======================= 30-5 AUCTION: bid buttons, the frames fill the stair ======================= */
// the paddle: { n } sets Brady's handful of buttons when he walks past it; the wallet shows in one fixed spot
class GalPaddle extends Ent {
  constructor(g, s) { super(g, s, TS, 2 * TS); this.x = s.x - TS / 2; this.y = s.y - 2 * TS; this.friendly = true; this.n = s.n || 5; this.used = false; }
  update(dt) { this.t += dt; const p = this.g.player; if (!this.used && p && overlap(p, this)) { this.used = true; this.g.galWallet = this.n; this.g.galWalletMax = this.n; say(this.g, this.cx, this.y - 10, 'A BIDDING PADDLE: ' + this.n + ' BUTTONS', '#ffe08a'); TourKit.sfx('pick', 'coin', { vol: 0.5 }); } }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    if (this.used) return;
    ctx.save(); ctx.translate(x, y - 30 + Math.sin(t * 3) * 3); ctx.rotate(Math.sin(t * 2) * 0.15); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-2, 0, 4, 22); ctx.strokeRect(-2, 0, 4, 22);
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(0, -10, 12, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = AUB; ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(String(this.n), 0, -6);
    ctx.restore();
  }
}
ENTITY_TYPES.galPaddle = GalPaddle;
// a lot: { price, gaps: [[x0, y0, x1, y1], ...] (where the frame hangs once sold: solid steps), decoy, g, pic }
class GalLot extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, 2 * TS); this.x = s.x - TS; this.y = s.y - 2 * TS; this.friendly = true; this.back = true; this.s = s; this.sold = false; this.fly = 0;
  }
  galClaim(p) { return overlap(p, { x: this.x - 4, y: this.y, w: this.w + 8, h: this.h + 4 }) && p.onGround; }
  update(dt) {
    this.t += dt; if (this.fly > 0) this.fly = Math.max(0, this.fly - dt * 2);
    const g = this.g, I = g.galIn; if (!I || I.by !== this || !I.pressed) return;
    const s = this.s, w = g.galWallet || 0;
    if (!this.sold) {
      if (w < s.price) { say(g, this.cx, this.y - 20, 'NOT ENOUGH BUTTONS (' + w + ' OF ' + s.price + ')', '#ffb0a0'); TourKit.sfx('fizz', 'bump', { vol: 0.4, pitch: 0.6 }); return; }
      g.galWallet = w - s.price; this.sold = true; this.fly = 1;
      if (!s.decoy) for (const r of s.gaps) { setRect(g, r, T.HARD); hideRect(g, r, 1); }
      g.refreshPlatforms && g.refreshPlatforms();
      Sound.play('coin', { vol: 0.5 }); TourKit.sfx('gavel', 'stomp', { vol: 0.6, pitch: 1.2 });
      say(g, this.cx, this.y - 20, s.decoy ? 'SOLD! IT IS VERY HANDSOME. IT FILLS NOTHING.' : s.gaps.length > 1 ? 'SOLD! HUNG SIDEWAYS: TWO GAPS!' : 'SOLD! IT FILLS THE GAP', s.decoy ? '#c8d8ff' : '#ffe08a');
    } else {
      // a refund: only if Brady isn't standing on the frame
      const p = g.player; if (!s.decoy && s.gaps.some(r => bodyIn(p, [r[0], r[1] - 1, r[2], r[3]]))) { say(g, this.cx, this.y - 20, 'GET OFF IT FIRST', '#ffb0a0'); return; }
      g.galWallet = w + s.price; this.sold = false; this.fly = 1;
      if (!s.decoy) for (const r of s.gaps) setRect(g, r, T.EMPTY);
      say(g, this.cx, this.y - 20, 'RETURNED: ' + s.price + ' BUTTONS BACK', '#c8d8ff'); TourKit.sfx('fizz', 'bump', { vol: 0.3, pitch: 1.2 });
    }
  }
  touchPlayer() {}
  pic(c, ix, iy, iw, ih) {
    const s = this.s;
    if (s.decoy) { c.fillStyle = '#d8b0c8'; c.fillRect(ix, iy, iw, ih); GA.piwi(c, ix + iw / 2, iy + ih * 0.55, iw / 26, this.t, { jaw: 0, look: 0 }); c.fillStyle = MUS_HI; for (let k = 0; k < 4; k++) { const a = this.t * 2 + k * 1.6; c.beginPath(); c.arc(ix + iw / 2 + Math.cos(a) * iw * 0.4, iy + ih / 2 + Math.sin(a) * ih * 0.4, 1.6, 0, TAU); c.fill(); } }
    else { c.fillStyle = '#4a6a7a'; c.fillRect(ix, iy, iw, ih); GA.piwi(c, ix + iw / 2, iy + ih * 0.55, iw / 26, this.t, { jaw: 4, look: 0 }); }
  }
  draw(ctx) {
    const s = this.s, t = this.t, x = this.cx, fy = this.y + this.h, g = this.g;
    ctx.save();
    // the podium
    ctx.fillStyle = AUB; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(x - 22, fy - 26, 44, 26); ctx.strokeRect(x - 22, fy - 26, 44, 26); ctx.fillStyle = MUS; ctx.fillRect(x - 25, fy - 30, 50, 5); ctx.strokeRect(x - 25, fy - 30, 50, 5);
    // the price: big digits and that many buttons
    ctx.fillStyle = WHITE; ctx.font = '13px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(String(s.price), x - 12, fy - 9);
    for (let k = 0; k < s.price; k++) GA.button(ctx, x + 2 + (k % 2) * 10, fy - 19 + Math.floor(k / 2) * 9, 4);
    // the gaps the frame would fill: dashed, live (bright while Brady stands at the podium)
    const mine = g.galIn && g.galIn.by === this;
    if (!this.sold && !s.decoy) for (const r of s.gaps) { ctx.save(); ctx.strokeStyle = mine ? MUS_HI : 'rgba(154,184,232,0.85)'; ctx.fillStyle = mine ? 'rgba(246,216,114,0.25)' : 'rgba(154,184,232,0.12)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 10; const rx = r[0] * TS, ry = r[1] * TS, rw = (r[2] - r[0] + 1) * TS, rh = (r[3] - r[1] + 1) * TS; ctx.fillRect(rx, ry, rw, rh); ctx.strokeRect(rx, ry, rw, rh); ctx.restore(); }
    // the frame: on its podium, or hung in its gap(s) (sideways when it fills two), or (the decoy) hung on the wall
    const fw = 44, fh = 38, k = this.fly;
    if (!this.sold) { ctx.save(); ctx.translate(0, -k * 40); GA.frame(ctx, x - fw / 2, fy - 30 - fh - 2, fw, fh, (c, a, b, w, h) => this.pic(c, a, b, w, h), { b: 6, lip: s.decoy ? MUS_HI : MUS }); ctx.restore(); }
    else if (s.decoy) { GA.frame(ctx, x - fw / 2, fy - 30 - fh - 60 - k * 30, fw, fh, (c, a, b, w, h) => this.pic(c, a, b, w, h), { b: 6, lip: MUS_HI }); }
    else for (const r of s.gaps) { const rx = r[0] * TS, ry = r[1] * TS, rw = (r[2] - r[0] + 1) * TS, rh = (r[3] - r[1] + 1) * TS; ctx.save(); ctx.globalAlpha = 1 - k * 0.6; GA.frame(ctx, rx, ry, rw, rh, (c, a, b, w, h) => this.pic(c, a, b, w, h), { b: 5 }); ctx.restore(); }
    if (mine) hint(this, ctx, x, this.y - 30, this.sold ? 'THROW: RETURN IT' : 'THROW: BID ' + s.price);
    ctx.restore();
  }
}
ENTITY_TYPES.galLot = GalLot;
Tour.pieces['gal.lot'] = function (st, o) {
  const B = st.B; B.spawn('galLot', st.x, st.gy - 1, o);
  if (o.g != null && !o.decoy) { B.toggle(o.g, [], o.gaps.map(r => r.slice(0, 4)), { kind: 'galLot' }); B.switchAt(o.g, st.x, st.gy - 1); }
  return st.x;
};
Tour.pieces['gal.paddle'] = function (st, o) { st.B.spawn('galPaddle', st.x, st.gy - 1, o); return st.x; };
// the wallet: one fixed pill under the top bar while the paddle's buttons last
TourHooks.on('afterEntities', (play, ctx) => {
  if (!inGal(play) || play.galWallet == null || !play.area.gal.auction) return;
  const n = play.galWallet, max = play.galWalletMax || n, x = play.camX + Game.viewW / 2, y = play.camY + 66;
  ctx.save(); const w = 30 + max * 16; ctx.fillStyle = 'rgba(28,20,38,0.88)'; rr(ctx, x - w / 2, y - 12, w, 24, 12); ctx.fill();
  for (let k = 0; k < max; k++) { ctx.globalAlpha = k < n ? 1 : 0.25; GA.button(ctx, x - w / 2 + 22 + k * 16, y, 6); }
  ctx.restore();
});

/* ======================= 30-6 SITTING: roll the posing mark until the self-portrait catches the card ======================= */
// { rail, at, good, lock, card: [x, y] (the easel card's tile), label }
class GalSitting extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; carriage.init(this, s); this.k = 0; this.done = false;
    // the card sits on the sight line from the portrait's eye to the mark's right spot (u of the way down)
    const ex = s.eye[0] * TS + TS / 2, ey = s.eye[1] * TS + TS / 2, mx = (s.good + 1) * TS, my = s.rail[2] * TS - 6, u = s.u || 0.62;
    this.card = [ex + (mx - ex) * u, ey + (my - ey) * u];
    const R = s.rail, xs = [R[0], R[1] + 2, s.eye[0] - 4, s.eye[0] + 4]; this.x = Math.min(...xs) * TS - 60; this.w = (Math.max(...xs) - Math.min(...xs)) * TS + 120; this.y = (s.eye[1] - 4) * TS; this.h = (R[2] - s.eye[1] + 5) * TS;
  }
  update(dt) {
    this.t += dt; carriage.update(this, dt); if (this.done) return;
    const ok = carriage.sx(this) === this.s.good;
    this.k = ok ? this.k + dt / BREATH : 0; if (ok && !this.wasOk) TourKit.sfx('click', 'select', { vol: 0.3, pitch: 1.4 }); this.wasOk = ok;
    if (this.k >= 1) { this.done = true; openRopes(this.g, this.s.lock); say(this.g, this.card[0], this.card[1] - 30, 'CAPTURED: ' + (this.s.label || 'HIS BAD SIDE'), '#ffe08a'); }
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, fy = s.rail[2] * TS, ex = s.eye[0] * TS + TS / 2, ey = s.eye[1] * TS + TS / 2, mx = this.cxF;
    ctx.save(); carriage.drawRail(ctx, this);
    // the self-portrait's painted eye looks down at the mark: a powder-blue sight line through to the floor beyond
    const dx = mx - ex, dy = fy - 6 - ey, L = 1.6, x2 = ex + dx * L, y2 = ey + dy * L;
    const cx = this.card[0], cy = this.card[1];
    // the huge self-portrait the sight line comes from: his painted eye is the line's start
    GA.frame(ctx, ex - 3 * TS, ey - 2.2 * TS, 6 * TS, 4.6 * TS, (c, ix, iy, iw, ih) => { c.fillStyle = '#4a3a5a'; c.fillRect(ix, iy, iw, ih); GA.piwi(c, ex + 18, ey + 18, 4.2, t, { jaw: 0, look: clamp((mx - ex) / 200, -1, 1), lookY: 1 }); }, { b: 12 });
    ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, TAU); ctx.fill();
    // does the line pass the card?
    const u = ((cx - ex) * dx + (cy - ey) * dy) / (dx * dx + dy * dy), px = ex + dx * u, py = ey + dy * u, hit = Math.hypot(px - cx, py - cy) < 14 && u > 0;
    ctx.strokeStyle = this.done ? MUS_HI : hit ? MUS_HI : BLUE; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 14; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    // the card on its little easel: the embarrassing feature
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 14, fy); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx + 14, fy); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + 3, fy); ctx.stroke();
    GA.frame(ctx, cx - 18, cy - 16, 36, 30, (c, ix, iy, iw, ih) => { c.fillStyle = '#f0e0c8'; c.fillRect(ix, iy, iw, ih); GA.piwi(c, ix + iw / 2, iy + ih * 0.5, iw / 30, t, { jaw: 5, look: 0 }); c.fillStyle = '#4a9a3a'; c.fillRect(ix + iw / 2 - 1, iy + ih * 0.5 + 6, 4, 3); }, { b: 4, lip: hit || this.done ? MUS_HI : MUS });
    if (this.k > 0) breathRing(ctx, cx, cy - 32, this.k);
    // the posing mark: a gilt X plate on castors
    ctx.translate(mx, fy); ctx.fillStyle = MUS; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, -26, -9, 52, 9, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = AUB; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, -1); ctx.moveTo(8, -8); ctx.lineTo(-8, -1); ctx.stroke();
    ctx.restore();
  }
}
ENTITY_TYPES.galSitting = GalSitting;
Tour.pieces['gal.sitting'] = function (st, o) { const B = st.B; B.spawn('galSitting', st.x, st.gy - 1, o); if (o.lock) B.vkey(o.lock, [[o.good, o.rail[2] - 1]]); return st.x; };

/* ======================= the picture-cord rack: a climbing surface with two faces ======================= */
// the drying-net physics and checker (29_tour_y_wash_a_net.js) read any zone of kind 'washNet'; this draws it as a
// rack of twisted powder-blue hanging cords on a dark backing board, brass rings where Brady crosses to the far face
let rackN = 0;
class GalRack extends Ent {
  constructor(g, s) { super(g, s, s.w * TS, s.h * TS); this.back = true; this.x = s.tx * TS; this.y = s.ty * TS; this.holes = s.holes || []; this.nid = s.nid; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  cords(ctx, x, y, w, h, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (let xx = x + 8; xx < x + w; xx += 16) { ctx.strokeStyle = BLUE_LO; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); ctx.strokeStyle = BLUE; ctx.lineWidth = 2.2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); ctx.setLineDash([]); }
    for (let yy = y + 8; yy < y + h; yy += 16) { ctx.strokeStyle = BLUE_LO; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
    ctx.restore();
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, t = this.t, g = this.g;
    ctx.save();
    // the backing board (far face side): dark aubergine with a mustard border, the rail on top
    ctx.fillStyle = 'rgba(42,16,36,0.88)'; ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
    ctx.strokeStyle = MUS_LO; ctx.lineWidth = 3; ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
    ctx.fillStyle = AUB_HI; ctx.fillRect(x - 12, y - 14, w + 24, 8); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x - 12, y - 14, w + 24, 8);
    this.cords(ctx, x, y, w, h, 1);
    // the crossing rings
    for (const [hx, hy] of this.holes) { const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, TAU); ctx.stroke(); ctx.strokeStyle = MUS; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = 'rgba(20,10,20,0.7)'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, TAU); ctx.fill(); }
    const p = g.player, W = p && p.wash;
    if (W && W.grip && W.grip.nid === this.nid && !(W.crossT > 0) && Tour.washKit && Tour.washKit.holeAt) {
      const hh = Tour.washKit.holeAt(W.grip, p.x + p.w / 2, p.y + 8);
      if (hh) { const k = 0.5 + 0.5 * Math.sin(t * 8); ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hh[0] * TS + TS / 2, hh[1] * TS + TS / 2, 20 + k * 3, 0, TAU); ctx.stroke(); }
    }
    ctx.restore();
  }
}
ENTITY_TYPES.galRack = GalRack;
// on the far face the cords pass in front of Brady (drawn again over him)
TourHooks.on('afterEntities', (play, ctx) => {
  const p = play.player, W = p && p.wash; if (!inGal(play) || !W || !W.grip || W.face !== 1) return;
  for (const e of play.entities) if (e instanceof GalRack && e.nid === W.grip.nid) e.cords(ctx, e.x, e.y, e.w, e.h, 0.9);
});
// critters on the rack: a gilt gnat crawling the cords (lazily made from the wash critter once every file has loaded)
// (the wash files load after this one: the real class is made from the wash critter on the first spawn; the type is
// registered at once so every list of types knows it)
let CrawlerReal = null;
const crawlerType = () => {
  if (CrawlerReal || !ENTITY_TYPES.washCrawler) return CrawlerReal;
  CrawlerReal = class GalCrawler extends ENTITY_TYPES.washCrawler {
    art(c, x, y, mode) { const e = { dir: this.dir, gst: mode === 'notice' ? 'polish' : 'fly' }; c.save(); c.translate(x, y - 15); c.rotate(this.ay ? -Math.PI / 2 * Math.sign(this.dirU || 1) : 0); Tour.galKit.gnatArt(c, e, 0, 0, 'fly', this.t); c.restore(); }
  };
  return CrawlerReal;
};
ENTITY_TYPES.galCrawler = class GalCrawlerShim extends Ent { constructor(g, s) { const C = crawlerType(); if (C) return new C(g, s); super(g, s, 26, 30); this.remove = true; } update() {} touchPlayer() {} draw() {} };
Object.assign(Tour.pieces, {
  // a cord rack with its top-left cell at the letter: { w, h, holes: [[dx, dy], ...] }
  'gal.rack'(st, o) {
    const B = st.B, x0 = st.x, y0 = st.gy - 1, nid = 'gr' + (++rackN), holes = (o.holes || []).map(([dx, dy]) => [x0 + dx, y0 + dy]);
    B.zone(x0, y0, o.w, o.h, 0, 0, 0, 'washNet', { holes, nid, pulse: true });
    B.spawn('galRack', x0, y0, { tx: x0, ty: y0, w: o.w, h: o.h, holes, nid });
    return st.x;
  },
  // { face, ax, ay, speed, phase }
  'gal.crawler'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    const z = B.zones.find(q => q.kind === 'washNet' && x * TS >= q.x && x * TS < q.x + q.w && y * TS >= q.y && y * TS < q.y + q.h);
    B.spawn('galCrawler', x, y, { nid: z ? z.nid : null, face: o.face || 0, kind: 'moth', ax: o.ax || 0, ay: o.ay || 0, speed: o.speed || 1.1, phase: o.phase || 0 });
    return st.x;
  }
});

Object.assign(TourLandscape.ARCH_LABEL, { sitter: 'HOLD STILL', vantage: 'PERSPECTIVE', scrape: 'UNDERPAINTING', pivot: 'HANG IT CROOKED', auction: 'AUCTION' });
Object.assign(Tour.galKit, { setRect, hideRect, carriage, openRopes, hint, breathRing, BREATH, GalSitter, GalViewer, GalRidge, GalTumble, GalLot, GalPaddle, GalSitting, GalRack });
try { if (typeof window !== 'undefined') window.BRADY_GAL = { phys: (b, inp, A, dt, pl, o) => playerPhysicsFlip(b, inp, A, dt, pl, o), spikeContact: (b, A) => spikeContact(b, A), lavaContact: (b, A) => lavaContact(b, A), kit: Tour.galKit }; } catch (e) { /* not in a browser */ }
})();
