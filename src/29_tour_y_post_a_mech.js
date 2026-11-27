/* ============================================================
   POSTMARK SOUND: the land's mechanics (world 27).
   Shared: the area system `post` (rides onto the built area and the checker's copy), the THROW claim (a prop takes
   the action button only while Brady touches it or stands on its mark, and keeps it while the button stays held:
   no puffs or lasers fly then), the land's secret tell (a dog-eared corner of the print curling up, fluttering).
   27-1 PERFORATE  paper islands outlined by perforations: walk over every tooth of an island's dotted top edge and it
                   tears free: it trembles (the tell), then falls and lands below as a plug over the ink. Jump off
                   first. Two islands can share a tooth: tearing it counts for both.
   27-2 STAMPDUTY  a loose stamp on a rail: stand at it and walk to roll it along the left page; THROW prints its raised
                   shape as a solid foothold on the facing page, mirrored across the gutter (the ink silhouette shows
                   where, live). A new print replaces the last one.
   27-3 BLOTTER    a blotting pad on a rail: walk it under the bead swelling on the pen nib overhead (its shadow shows
                   where it drops) to drink it, then push the inky pad into the printed surf: it drinks a gap and the
                   paper boat waiting behind sails through to make a bridge. A saturated pad dries when Brady jumps up
                   and slaps the overhead blotter.
   27-4 FOLD       at a crease mark, hold THROW and walk back: the far bank's flap folds down toward Brady until the
                   edges meet and it locks as a bridge. Let go early and it springs back. The last flap only stays if
                   Brady stands on its printed side before he lets go.
   27-5 SCALE      a map scale (a ruler) on the quay: walk right on it to enlarge the printed harbour around its brass
                   pin, left to shrink it, slowly; step off the end and the harbour locks at that size.
   27-6 ADDRESS    a torn address in two halves: stand on their crease plate and they slide together; the incoming
                   postmark (a dotted ring settles first) cancels the whole address and the barrier lifts.
   The checker: each puzzle's result is a toggle group (B tiles: the plug, the print, the bridge, the boat, the scaled
   harbour; A tiles: what goes away) with its switch where the puzzle is solved; the game sets the tiles itself.
   ============================================================ */
(function () {
const K = Tour.postKit, INK = K.INK, PA = K.PostArt;
const PAPER = K.PAPER, PAPER_HI = K.PAPER_HI, PAPER_LO = K.PAPER_LO, COBALT = K.COBALT, COBALT_HI = K.COBALT_HI, COBALT_LO = K.COBALT_LO, CORAL = K.CORAL, BLACK = K.BLACK, WHITE = K.WHITE;
LIQUIDS.post_ink = ['#2a2850', '#16142e', '#08060f', 'rgba(150,160,255,0.35)', null, 'rgba(255,255,255,0.75)'];

/* ---------------- the `post` area system ---------------- */
if (TourBuild.SYSTEMS.indexOf('post') < 0) TourBuild.SYSTEMS.push('post');
{
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.post) A.post = area.post; return A; };
}
const inPost = g => !!(g && g.area && g.area.post);
// standing on tile (x, floor row y)?
const standsOn = (p, x, y, r) => p && !p.dead && p.onGround && p.groundTy === y && Math.abs(p.cx - (x * TS + TS / 2)) < TS * (r || 0.6);
const setRect = (g, r, t, onlyEmpty) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) { if (onlyEmpty && t !== T.EMPTY && tileAt(g.area, x, y) !== T.EMPTY) continue; g.setTile(x, y, t); } };
const hideRect = (g, r, v) => { const A = g.area; if (!A.hide) return; for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) if (x >= 0 && y >= 0 && x < A.W && y < A.H) A.hide[y * A.W + x] = v; };
const bbox = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };
const fitBox = (e, pts, padX, padTop, padBot) => { const b = bbox(pts); e.x = (b[0] - (padX || 2)) * TS; e.y = (b[1] - (padTop || 4)) * TS; e.w = (b[2] - b[0] + 1 + 2 * (padX || 2)) * TS; e.h = (b[3] - b[1] + 1 + (padTop || 4) + (padBot || 2)) * TS; };
const rectPts = r => [[r[0], r[1]], [r[2], r[3]]];

/* ---------------- the THROW claim ---------------- */
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (g && inp) g.postInp = inp;
    if (inPost(g) && inp && this.state === 'play' && !this.dead) {
      let claim = null;
      const prev = g.postIn && g.postIn.by;
      if (prev && !prev.remove && prev.postHold && inp.action && prev.postHold(this)) claim = prev;
      if (!claim) for (const e of g.entities) if (e.postClaim && !e.remove && e.postClaim(this)) { claim = e; break; }
      g.postIn = claim ? { pressed: !!inp.actionPressed, held: !!inp.action, by: claim } : null;
      if (claim) inp = Object.assign({}, inp, { actionPressed: false, action: false });
    } else if (g && g.postIn) g.postIn = null;
    return up0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined') {
    const vis0 = TourPicker.visible;
    TourPicker.visible = function (play) { if (play && play.postIn) return false; return vis0.call(this, play); };
  }
}
// the THROW hint over a prop Brady stands at
const throwHint = (e, ctx, x, y, word) => {
  const g = e.g; if (!g.postIn || g.postIn.by !== e) return;
  const p = g.player; if (p) { y = Math.min(y, p.y - 30); x = clamp(x, p.cx - 70, p.cx + 70); }
  ctx.save(); ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(word).width + 14; ctx.fillStyle = 'rgba(22,20,40,0.85)'; rr(ctx, x - w / 2, y - 9 + Math.sin(e.t * 5) * 1.5, w, 18, 9); ctx.fill();
  ctx.fillStyle = '#ffe08a'; ctx.fillText(word, x, y + Math.sin(e.t * 5) * 1.5); ctx.restore();
};
const say = (g, x, y, text, col) => Tour.postKit.pill(g, x, y, text, col);

/* ---------------- the land's secret tell ---------------- */
// a dog-eared corner of the print curling up and fluttering: there is room behind the paper here
Object.assign(Decor, {
  // on a floor (the letter stands on it), under a ceiling (hangs from the tile above), in a wall left or right of it
  postTell(ctx, x, y, t) { PA.corner(ctx, x + 8, y, t, 0, 1.1); },
  postTellCeil(ctx, x, y, t) { PA.corner(ctx, x + 8, y - TS, t, Math.PI, 1.1); },
  postTellWall(ctx, x, y, t) { PA.corner(ctx, x + TS / 2, y - TS / 2 + 6, t, -Math.PI / 2, 1.1); },
  postTellWallR(ctx, x, y, t) { PA.corner(ctx, x + TS / 2, y - TS / 2 - 6, t, Math.PI / 2, 1.1); }
});

/* ======================= 27-1 PERFORATE: tear an island free ======================= */
// { rect: [x0, y0, x1, y1] (the island's tiles), teeth: [x...] (columns along its top edge with a tooth to tear),
// pre: [x...] (teeth already torn), land: [x0, y0, x1, y1] (where it comes to rest: a plug over the ink), g }
// A tooth is torn when Brady's feet pass over it on the island's top. Teeth are shared by position: two islands that
// list the same column on the same row share that tooth.
class PostIsland extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; this.r = s.rect; this.land = s.land;
    fitBox(this, rectPts(s.rect).concat(rectPts(s.land)), 3, 4, 2);
    this.st = 'hold'; this.k = 0; this.stT = 0;
    const T0 = g.postTorn || (g.postTorn = {}); for (const x of s.pre || []) T0[x + ',' + s.rect[1]] = true;
  }
  key(x) { return x + ',' + this.r[1]; }
  torn(x) { return !!(this.g.postTorn && this.g.postTorn[this.key(x)]); }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player, r = this.r;
    if (this.st === 'hold') {
      if (p && !p.dead && p.onGround && p.groundTy === r[1]) {
        for (const x of this.s.teeth) {
          if (this.torn(x)) continue;
          if (Math.abs(p.cx - (x * TS + TS / 2)) < 13) { g.postTorn[this.key(x)] = true; TourKit.sfx('tear', 'select', { vol: 0.35, pitch: 1.6 + Math.random() * 0.3 }); g.burst(x * TS + TS / 2, r[1] * TS, 4, WHITE, 'spark'); }
        }
      }
      if (this.s.teeth.every(x => this.torn(x))) { this.st = 'tremble'; this.stT = 0; Sound.play('break', { vol: 0.4, pitch: 1.4 }); say(g, (r[0] + r[2] + 1) * TS / 2, r[1] * TS - 30, 'TORN FREE! JUMP OFF!', '#ffe08a'); }
    } else if (this.st === 'tremble') {
      this.stT += dt;
      if (this.stT > 1.6) { this.st = 'fall'; this.k = 0; setRect(g, r, T.EMPTY); g.refreshPlatforms && g.refreshPlatforms(); }
    } else if (this.st === 'fall') {
      this.k = Math.min(1, this.k + dt * 2.2);
      if (this.k >= 1) { this.st = 'landed'; setRect(g, this.land, T.HARD); hideRect(g, this.land, 1); g.shake(3); Sound.play('stomp', { pitch: 0.7, vol: 0.5 }); g.burst((this.land[0] + this.land[2] + 1) * TS / 2, this.land[1] * TS, 14, '#c8d0ff', 'dust'); }
    }
  }
  touchPlayer() {}
  // the island: a slab of the printed sheet (harbour print on it), its top edge a perforated line
  paint(ctx, R, sh, rot) {
    const x = R[0] * TS, y = R[1] * TS, w = (R[2] - R[0] + 1) * TS, h = (R[3] - R[1] + 1) * TS;
    ctx.save(); ctx.translate(x + w / 2 + sh, y + h / 2); ctx.rotate(rot || 0); ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, 0, 0, w, h, 3); ctx.fill(); ctx.stroke();
    ctx.save(); rr(ctx, 0, 0, w, h, 3); ctx.clip();
    ctx.fillStyle = '#9ad0f0'; ctx.fillRect(4, 8, w - 8, h - 12);
    PA.scallops(ctx, 4, w - 8, h - 14, 5, COBALT_HI);
    ctx.fillStyle = 'rgba(47,79,200,0.18)'; for (let yy = 12; yy < h - 4; yy += 6) for (let xx = 6; xx < w - 4; xx += 6) ctx.fillRect(xx, yy, 1.4, 1.4);
    ctx.restore();
    ctx.restore();
  }
  draw(ctx) {
    const r = this.r, t = this.t;
    ctx.save();
    if (this.st === 'landed') { this.paint(ctx, this.land, 0, 0.04); ctx.restore(); return; }
    if (this.st === 'fall') {
      const k = this.k, L = this.land, R = [lerp(r[0], L[0], k), lerp(r[1], L[1], k * k), lerp(r[2], L[2], k), lerp(r[3], L[3], k * k)];
      this.paint(ctx, R, 0, Math.sin(k * Math.PI) * 0.5); ctx.restore(); return;
    }
    const sh = this.st === 'tremble' ? Math.sin(t * 60) * 2.5 : 0;
    this.paint(ctx, r, sh, 0);
    // the dotted outline down the sides, and the teeth along the top: intact (coral perforation holes on a white
    // tab) or torn (a ragged white edge with a gap)
    const x0 = r[0] * TS + sh, y = r[1] * TS, x1 = (r[2] + 1) * TS + sh, yb = (r[3] + 1) * TS;
    ctx.strokeStyle = CORAL; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x0 + 2, y + 6); ctx.lineTo(x0 + 2, yb - 2); ctx.moveTo(x1 - 2, y + 6); ctx.lineTo(x1 - 2, yb - 2); ctx.stroke(); ctx.setLineDash([]);
    for (const tx of this.s.teeth) {
      const cx = tx * TS + TS / 2 + sh, torn = this.torn(tx);
      if (!torn) {
        const k = 0.5 + 0.5 * Math.sin(t * 4 + tx);
        ctx.fillStyle = WHITE; ctx.fillRect(cx - 15, y - 3, 30, 7);
        const seam = this.s.seam === tx;
        if (seam) { ctx.fillStyle = COBALT_HI; ctx.fillRect(cx, y - 3, 15, 7); }
        for (let q = -12; q <= 12; q += 6) { ctx.fillStyle = seam && q > 0 ? COBALT_LO : CORAL; ctx.beginPath(); ctx.arc(cx + q, y + 0.5, 2.2, 0, TAU); ctx.fill(); }
        if (seam) { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(cx - 15, y - 3, 30, 7); ctx.beginPath(); ctx.moveTo(cx, y - 7); ctx.lineTo(cx, y + 8); ctx.stroke(); }
        ctx.strokeStyle = `rgba(244,122,90,${0.3 + 0.4 * k})`; ctx.lineWidth = 1.5; ctx.strokeRect(cx - 15, y - 3, 30, 7);
      } else {
        ctx.fillStyle = WHITE; ctx.beginPath(); ctx.moveTo(cx - 15, y + 4); for (let q = -15; q <= 15; q += 3) ctx.lineTo(cx + q, y + 1 + ((q / 3) % 2 ? 3 : 0)); ctx.lineTo(cx + 15, y + 4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(26,22,48,0.6)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    ctx.restore();
  }
}
ENTITY_TYPES.postIsland = PostIsland;
Tour.pieces['post.island'] = function (st, o) {
  const B = st.B; B.spawn('postIsland', st.x, st.gy - 1, o);
  for (let y = o.rect[1]; y <= o.rect[3]; y++) for (let x = o.rect[0]; x <= o.rect[2]; x++) { B.set(x, y, T.HARD); B.setHide(x, y, 1); }
  if (o.g != null) { B.toggle(o.g, [o.rect.slice(0, 4)], [o.land.slice(0, 4)], { kind: 'postIsland' }); B.switchAt(o.g, o.sw != null ? o.sw : o.teeth[o.teeth.length - 1], o.rect[1] - 1); }
  return st.x;
};

/* ======================= the carriage: a prop on a floor rail that rolls along with Brady ======================= */
// { rail: [x0, x1, y] (the carriage's left tile from x0 to x1; y the floor row), w (tiles), at (start tile) }
// While Brady stands on the rail row over the carriage, it rolls with him (centred under him); when he steps off it
// it settles on the nearest whole tile.
const carriage = {
  init(e, s) { e.rail = s.rail; e.cw = s.w || 2; e.cxF = ((s.at != null ? s.at : s.rail[0]) + e.cw / 2) * TS; e.holding = false; },
  sx(e) { return Math.round(e.cxF / TS - e.cw / 2); },
  update(e, dt) {
    const p = e.g.player, R = e.rail, lo = (R[0] + e.cw / 2) * TS, hi = (R[1] + e.cw / 2) * TS;
    e.holding = !!(p && !p.dead && p.onGround && p.groundTy === R[2] && Math.abs(p.cx - e.cxF) < e.cw * TS / 2 + 2 && p.cx > lo - e.cw * TS / 2 && p.cx < hi + e.cw * TS / 2);
    if (e.holding) { const nx = clamp(p.cx, lo, hi); if (Math.abs(nx - e.cxF) > 0.5 && !e.rollT) TourKit.sfx('roll', 'select', { vol: 0.12, pitch: 0.6 }); e.cxF = nx; }
    else { const tgt = (carriage.sx(e) + e.cw / 2) * TS; e.cxF = lerp(e.cxF, tgt, Math.min(1, dt * 10)); }
  },
  drawRail(ctx, e) {
    const R = e.rail, y = R[2] * TS, x0 = R[0] * TS + 4, x1 = (R[1] + e.cw) * TS - 4;
    ctx.save(); ctx.strokeStyle = 'rgba(26,22,48,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y + 4); ctx.lineTo(x1, y + 4); ctx.stroke();
    ctx.fillStyle = 'rgba(26,22,48,0.55)'; for (let x = R[0]; x <= R[1] + e.cw; x++) ctx.fillRect(x * TS - 1, y + 1, 2, 7);
    for (const xx of [x0, x1]) { ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(xx, y + 4, 3.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
};

/* ---------------- the camera looks where a prop's effect lands (the print, the bead) while Brady has the prop ---------------- */
{
  const uc0 = Play.prototype.updateCamera;
  Play.prototype.updateCamera = function (dt) {
    const r = uc0.apply(this, arguments), L = this.postLook, p = this.player;
    if (L != null && p && inPost(this)) {
      const want = clamp((p.cx + L) / 2 - Game.viewW / 2, 0, Math.max(0, this.area.W * TS - Game.viewW));
      this.postCamX = this.postCamX == null ? this.camX : lerp(this.postCamX, want, Math.min(1, (dt || 1 / 60) * 3));
      this.camX = this.postCamX;
    } else this.postCamX = null;
    this.postLook = null;
    return r;
  };
}

/* ======================= 27-2 STAMP DUTY: print a mirrored foothold ======================= */
// { rail, w, at (carriage), crease: X (the gutter is the line x = X tiles: column c prints at 2X - 1 - c), shape:
// [[dx, dy]...] (raised cells: dx from the stamp's left tile, dy rows down from ty), ty (the top row it prints at),
// good (the left tile that prints the foothold the page needs), g }
class PostStamp extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; carriage.init(this, s);
    this.set = []; this.flash = 0; this.shapeW = Math.max(...s.shape.map(c => c[0])) + 1;
    const pts = [[s.rail[0], s.rail[2]], [s.rail[1] + this.cw, s.rail[2]]];
    for (const c of this.cells(s.rail[0]).concat(this.cells(s.rail[1]))) pts.push(c);
    fitBox(this, pts, 2, 5, 2);
  }
  cells(sx) { const X = this.s.crease; return this.s.shape.map(([dx, dy]) => [2 * X - 1 - (sx + dx), this.s.ty + dy]); }
  postClaim() { return this.holding; }
  update(dt) {
    this.t += dt; carriage.update(this, dt); if (this.flash > 0) this.flash -= dt;
    if (this.holding) { const c = this.cells(carriage.sx(this)); this.g.postLook = c.reduce((a, q) => a + q[0] * TS + TS / 2, 0) / c.length; }
    const I = this.g.postIn;
    if (I && I.by === this && I.pressed) this.print();
  }
  print() {
    const g = this.g, p = g.player;
    for (const [x, y] of this.set) if (tileAt(g.area, x, y) === T.HARD) { g.setTile(x, y, T.EMPTY); }
    this.set = [];
    const sx = carriage.sx(this);
    for (const [x, y] of this.cells(sx)) {
      if (tileAt(g.area, x, y) !== T.EMPTY) continue;
      if (p && p.x < (x + 1) * TS && p.x + p.w > x * TS && p.y < (y + 1) * TS && p.y + p.h > y * TS) continue;
      g.setTile(x, y, T.HARD); this.set.push([x, y]);
    }
    this.flash = 0.6; this.used = true; g.shake(3); Sound.play('stomp', { pitch: 0.9, vol: 0.6 }); TourKit.sfx('thunk', 'bump', { vol: 0.5, pitch: 0.8 });
    const c = this.cells(sx)[0]; if (c) g.burst(c[0] * TS + TS / 2, c[1] * TS + TS / 2, 12, '#3a4ad8', 'dust');
    if (p) say(g, p.cx, p.y - 24, sx === this.s.good ? 'PRINTED! A FOOTHOLD' : 'PRINTED... (DOES IT FIT?)', sx === this.s.good ? '#ffe08a' : '#c8d8ff');
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, X = s.crease;
    ctx.save();
    // the gutter: the album's middle fold, a dashed line up the page
    ctx.strokeStyle = 'rgba(26,22,48,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(X * TS, this.y); ctx.lineTo(X * TS, this.y + this.h); ctx.stroke(); ctx.setLineDash([]);
    carriage.drawRail(ctx, this);
    // the ink silhouette: where THROW would print now (bold while Brady has the stamp)
    const sx = carriage.sx(this), live = this.holding, k = 0.5 + 0.5 * Math.sin(t * 6);
    for (const [x, y] of this.cells(sx)) {
      if (this.set.some(q => q[0] === x && q[1] === y)) continue;
      ctx.fillStyle = live ? `rgba(30,52,144,${0.22 + 0.18 * k})` : 'rgba(30,52,144,0.1)'; ctx.fillRect(x * TS + 2, y * TS + 2, TS - 4, TS - 4);
      ctx.strokeStyle = live ? `rgba(30,52,144,${0.6 + 0.35 * k})` : 'rgba(30,52,144,0.3)'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.strokeRect(x * TS + 2, y * TS + 2, TS - 4, TS - 4); ctx.setLineDash([]);
    }
    // the printed footholds: inked cobalt with a white printed wave and a fresh-ink shine
    for (const [x, y] of this.set) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x * TS + 3, y * TS + 3, TS - 6, 4); if (this.flash > 0) { ctx.strokeStyle = `rgba(255,224,138,${this.flash})`; ctx.lineWidth = 3; ctx.strokeRect(x * TS, y * TS, TS, TS); } }
    // the stamp itself: a wooden block on two little wheels, a knob on top, its rubber face showing the raised shape
    const cx = this.cxF, y0 = s.rail[2] * TS, w = this.cw * TS - 6, h = 40;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#5a3a22'; for (const dx of [-w / 2 + 8, w / 2 - 8]) { ctx.beginPath(); ctx.arc(cx + dx, y0 - 5, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#c8884a'; rr(ctx, cx - w / 2, y0 - 10 - h * 0.55, w, h * 0.55, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a86a32'; ctx.fillRect(cx - w / 2 + 3, y0 - 14, w - 6, 3);
    ctx.fillStyle = CORAL; ctx.beginPath(); ctx.ellipse(cx, y0 - 10 - h * 0.55 - 8, 10, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(cx - 3, y0 - 10 - h * 0.55 - 2, 6, 4);
    // the rubber face, seen on the block's front: the raised shape as it is on the stamp (it prints the other way round)
    const c = 7, fx = cx - (this.shapeW * c) / 2, fy = y0 - 10 - h * 0.55 + 4;
    for (const [dx, dy] of s.shape) { ctx.fillStyle = '#2a2a48'; ctx.fillRect(fx + dx * c, fy + dy * c, c - 1, c - 1); }
    // and the same face on a little tag on a stalk behind it, so Brady never hides it: "the stamp's face"
    const tx = cx - w / 2 - 6, tyy = y0 - 96, cs = 9, sw2 = this.shapeW * cs + 12, sh2 = (Math.max(...s.shape.map(q => q[1])) + 1) * cs + 20;
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(tx - 1.5, tyy + sh2, 3, y0 - 30 - tyy - sh2); ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; rr(ctx, tx - sw2 / 2, tyy, sw2, sh2, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('FACE', tx, tyy + 8);
    for (const [dx, dy] of s.shape) { ctx.fillStyle = COBALT; ctx.fillRect(tx - sw2 / 2 + 6 + dx * cs, tyy + 13 + dy * cs, cs - 1, cs - 1); }
    throwHint(this, ctx, cx, y0 - 128, 'WALK TO ROLL IT · THROW TO PRINT');
    ctx.restore();
  }
}
ENTITY_TYPES.postStamp = PostStamp;
Tour.pieces['post.stamp'] = function (st, o) {
  const B = st.B; B.spawn('postStamp', st.x, st.gy - 1, o);
  if (o.g != null) {
    const tmp = { s: o, cw: o.w || 2, shapeW: Math.max(...o.shape.map(c => c[0])) + 1 };
    const cells = PostStamp.prototype.cells.call(tmp, o.good);
    B.toggle(o.g, [], cells.filter(([x, y]) => B.get(x, y) === T.EMPTY).map(([x, y]) => [x, y, x, y]), { kind: 'postStamp' });
    B.switchAt(o.g, o.good + Math.floor((o.w || 2) / 2), o.rail[2] - 1);
  }
  return st.x;
};

/* ======================= 27-3 BLOTTER BAY: drink the surf, let the boat through ======================= */
// { rail, w, at (the pad's carriage; the surf stands right after the rail's end), nib: [x0, x1, y] (the pen's track
// overhead, tiles), surf: [x0, y0, x1, y1] (the printed ink breaker), need: 1 | 2 (beads to drink it all), blotter:
// [x, y] (the overhead blotter tile, need 2), boat: { at: [x, y] (its berth, pixels of its keel centre, tiles),
// dock: [x0, y, x1] (the SEMI row it makes) }, every (s between beads), g }
class PostBlotter extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; carriage.init(this, s);
    this.pad = 'dry'; this.drunk = 0; this.bead = null; this.beadT = 0.6; this.surfK = 0; this.boatK = 0; this.done = false; this.st = 'wait';
    hideRect(g, s.surf, 1);
    fitBox(this, [[s.rail[0], s.rail[2]], [s.rail[1] + this.cw, s.rail[2]], [s.nib[0], s.nib[2]], [s.nib[1], s.nib[2]], [s.surf[0], s.surf[1]], [s.surf[2], s.surf[3]], [s.boat.dock[0], s.boat.dock[1]], [s.boat.dock[2], s.boat.dock[1]], s.boat.at], 3, 3, 3);
  }
  postClaim() { return this.holding && !this.done; }
  nibX() { const s = this.s, k = 0.5 - 0.5 * Math.cos(this.t * (s.nibSpeed || 0.7)); return (lerp(s.nib[0], s.nib[1], k) + 0.5) * TS; }
  surfCols() { const s = this.s, n = s.surf[2] - s.surf[0] + 1, need = s.need || 1, gone = Math.round(n * this.drunk / need); return [s.surf[0], s.surf[0] + gone - 1]; }
  update(dt) {
    this.t += dt; carriage.update(this, dt);
    const g = this.g, s = this.s, p = g.player, padL = this.cxF - this.cw * TS / 2, padR = this.cxF + this.cw * TS / 2;
    if (this.done) { if (this.boatK < 1) { this.boatK = Math.min(1, this.boatK + dt / 1.6); if (this.boatK >= 1) { for (let x = s.boat.dock[0]; x <= s.boat.dock[2]; x++) if (tileAt(g.area, x, s.boat.dock[1]) === T.EMPTY) g.setTile(x, s.boat.dock[1], T.SEMI); hideRect(g, [s.boat.dock[0], s.boat.dock[1], s.boat.dock[2], s.boat.dock[1]], 1); g.refreshPlatforms && g.refreshPlatforms(); Sound.play('secret', { vol: 0.4 }); say(g, s.boat.dock[0] * TS + 40, s.boat.dock[1] * TS - 30, 'THE BOAT IS THROUGH!', '#ffe08a'); } } return; }
    // the bead swelling on the nib (the tell: its shadow on the quay), then it drops
    if (!this.bead) { this.beadT -= dt; if (this.beadT <= 0) this.bead = { x: this.nibX(), y: (s.nib[2] + 1) * TS, r: 0, vy: 0, st: 'grow' }; }
    else {
      const b = this.bead;
      if (b.st === 'grow') { b.x = this.nibX(); b.r = Math.min(9, b.r + dt * 6.5); if (b.r >= 9) { b.st = 'fall'; TourKit.sfx('drip', 'select', { vol: 0.3, pitch: 0.6 }); } }
      else {
        b.vy += PHYS.gDown * 0.35 * dt; b.y += b.vy * dt;
        const floorY = s.rail[2] * TS - 10;
        if (b.y >= floorY) {
          if (b.x > padL - 4 && b.x < padR + 4 && this.pad === 'dry') { this.pad = 'inky'; TourKit.sfx('gulp', 'pick', { vol: 0.5, pitch: 0.7 }); g.burst(b.x, floorY, 8, '#3a3a6a', 'dust'); say(g, this.cxF, floorY - 50, 'IT DRANK THE INK! PUSH IT INTO THE SURF', '#ffe08a'); }
          else { g.burst(b.x, floorY + 8, 6, '#3a3a6a', 'dust'); if (b.x > padL - 4 && b.x < padR + 4) say(g, this.cxF, floorY - 50, this.pad === 'full' ? 'TOO SOGGY! SLAP IT ON THE BLOTTER' : 'IT IS FULL', '#c8d8ff'); }
          this.bead = null; this.beadT = s.every || 1.2;
        }
      }
    }
    // the inky pad pushed against the surf drinks a gap in it
    if (this.pad === 'inky' && this.holding && carriage.sx(this) >= s.rail[1] && Math.abs(this.cxF - (s.rail[1] + this.cw / 2) * TS) < 6) {
      this.drunk++; this.pad = (s.need || 1) > this.drunk ? 'full' : 'dry';
      const [a, b2] = this.surfCols(); for (let x = s.surf[0]; x <= b2; x++) for (let y = s.surf[1]; y <= s.surf[3]; y++) g.setTile(x, y, T.EMPTY);
      g.shake(3); TourKit.sfx('gulp', 'pick', { vol: 0.6, pitch: 0.5 }); g.burst((s.surf[0] + 0.5) * TS, (s.surf[1] + 1) * TS, 16, '#1e1e3a', 'dust');
      if (this.drunk >= (s.need || 1)) { this.done = true; this.boatK = 0; say(g, this.cxF, s.rail[2] * TS - 60, 'A GAP IN THE SURF!', '#ffe08a'); }
      else say(g, this.cxF, s.rail[2] * TS - 60, 'HALF A GAP! DRY THE PAD ON THE BLOTTER', '#ffe08a');
    }
    // a saturated pad dries when Brady jumps up from over it and slaps the overhead blotter
    if (this.pad === 'full' && s.blotter && p && !p.dead && p.vy < 0) {
      const bx = s.blotter[0] * TS + TS / 2, by = (s.blotter[1] + 1) * TS;
      if (Math.abs(p.cx - bx) < TS * 1.2 && p.y < by + 6 && Math.abs(this.cxF - bx) < TS * 1.6) { this.pad = 'dry'; this.slapT = 0.4; TourKit.sfx('slap', 'bump', { vol: 0.6, pitch: 0.9 }); g.burst(bx, by, 10, '#c8b8a0', 'dust'); say(g, bx, by + 70, 'SLAP! DRY AGAIN', '#ffe08a'); }
    }
    if (this.slapT > 0) this.slapT -= dt;
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, g = this.g;
    ctx.save();
    carriage.drawRail(ctx, this);
    // the pen's track overhead and the pen nib riding it
    const ny = (s.nib[2] + 0.5) * TS, nx = this.nibX();
    ctx.strokeStyle = 'rgba(26,22,48,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.nib[0] * TS, ny - 14); ctx.lineTo((s.nib[1] + 1) * TS, ny - 14); ctx.stroke();
    if (!this.done) {
      ctx.save(); ctx.translate(nx, ny); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = BLACK; rr(ctx, -6, -26, 12, 18, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(0, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      if (this.bead) {
        const b = this.bead, fy = s.rail[2] * TS;
        const k = b.st === 'grow' ? b.r / 9 : 1;
        ctx.fillStyle = `rgba(16,14,40,${0.2 + 0.4 * k})`; ctx.beginPath(); ctx.ellipse(b.x, fy - 2, 8 + 10 * k, 4, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(244,122,90,${0.4 + 0.5 * k})`; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(b.x, fy - 2, 12 + 10 * k, 6, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#1e1e48'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.x, b.y - b.r * 1.6); ctx.quadraticCurveTo(b.x + b.r, b.y, b.x, b.y + b.r); ctx.quadraticCurveTo(b.x - b.r, b.y, b.x, b.y - b.r * 1.6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.1, b.r * 0.25, 0, TAU); ctx.fill();
      }
    }
    // the overhead blotter (a rocker blotter hanging on two cords)
    if (s.blotter) {
      const bx = s.blotter[0] * TS + TS / 2, by = s.blotter[1] * TS, sl = this.slapT > 0 ? -4 : 0;
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 20, by - 30); ctx.lineTo(bx - 20, by + sl); ctx.moveTo(bx + 20, by - 30); ctx.lineTo(bx + 20, by + sl); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.moveTo(bx - 30, by + sl); ctx.lineTo(bx + 30, by + sl); ctx.quadraticCurveTo(bx + 30, by + 22 + sl, bx, by + 24 + sl); ctx.quadraticCurveTo(bx - 30, by + 22 + sl, bx - 30, by + sl); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8a5a2a'; rr(ctx, bx - 8, by - 10 + sl, 16, 10, 3); ctx.fill(); ctx.stroke();
      if (this.pad === 'full') { const k = 0.5 + 0.5 * Math.sin(t * 7); ctx.strokeStyle = `rgba(255,224,138,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(bx, by + 12, 38 + k * 4, 20 + k * 3, 0, 0, TAU); ctx.stroke(); }
    }
    // the printed surf: black ink breakers with cobalt crests (the part already drunk is gone)
    if (!this.done || this.surfK < 1) {
      const [a, b2] = this.surfCols(), x0 = (b2 + 1) * TS, x1 = (s.surf[2] + 1) * TS, y0 = s.surf[1] * TS, y1 = (s.surf[3] + 1) * TS;
      if (x1 > x0 && !this.done) {
        ctx.fillStyle = BLACK; ctx.beginPath(); ctx.moveTo(x0, y1);
        for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, y0 + 6 + Math.sin(x * 0.2 + t * 3) * 4);
        ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y0 - 20, x1 - x0, y1 - y0 + 20); ctx.clip();
        for (let x = x0 + 10; x < x1; x += 26) { ctx.fillStyle = COBALT; ctx.beginPath(); ctx.arc(x, y0 + 4, 10, Math.PI, 0); ctx.fill(); ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(x + 3, y0 + 2, 3, 0, TAU); ctx.fill(); }
        ctx.restore();
        ctx.fillStyle = BLACK; ctx.beginPath(); ctx.moveTo(x1 - 6, y0 + 10); ctx.quadraticCurveTo(x1 + 6, y0 + 16, x1, y0 + 26); ctx.fill();
      }
    }
    // the paper boat: waiting behind the surf, then sailing through the gap to its dock
    const D = s.boat.dock, sy = 1.7, from = [s.boat.at[0] * TS, s.boat.at[1] * TS + 13 * sy], to = [(D[0] + D[2] + 1) * TS / 2, D[1] * TS + 13 * sy];
    const k = this.done ? this.boatK : 0, bxp = lerp(from[0], to[0], k), byp = lerp(from[1], to[1], k) + (k >= 1 ? 0 : Math.sin(t * 2) * 2);
    PA.boat(ctx, bxp, byp, ((D[2] - D[0] + 1) * TS) / 60, null, sy);
    // the pad: a curved rocker blotter on the rail, its felt dry (cream), inky (dark), or soaked
    const cx = this.cxF, fy = s.rail[2] * TS, w = this.cw * TS - 4;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = this.pad === 'dry' ? '#f4ecd8' : this.pad === 'inky' ? '#2a2a58' : '#1a1a30';
    ctx.beginPath(); ctx.moveTo(cx - w / 2, fy - 14); ctx.lineTo(cx + w / 2, fy - 14); ctx.quadraticCurveTo(cx + w / 2, fy, cx, fy); ctx.quadraticCurveTo(cx - w / 2, fy, cx - w / 2, fy - 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a5a2a'; rr(ctx, cx - w / 2 + 4, fy - 22, w - 8, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(cx, fy - 26, 5, 0, TAU); ctx.fill(); ctx.stroke();
    if (this.pad === 'inky') { const k2 = 0.5 + 0.5 * Math.sin(t * 8); ctx.strokeStyle = `rgba(255,224,138,${0.5 + 0.4 * k2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, fy - 10, w / 2 + 6 + k2 * 3, 16, 0, 0, TAU); ctx.stroke(); }
    throwHint(this, ctx, cx, fy - 90, this.pad === 'inky' ? 'PUSH IT INTO THE SURF' : this.pad === 'full' ? 'SOGGY: JUMP AND SLAP THE BLOTTER' : 'WALK IT UNDER THE BEAD');
    ctx.restore();
  }
}
ENTITY_TYPES.postBlotter = PostBlotter;
Tour.pieces['post.blotter'] = function (st, o) {
  const B = st.B; B.spawn('postBlotter', st.x, st.gy - 1, o);
  for (let y = o.surf[1]; y <= o.surf[3]; y++) for (let x = o.surf[0]; x <= o.surf[2]; x++) { B.set(x, y, T.HARD); B.setHide(x, y, 1); }
  if (o.g != null) {
    const D = o.boat.dock, Bt = []; for (let x = D[0]; x <= D[2]; x++) if (B.get(x, D[1]) === T.EMPTY) Bt.push([x, D[1], x, D[1], T.SEMI]);
    B.toggle(o.g, [o.surf.slice(0, 4)], Bt, { kind: 'postBlotter' }); B.switchAt(o.g, o.rail[1] + Math.floor((o.w || 2) / 2), o.rail[2] - 1);
  }
  return st.x;
};

/* ======================= 27-4 FORWARDING FOLD: fold the far bank over ======================= */
// { mark: [x, y] (the crease mark: floor tile), hinge: x (the far bank's first column), y (the bank's floor row),
// len (the pit's width: the flap stands len tall on the far bank and folds down over the pit), pull (tiles to walk
// back: default len), last (the flap only stays if Brady stands on it before he lets go), cover: [x0, y0, x1, y1] (the
// last flap's tuck covers this when it goes the wrong way), g }
class PostFold extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s;
    this.ang = 0; this.st = 'up'; this.tuck = 0; this.temp = false; this.pullFrom = null;
    const H = s.hinge, L = s.len, y = s.y;
    this.A = [H, y - L, H, y - 1]; this.Bt = [H - L, y, H - 1, y];
    hideRect(g, this.A, 1);
    fitBox(this, [[s.mark[0], s.mark[1]], [H, y - L - 1], [H - L, y], [H + 1, y]], 3, 3, 2);
  }
  postClaim(p) { return this.st !== 'down' && standsOn(p, this.s.mark[0], this.s.mark[1], 0.8); }
  postHold(p) { return this.st !== 'down' && !p.dead; }
  update(dt) {
    this.t += dt; const g = this.g, s = this.s, p = g.player, I = g.postIn, held = !!(I && I.by === this && I.held);
    if (this.tuck > 0) this.tuck = Math.max(0, this.tuck - dt);
    if (this.st === 'down') return;
    if (held) {
      if (this.pullFrom == null) { this.pullFrom = p.cx; TourKit.sfx('rustle', 'select', { vol: 0.3, pitch: 0.7 }); }
      const want = clamp((this.pullFrom - p.cx) / ((s.pull || s.len) * TS), 0, 1);
      this.ang = Math.max(this.ang, want);
      if (this.ang >= 1) {
        if (!s.last) return this.lock();
        if (!this.temp) { this.temp = true; setRect(g, this.Bt, T.SEMI, true); setRect(g, this.A, T.EMPTY); g.refreshPlatforms && g.refreshPlatforms(); say(g, p.cx, p.y - 26, 'KEEP HOLDING: STEP ONTO THE PRINTED SIDE', '#ffe08a'); }
      }
    } else {
      if (this.pullFrom != null && this.temp) {
        const on = p && !p.dead && p.onGround && p.groundTy === s.y && p.cx > this.Bt[0] * TS && p.cx < (this.Bt[2] + 1) * TS;
        if (on) return this.lock();
        // let go off the printed side: the flap tucks the wrong way (over the exit) and springs back up
        setRect(g, this.Bt, T.EMPTY); setRect(g, this.A, T.HARD); g.refreshPlatforms && g.refreshPlatforms();
        this.temp = false; this.tuck = 1.6; this.ang = 0; Sound.play('bump', { vol: 0.5, pitch: 0.6 }); say(g, p.cx, p.y - 26, 'TUCKED IN! STAND ON THE PRINTED SIDE FIRST', '#ffb0a0');
      } else if (this.pullFrom != null && this.ang < 1) { if (this.ang > 0.05) { Sound.play('bump', { vol: 0.3, pitch: 1.2 }); say(g, p.cx, p.y - 26, 'IT SPRANG BACK: HOLD THROW ALL THE WAY', '#c8d8ff'); } }
      this.pullFrom = null;
      this.ang = Math.max(0, this.ang - dt * 3);
    }
  }
  lock() {
    const g = this.g, p = g.player; this.st = 'down'; this.ang = 1; this.temp = false;
    setRect(g, this.A, T.EMPTY); setRect(g, this.Bt, T.SEMI, true); g.refreshPlatforms && g.refreshPlatforms();
    g.shake(3); Sound.play('stomp', { pitch: 0.8, vol: 0.5 }); TourKit.sfx('fold', 'select', { vol: 0.5, pitch: 0.6 });
    if (p) say(g, p.cx, p.y - 26, 'THE EDGES MEET!', '#ffe08a');
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, H = s.hinge, L = s.len, y = s.y, hx = H * TS, hy = y * TS;
    ctx.save();
    // the crease mark: a dashed fold line across the quay, with a coral tab
    const mx = s.mark[0] * TS + TS / 2, my = s.mark[1] * TS;
    if (this.st !== 'down') { ctx.strokeStyle = CORAL; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(mx, my - 50); ctx.lineTo(mx, my + 8); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(244,122,90,0.5)'; ctx.beginPath(); ctx.ellipse(mx, my + 2, 14, 4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = CORAL; ctx.lineWidth = 2; ctx.stroke(); }
    // the pull: a dotted guide from the mark back the way Brady must walk (how far)
    if (this.st !== 'down' && this.g.postIn && this.g.postIn.by === this) { const len = (s.pull || L) * TS; ctx.strokeStyle = 'rgba(255,224,138,0.8)'; ctx.lineWidth = 3; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(mx, my - 6); ctx.lineTo(mx - len, my - 6); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(mx - len - 8, my - 6); ctx.lineTo(mx - len + 2, my - 12); ctx.lineTo(mx - len + 2, my); ctx.closePath(); ctx.fill(); }
    // the flap: a card hinged at the far bank's edge; printed side (harbour print) toward Brady, blank on the back
    const a = (this.st === 'down' ? 1 : this.ang) * Math.PI / 2, wob = this.st === 'up' && this.ang === 0 ? Math.sin(t * 2) * 0.03 : 0;
    const tuckA = this.tuck > 0 ? -Math.sin(Math.min(1, (1.6 - this.tuck) / 0.5) * Math.PI / 2) * Math.PI / 2 * Math.min(1, this.tuck * 2) : 0;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-Math.PI / 2 - a - wob - tuckA);
    const len = L * TS, th = 18;
    // the rotated card: along +x from the hinge; its printed face is the side at -y (facing Brady while it stands)
    const printedUp = tuckA === 0;
    ctx.fillStyle = printedUp ? PAPER : '#e8e0d0'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(0, -th, len, th); ctx.strokeRect(0, -th, len, th);
    if (printedUp) { ctx.fillStyle = '#9ad0f0'; ctx.fillRect(3, -th + 2, len - 6, th - 5); ctx.save(); ctx.beginPath(); ctx.rect(3, -th + 2, len - 6, th - 5); ctx.clip(); PA.scallops(ctx, 3, len, -th + 4, 3, COBALT); ctx.restore(); ctx.fillStyle = CORAL; ctx.fillRect(len - 10, -th, 10, th); }
    ctx.restore();
    // fold lines on the bank while folding
    if (this.ang > 0 && this.st !== 'down') { ctx.strokeStyle = 'rgba(26,22,48,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy + TS); ctx.stroke(); ctx.setLineDash([]); }
    // the wrong way: the tuck covers the exit for a moment (a sheet of blank card over it)
    if (this.tuck > 0 && s.cover) { const C = s.cover; ctx.globalAlpha = Math.min(1, this.tuck * 2); ctx.fillStyle = '#e8e0d0'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, C[0] * TS, C[1] * TS, (C[2] - C[0] + 1) * TS, (C[3] - C[1] + 1) * TS, 6); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
    if (this.st !== 'down') throwHint(this, ctx, mx, my - 90, 'HOLD THROW AND WALK BACK');
    ctx.restore();
  }
}
ENTITY_TYPES.postFold = PostFold;
Tour.pieces['post.fold'] = function (st, o) {
  const B = st.B; B.spawn('postFold', st.x, st.gy - 1, o);
  const H = o.hinge, L = o.len, y = o.y;
  for (let yy = y - L; yy <= y - 1; yy++) { B.set(H, yy, T.HARD); B.setHide(H, yy, 1); }
  if (o.g != null) { B.toggle(o.g, [[H, y - L, H, y - 1]], [[H - L, y, H - 1, y, T.SEMI]], { kind: 'postFold' }); B.switchAt(o.g, o.mark[0], o.mark[1] - 1); }
  return st.x;
};

/* ======================= 27-5 MISMEASURED COAST: the map scale ======================= */
// { bars: [[x0, x1, y]...] (rulers: tiles on floor row y), pin: [x, y] (tiles: the brass pin everything scales
// around), pieces: [[x0, y0, x1, y1]...] (the printed harbour at x1), smin, smax, checks: [{ bar, end: 'big'|'small',
// idx: [pieces], g }] }
// Walking right on a ruler grows the harbour, left shrinks it (slowly); stepping off the ruler locks it at the
// nearest of x smin, x1, x smax.
const scaleRect = (r, s, pin) => { const f = v => Math.round(v); return [f(pin[0] + (r[0] - pin[0]) * s), f(pin[1] + (r[1] - pin[1]) * s), f(pin[0] + (r[2] + 1 - pin[0]) * s) - 1, f(pin[1] + (r[3] + 1 - pin[1]) * s) - 1]; };
class PostScale extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s;
    this.sc = 1; this.lockS = 1; this.live = false; this.offT = 0; this.set = null;
    const pts = [s.pin];
    for (const b of s.bars) pts.push([b[0], b[2]], [b[1], b[2]]);
    for (const r of s.pieces) for (const k of [s.smin, s.smax]) { const q = scaleRect(r, k, s.pin); pts.push([q[0], Math.max(0, q[1])], [q[2], q[3]]); }
    fitBox(this, pts, 3, 4, 3);
  }
  onBar(p) { for (let k = 0; k < this.s.bars.length; k++) { const b = this.s.bars[k]; if (p.groundTy === b[2] && p.cx >= b[0] * TS - 4 && p.cx <= (b[1] + 1) * TS + 4) return k; } return -1; }
  target(p, k) { const b = this.s.bars[k], f = clamp((p.cx - b[0] * TS) / ((b[1] - b[0] + 1) * TS), 0, 1), s = this.s; return f < 0.5 ? lerp(s.smin, 1, f * 2) : lerp(1, s.smax, (f - 0.5) * 2); }
  // the printed harbour is the tiles of the locked size (hidden: this entity draws them as card quays)
  setTiles(sc) {
    const g = this.g, p = g.player, s = this.s, ty = T.GROUND, A = g.area;
    for (const [x, y] of this.set) if (tileAt(A, x, y) === ty) { g.setTile(x, y, T.EMPTY); if (A.hide) A.hide[y * A.W + x] = 0; }
    this.set = [];
    for (const r0 of s.pieces) { const r = scaleRect(r0, sc, s.pin); for (let y = Math.max(0, r[1]); y <= Math.min(A.H - 1, r[3]); y++) for (let x = r[0]; x <= r[2]; x++) { if (tileAt(A, x, y) !== T.EMPTY) continue; if (p && p.x < (x + 1) * TS && p.x + p.w > x * TS && p.y < (y + 1) * TS && p.y + p.h > y * TS) continue; g.setTile(x, y, ty); if (A.hide) A.hide[y * A.W + x] = 1; this.set.push([x, y]); } }
    g.refreshPlatforms && g.refreshPlatforms();
  }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player, s = this.s;
    if (!this.set) { this.set = []; for (const r0 of s.pieces) for (let y = Math.max(0, r0[1]); y <= r0[3]; y++) for (let x = r0[0]; x <= r0[2]; x++) this.set.push([x, y]); }
    if (!p || p.dead) return;
    const k = p.onGround ? this.onBar(p) : (this.live ? this.bar : -1);
    // the ruler wakes when Brady stops on it for a moment (running straight over it changes nothing)
    if (k >= 0 && !this.live) { this.pause = Math.abs(p.vx) < 40 ? (this.pause || 0) + dt : 0; if (this.pause < 0.35) return; }
    if (k < 0) this.pause = 0;
    if (k >= 0) {
      if (!this.live) { this.live = true; this.bar = k; this.sc = this.lockS; TourKit.sfx('ruler', 'select', { vol: 0.3, pitch: 1.2 }); }
      if (p.onGround) { this.bar = k; const tg = this.target(p, k); const d = tg - this.sc; this.sc += clamp(d, -0.55 * dt, 0.55 * dt); }
      g.postLook = s.pin[0] * TS;
      this.offT = 0;
    } else if (this.live) {
      this.offT += dt;
      if (this.offT > 0.05) {
        const opts = [s.smin, 1, s.smax]; let best = 1; for (const o of opts) if (Math.abs(o - this.sc) < Math.abs(best - this.sc)) best = o;
        this.live = false; const was = this.lockS; this.lockS = best; this.sc = best;
        if (best !== was) { this.setTiles(best); g.shake(2); Sound.play('stomp', { pitch: 1.1, vol: 0.4 }); }
        say(g, p.cx, p.y - 26, best === 1 ? 'LOCKED AT ×1' : best > 1 ? 'LOCKED: ×' + best + ' BIGGER' : 'LOCKED: ×' + best + ' SMALLER', '#ffe08a');
      }
    }
  }
  touchPlayer() {}
  quay(ctx, x0, y0, x1, y1) {
    ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    ctx.strokeStyle = 'rgba(150,110,40,0.5)'; ctx.lineWidth = 1.2; for (let y = y0 + 16; y < y1; y += 16) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    ctx.fillStyle = COBALT; ctx.fillRect(x0, y0, x1 - x0, 8); ctx.fillStyle = COBALT_HI; ctx.fillRect(x0, y0, x1 - x0, 2.5);
    ctx.restore();
  }
  draw(ctx) {
    const s = this.s, t = this.t, sc = this.sc, pin = s.pin, px = pin[0] * TS, py = pin[1] * TS;
    ctx.save();
    for (const r of s.pieces) {
      // the harbour as it is now (solid), and while Brady walks the ruler, its outline at the size he is choosing
      const q = scaleRect(r, this.lockS, pin); this.quay(ctx, q[0] * TS, Math.max(0, q[1]) * TS, (q[2] + 1) * TS, (q[3] + 1) * TS);
      if (this.live) {
        const x0 = px + (r[0] * TS - px) * sc, y0 = py + (r[1] * TS - py) * sc, x1 = px + ((r[2] + 1) * TS - px) * sc, y1 = py + ((r[3] + 1) * TS - py) * sc, k = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.fillStyle = `rgba(47,79,200,${0.12 + 0.1 * k})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        ctx.strokeStyle = `rgba(30,52,144,${0.6 + 0.35 * k})`; ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(200,140,40,0.6)'; ctx.lineWidth = 1.4; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x0, y0); ctx.moveTo(px, py); ctx.lineTo(x1, y0); ctx.moveTo(px, py); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // the brass pin
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(px + 4, py + 4, 9, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d8b04a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff0a0'; ctx.beginPath(); ctx.arc(px - 3, py - 3, 3, 0, TAU); ctx.fill();
    // the rulers: a long wooden scale with ticks, its x-min / x1 / x-max marks, a coral slider where Brady stands
    for (let k = 0; k < s.bars.length; k++) {
      const b = s.bars[k], x0 = b[0] * TS, x1 = (b[1] + 1) * TS, y = b[2] * TS;
      ctx.fillStyle = '#f2d890'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(x0, y - 8, x1 - x0, 10); ctx.strokeRect(x0, y - 8, x1 - x0, 10);
      ctx.fillStyle = INK; for (let x = x0; x <= x1; x += 8) ctx.fillRect(x, y - 8, 1.2, (x - x0) % 32 ? 3 : 6);
      ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillStyle = COBALT_LO;
      ctx.fillText('×' + s.smin, x0 + 12, y - 13); ctx.fillText('×1', (x0 + x1) / 2, y - 13); ctx.fillText('×' + s.smax, x1 - 12, y - 13);
      if (this.live && this.bar === k) { const p = this.g.player; ctx.fillStyle = CORAL; ctx.beginPath(); ctx.moveTo(p.cx, y - 8); ctx.lineTo(p.cx - 6, y - 16); ctx.lineTo(p.cx + 6, y - 16); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    if (this.live) {
      const b = s.bars[this.bar], x = ((b[0] + b[1] + 1) / 2) * TS, str = 'HARBOUR ×' + (Math.round(sc * 100) / 100) + ' · STEP OFF TO LOCK';
      ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(str).width + 22;
      const yy = Math.max(b[2] * TS - 120, this.g.camY + 70), xx = clamp(x, this.g.camX + w / 2 + 8, this.g.camX + Game.viewW - w / 2 - 8);
      ctx.fillStyle = 'rgba(22,20,40,0.88)'; rr(ctx, xx - w / 2, yy - 12, w, 24, 12); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillText(str, xx, yy + 1);
    }
    ctx.restore();
  }
}
ENTITY_TYPES.postScale = PostScale;
Tour.pieces['post.scale'] = function (st, o) {
  const B = st.B; B.spawn('postScale', st.x, st.gy - 1, o);
  for (const r of o.pieces) for (let y = Math.max(0, r[1]); y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) { B.set(x, y, T.GROUND); B.setHide(x, y, 1); }
  for (const c of o.checks || []) {
    const b = o.bars[c.bar], s = c.end === 'big' ? o.smax : o.smin, A = [], Bt = [];
    for (const i of c.idx) { const r = o.pieces[i]; A.push(r.slice(0, 4)); const q = scaleRect(r, s, o.pin); Bt.push([q[0], q[1], q[2], q[3], T.GROUND]); }
    B.toggle(c.g, A, Bt, { kind: 'postScale' }); B.switchAt(c.g, c.end === 'big' ? b[1] : b[0], b[2] - 1);
  }
  return st.x;
};

/* ======================= 27-6's lead-in: RETURN TO SENDER: the torn address ======================= */
// { halves: [[x0, x1], [x2, x3]] (tile columns of the two halves at rest), y (the floor row they lie on), plate: [x,
// y] (the crease plate: stand on it and the halves slide together under the drop), drop: x (tile: where the
// postmark lands; the halves meet there), barrier: [x0, y0, x1, y1], period (s), g }
class PostAddress extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s;
    this.k = 0; this.cyc = s.phase || 0; this.done = false; this.liftK = 0; this.mark = null; this.missT = 0;
    hideRect(g, s.barrier, 1);
    fitBox(this, [[s.halves[0][0], s.y], [s.halves[1][1], s.y], s.plate, [s.barrier[0], s.barrier[1]], [s.barrier[2], s.barrier[3]]], 2, 6, 2);
  }
  together() { return this.k > 0.95; }
  update(dt) {
    this.t += dt; const g = this.g, s = this.s, p = g.player;
    const on = standsOn(p, s.plate[0], s.plate[1], 0.9);
    this.k = clamp(this.k + (on ? 2.2 : -1.6) * dt, 0, 1);
    if (this.done) { this.liftK = Math.min(1, this.liftK + dt * 1.5); return; }
    if (this.missT > 0) this.missT -= dt;
    const P = s.period || 4.2; this.cyc += dt;
    const ph = this.cyc % P;
    this.phase = ph < P - 1.4 ? 'idle' : ph < P - 0.25 ? 'ring' : 'drop';
    if (this.phase === 'drop' && !this.dropped) {
      this.dropped = true;
      const dx = s.drop * TS + TS / 2, fy = s.y * TS;
      g.shake(4); Sound.play('stomp', { pitch: 0.55, vol: 0.6 });
      if (p && !p.dead && Math.abs(p.cx - dx) < TS * 1.1 && p.y + p.h > fy - 3 * TS) p.hurt(this);
      if (this.together()) {
        this.done = true; this.mark = { t: 0 }; setRect(g, s.barrier, T.EMPTY); g.refreshPlatforms && g.refreshPlatforms(); Sound.play('secret', { vol: 0.6 });
        say(g, dx, fy - 70, 'CANCELLED! THE ADDRESS IS WHOLE', '#ffe08a');
      } else { this.missT = 1.2; say(g, dx, fy - 70, 'MISSED: THE HALVES WERE APART', '#c8d8ff'); }
    }
    if (this.phase !== 'drop') this.dropped = false;
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, fy = s.y * TS, dx = s.drop * TS + TS / 2;
    ctx.save();
    // the crease plate
    const pxx = s.plate[0] * TS + TS / 2, pyy = s.plate[1] * TS;
    ctx.fillStyle = this.k > 0.5 ? '#ffe08a' : CORAL; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pxx, pyy + 1, 15, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(pxx, pyy - 4); ctx.lineTo(pxx, pyy + 6); ctx.stroke(); ctx.setLineDash([]);
    if (!this.done) { ctx.strokeStyle = 'rgba(255,224,138,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(pxx, pyy - 2); ctx.quadraticCurveTo((pxx + dx) / 2, pyy - 40, dx, fy - 4); ctx.stroke(); ctx.setLineDash([]); }
    // the two halves of the torn address: cards lying on the floor, their torn edges facing, sliding to the drop
    const [h0, h1] = s.halves, k = this.done ? 1 : this.k;
    const w0 = (h0[1] - h0[0] + 1) * TS, w1 = (h1[1] - h1[0] + 1) * TS;
    const l0 = lerp(h0[0] * TS, dx - w0, k), l1 = lerp(h1[0] * TS, dx, k);
    const half = (x, w, side) => {
      ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.beginPath();
      if (side < 0) { ctx.moveTo(x, fy); ctx.lineTo(x, fy - 12); ctx.lineTo(x + w, fy - 12); for (let q = 0; q <= 6; q++) ctx.lineTo(x + w + (q % 2 ? -3 : 0), fy - 12 + q * 2); ctx.lineTo(x + w, fy); }
      else { ctx.moveTo(x + w, fy); ctx.lineTo(x + w, fy - 12); ctx.lineTo(x, fy - 12); for (let q = 0; q <= 6; q++) ctx.lineTo(x + (q % 2 ? 3 : 0), fy - 12 + q * 2); ctx.lineTo(x, fy); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = COBALT_LO; for (let q = 0; q < 3; q++) ctx.fillRect(x + 6, fy - 10 + q * 3, w - 12 - q * 6, 1.6);
    };
    half(l0, w0, -1); half(l1, w1, 1);
    // the postmark: a dotted ring settles on the drop spot (the tell), then the stamp comes down
    if (!this.done && this.phase === 'ring') { const q = clamp((this.cyc % (s.period || 4.2) - ((s.period || 4.2) - 1.4)) / 1.15, 0, 1); ctx.strokeStyle = `rgba(22,20,30,${0.3 + 0.6 * q})`; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.ellipse(dx, fy - 3, 60 - 30 * q, 10 - 4 * q, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    if (!this.done) {
      const dropY = this.phase === 'drop' ? fy - 8 : this.phase === 'ring' ? fy - 140 + 20 * Math.sin(t * 10) * 0.1 : fy - 170;
      ctx.fillStyle = '#5a3a22'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(dx - 4, dropY - 70, 8, 40); ctx.strokeRect(dx - 4, dropY - 70, 8, 40);
      ctx.fillStyle = CORAL; ctx.beginPath(); ctx.ellipse(dx, dropY - 74, 12, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8884a'; rr(ctx, dx - 26, dropY - 32, 52, 22, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = BLACK; ctx.fillRect(dx - 24, dropY - 12, 48, 6);
    }
    if (this.mark || this.missT > 0) PA.postmark(ctx, dx - 6, fy - 12, 13, BLACK, this.done ? 0.9 : this.missT);
    // the barrier: a stack of undelivered letters across the way, lifting off once the address is whole
    const B = s.barrier, bx = B[0] * TS, by = B[1] * TS, bw = (B[2] - B[0] + 1) * TS, bh = (B[3] - B[1] + 1) * TS;
    if (this.liftK < 1) {
      ctx.save(); ctx.globalAlpha = 1 - this.liftK; ctx.translate(0, -this.liftK * 120);
      for (let yy = by; yy < by + bh; yy += 12) { ctx.fillStyle = (yy / 12) % 2 ? WHITE : '#f2e4c4'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillRect(bx + ((yy / 12) % 2) * 3, yy, bw - 3, 11); ctx.strokeRect(bx + ((yy / 12) % 2) * 3, yy, bw - 3, 11); ctx.fillStyle = CORAL; ctx.fillRect(bx + bw - 10, yy + 2, 5, 6); }
      ctx.restore();
    }
    ctx.restore();
  }
}
ENTITY_TYPES.postAddress = PostAddress;
Tour.pieces['post.address'] = function (st, o) {
  const B = st.B; B.spawn('postAddress', st.x, st.gy - 1, o);
  const R = o.barrier; for (let y = R[1]; y <= R[3]; y++) for (let x = R[0]; x <= R[2]; x++) { B.set(x, y, T.HARD); B.setHide(x, y, 1); }
  if (o.g != null) { B.toggle(o.g, [R.slice(0, 4)], [], { kind: 'postAddress' }); B.switchAt(o.g, o.plate[0], o.plate[1] - 1); }
  return st.x;
};

Object.assign(TourLandscape.ARCH_LABEL, { perforate: 'PERFORATION', stampduty: 'STAMP DUTY', blotter: 'BLOTTER', fold: 'FOLD', scale: 'MAP SCALE' });
Object.assign(Tour.postKit, { standsOn, setRect, hideRect, throwHint, carriage, scaleRect, PostIsland, PostStamp, PostBlotter, PostFold, PostScale, PostAddress });
// for the shots tool: the game's own physics on a copy of Brady's body
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.TourMap = TourMap; } } catch (e) { /* not in a browser */ }
try { if (typeof window !== 'undefined') window.BRADY_POST = { phys: (b, inp, A, dt, pl, o) => playerPhysicsFlip(b, inp, A, dt, pl, o), spikeContact: (b, A) => spikeContact(b, A), lavaContact: (b, A) => lavaContact(b, A), kit: Tour.postKit }; } catch (e) { /* not in a browser */ }
})();
