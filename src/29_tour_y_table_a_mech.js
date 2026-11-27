/* ============================================================
   TABLE FOR TWO: the land's mechanics (world 36). Every one is a real thing Brady works with the stick, JUMP and
   RUN/THROW, and every one tells the level checker only what the player can really do:
   36-1 CHINA    the good china spins in place under Brady's feet: walk on a plate and it turns (it keeps turning a
                 little after he stops); its chip slides round the rim and is a doorway down to the next setting.
                 Late on, two plates mesh at the rims: the rims are a wall until both bites meet there.
                 (checker: the plates are solid floor; an edge from every plate tile down through the chip; the
                 meshed rims are an auto toggle: the player can always turn the bites together)
   36-2 NAPKIN   a standing napkin has three creases on its tail: step on one to fold it to a SAIL (a tall edge to
                 climb on), a BIRD (two wings, a bridge) or a flat SQUARE. The last napkin, under a low glass, must be
                 flattened to get under the rim, and only rises (to a sail, lifting Brady) once he has crossed its
                 centre crease. (checker: a toggle group per napkin, switched at its creases; the rise is a lift that
                 only the checker feels, in the flat state)
   36-3 CLOTH    hold THROW on the cloth's corner tab and run away from the table: release after three paces and
                 the cloth whips out from under the dishes, uncovering the place mat (a springy cork mat in a hollow
                 of the table). Too short a pull and the cloth slips back. The last table's tall glass wobbles while
                 you pull and topples (the cloth snaps back) if you hold on past six paces: a short, clean release.
                 (checker: the cloth over the mat's hollow is a toggle switched at the corner)
   36-4 CROUTON  a crouton raft in thick hot soup: stand on its left crust and it paddles right, on its right crust and
                 it paddles left, in the middle and it drifts to a stop. A dollop of cream on one crust makes that
                 crust useless (it just spins): jump onto the middle and the crouton flips over, cream side round.
                 (checker: the raft's whole run is one-way floor, as for any moving platform)
   36-5 COURTESY the hostess offers Brady the last bite: stand on the bread plate's mark and tap THROW while she offers
                 and the plate slides to her; she accepts and the next place opens. At dessert she offers twice, and
                 only the second offer lets go. (checker: each place's gate is a lock; standing on the mark is its key)
   Shared: the THROW-on-a-prop hook (a prop takes the button only while Brady is on its mark or holding it), the
   steam tell, the checker-only lifts, and window.BRADY_TABLE for the shots tool.
   ============================================================ */
(function () {
const TK = Tour.tableKit, INK = TK.INK, TabArt = TK.TabArt;
const { RED, IVORY, IVORY2, NAVY, OLIVE, GOLD, WOOD, WOOD2 } = TK;
const isTable = g => !!(g && g.level && g.level.country === 'table');
const mod = (a, n) => ((a % n) + n) % n;

/* ---------------- the `tab` area system and checker-only lifts ---------------- */
if (TourBuild.SYSTEMS.indexOf('tab') < 0) TourBuild.SYSTEMS.push('tab');
// a zone with tabVal is a lift only the level checker feels (it stands for a napkin rising under Brady); the game
// switches it off when the area loads (the real thing is the napkin)
TourHooks.on('areaLoaded', (play, A) => { for (const z of A.zones || []) if (z.tabVal) z.off = true; });

/* ---------------- THROW on a prop ---------------- */
// Each frame in a table level: the first entity with tabProp whose tabTouch(p) is true gets the button (tabInput) and
// the engine's own THROW (the power picker) does not fire. RUN still works: holding the button is also running.
{
  const pu0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (isTable(g) && inp && this.state === 'play' && !this.dead) {
      this.tabHeld = !!inp.action; this.tabPress = !!inp.actionPressed;
      let prop = null;
      for (const e of g.entities) if (e.tabProp && !e.remove && e.tabTouch(this)) { prop = e; break; }
      this.tabProp = prop;
      if (prop) { prop.tabInput(this, inp, dt); if (inp.actionPressed) inp = Object.assign({}, inp, { actionPressed: false }); }
    } else this.tabProp = null;
    return pu0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined' && TourPicker.visible) { const vis0 = TourPicker.visible; TourPicker.visible = function (play) { if (play && play.player && play.player.tabProp) return false; return vis0.call(this, play); }; }
}
// the little sign that a prop is listening: a white hand with THROW over it, pulsing
const handCue = (ctx, x, y, t, txt) => {
  const k = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.save(); ctx.globalAlpha = 0.75 + 0.25 * k; ctx.fillStyle = 'rgba(20,10,20,0.7)'; rr(ctx, x - 26, y - 24, 52, 18, 9); ctx.fill();
  ctx.fillStyle = '#ffd84a'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt || 'THROW', x, y - 14.5);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 4, y - 6); ctx.lineTo(x + 4, y - 6); ctx.lineTo(x, y - 1 + k * 2); ctx.closePath(); ctx.fill(); ctx.restore();
};
// Brady's feet on the tile under (tx, floor row ty)? (standing, within 0.6 of a tile)
const onMark = (p, tx, ty, wide) => p && !p.dead && p.onGround && p.groundTy === ty && Math.abs(p.cx - (tx * TS + TS / 2)) < TS * (wide || 0.75);
const overlapsTile = (b, x, y) => b.x < (x + 1) * TS && b.x + b.w > x * TS && b.y < (y + 1) * TS && b.y + b.h > y * TS;
// lift Brady (or anything standing) out of tiles that just turned solid: onto the top of the column he is in
const liftOut = (g, cells) => {
  const p = g.player; if (!p || p.dead) return;
  if (!cells.some(([x, y]) => overlapsTile(p, x, y))) return;
  const cols = cells.filter(([x]) => p.x < (x + 1) * TS && p.x + p.w > x * TS);
  const top = Math.min(...cols.map(c => c[1]));
  p.y = top * TS - p.h - 0.5; p.vy = Math.min(p.vy, 0);
};

/* ======================= 36-1 CHINA: the plates ======================= */
class TabPlate extends Ent {
  constructor(g, s) {
    super(g, s, s.w * TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true;
    this.tx = Math.round(this.x / TS); this.row = Math.round(this.y / TS); this.n = s.w;
    this.u = s.u || 0; this.vs = 0; this.rimL = s.rimL || 0; this.rimR = s.rimR || 0; this.mesh = s.mesh || null; this.lead = !s.follow;
    this.holes = []; this.rimOpen = { l: false, r: false }; this.band = s.band || NAVY; this.chipW = 2;
  }
  partner() { if (!this.mesh) return null; if (this._pt !== undefined) return this._pt; this._pt = this.g.entities.find(e => e !== this && e instanceof TabPlate && e.mesh === this.mesh) || null; return this._pt; }
  // Brady's feet on the plate's walking edge (not on a rim column: standing in a notch turns nothing)
  on(p) { return p && !p.dead && p.onGround && p.groundTy === this.row && p.cx > this.x + (this.rimL ? TS : 0) + 4 && p.cx < this.x + this.w - (this.rimR ? TS : 0) - 4; }
  update(dt) {
    this.t += dt;
    const p = this.g.player, L = this.n, P = this.partner();
    if (this.lead) {
      // Brady's feet turn the plate (on its partner they turn it the other way); it coasts to a stop after
      let drive = null;
      if (this.on(p)) drive = -0.8 * p.vx / TS;
      else if (P && P.on(p)) drive = 0.8 * p.vx / TS;
      if (drive != null && Math.abs(p.vx) > 0.4 * TS) this.vs = approach(this.vs, drive, 14 * dt);
      else this.vs = approach(this.vs, 0, 1.2 * dt);
      this.u = mod(this.u + this.vs * dt, 2 * L);
      if (P) { P.u = mod(3 * L - this.u, 2 * L); P.vs = -this.vs; }
    }
    this.apply();
  }
  // the chip on the front edge (its two columns), the rims' notches
  apply() {
    const g = this.g, L = this.n, u = this.u, x0 = this.tx, row = this.row, A = g.area;
    const lo = x0 + (this.rimL ? 1 : 0), hi = x0 + L - 1 - (this.rimR ? 1 : 0);
    const want = [];
    // (a plate lying flat on the table has nowhere to drop to: its chip is only a bite out of the rim there)
    // (while the bite goes round a rimmed end it is the rim's notch, not a hole: never a hole right under a notch)
    if (u < L && u >= (this.rimL ? 1.6 : 0) && u < L - (this.rimR ? 1.6 : 0)) { const c = x0 + Math.floor(u); for (const cc of [c, c + 1]) if (cc >= lo && cc <= hi && tileAt(A, cc, row + 1) === T.EMPTY) want.push(cc); }
    for (let c = lo; c <= hi; c++) {
      const hole = want.indexOf(c) >= 0, t = tileAt(A, c, row);
      if (hole && t !== T.EMPTY) g.setTile(c, row, T.EMPTY);
      // never close a tile on anything falling through it
      else if (!hole && t === T.EMPTY && !(g.player && overlapsTile(g.player, c, row))) g.setTile(c, row, T.HARD);
    }
    this.holes = want;
    const rim = (on, col, h, key) => {
      if (!h) return;
      this.rimOpen[key] = on;
      for (let y = row - h; y < row; y++) { const t = tileAt(A, col, y); if (on && t !== T.EMPTY) g.setTile(col, y, T.EMPTY); else if (!on && t === T.EMPTY && !(g.player && overlapsTile(g.player, col, y))) g.setTile(col, y, T.HARD); }
    };
    rim(u >= L - 1.6 && u < L + 1.2, x0 + L - 1, this.rimR, 'r');
    rim(u >= 2 * L - 1.2 || u < 1.6, x0, this.rimL, 'l');
  }
  touchPlayer() {}
  draw(ctx) {
    const L = this.n, x = this.x, w = this.w, y = this.y, u = this.u, t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the back half of the rim (an ellipse arc above the walking edge) and its well
    const cx = x + w / 2, ry = 9;
    ctx.fillStyle = IVORY2; ctx.beginPath(); ctx.ellipse(cx, y + 2, w / 2, ry, 0, Math.PI, 0); ctx.lineTo(x + w, y + 4); ctx.lineTo(x, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = this.band; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(cx, y + 2, w / 2 - 6, ry - 3, 0, Math.PI, 0); ctx.stroke();
    // the chip on the back half: a bite in the back rim (coming round)
    if (u >= L) { const bx = x + (2 * L - u) * TS; ctx.fillStyle = '#3a1a20'; ctx.beginPath(); ctx.arc(Math.max(x + 6, Math.min(x + w - 6, bx)), y + 2 - ry * Math.sin(Math.PI * clamp((2 * L - u) / L, 0, 1)) * 0.9, 6, 0, TAU); ctx.fill(); }
    // the front: the walking edge, the body of the plate down to the foot
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.quadraticCurveTo(x + w - 2, y + 20, x + w - 14, y + 24); ctx.lineTo(x + 14, y + 24); ctx.quadraticCurveTo(x + 2, y + 20, x, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the blue band with dashes that run round as it turns (the plate visibly spins)
    ctx.fillStyle = this.band; ctx.fillRect(x + 3, y + 7, w - 6, 4);
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < L + 2; k++) { const dx = mod(k * TS - u * TS, (L + 1) * TS); if (dx > 4 && dx < w - 10) ctx.fillRect(x + dx, y + 8, 6, 2); }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x + 4, y + 2, w - 8, 2);
    // the chip on the front edge: a bite out of the plate (a dark gap with a scalloped edge)
    if (u < L) {
      const hx = x + (u) * TS, hw = this.chipW * TS;
      ctx.save(); ctx.beginPath(); ctx.rect(x + (this.rimL ? TS : 0), y - 2, w - (this.rimL ? TS : 0) - (this.rimR ? TS : 0), 30); ctx.clip();
      ctx.fillStyle = this.holes.length ? '#2a1018' : '#b8a888'; ctx.beginPath(); ctx.moveTo(hx, y - 1);
      for (let k = 0; k <= 4; k++) ctx.lineTo(hx + k * hw / 4, y + 20 + (k % 2 ? 4 : 0)); ctx.lineTo(hx + hw, y - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // the rims (where a plate meshes with its neighbour): a raised fluted rim with a notch when the bite is there
    const rimDraw = (col, h, open, side) => {
      if (!h) return;
      const rx = col * TS, top = (this.row - h) * TS;
      ctx.fillStyle = IVORY; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (open) { ctx.fillRect(rx + 4, top, TS - 8, 8); ctx.strokeRect(rx + 4, top, TS - 8, 8); ctx.fillStyle = '#2a1018'; ctx.fillRect(rx + 6, top + 8, TS - 12, h * TS - 8); return; }
      rr(ctx, rx + 3, top, TS - 6, h * TS + 4, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.band; for (let yy = top + 10; yy < top + h * TS - 4; yy += 16) ctx.fillRect(rx + 6, yy, TS - 12, 3);
      // the bite coming round: a marker sliding along the rim's edge shows how far it has to go
      const need = side === 'r' ? mod(this.u - (L - 0.2), 2 * L) : mod(this.u + 0.2, 2 * L), k = 1 - Math.min(1, Math.min(need, 2 * L - need) / L);
      ctx.fillStyle = `rgba(42,16,24,${0.3 + 0.6 * k})`; ctx.beginPath(); ctx.arc(rx + TS / 2, top + h * TS * (1 - k) + 4, 5, 0, TAU); ctx.fill();
    };
    rimDraw(this.tx + L - 1, this.rimR, this.rimOpen.r, 'r'); rimDraw(this.tx, this.rimL, this.rimOpen.l, 'l');
    ctx.restore();
  }
}

/* ======================= 36-2 NAPKIN ======================= */
const FORMS = ['SAIL', 'BIRD', 'SQUARE'];
// the form's solid cells, relative to the napkin's base (dx, dy from (x, floor row)); o.sail / o.bird override
const formCells = (o, f) => {
  const R = [];
  const rect = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) R.push([x, y]); };
  if (f === 0) { const s = o.sail || [1, -4, 2, -1]; rect(...s); }
  if (f === 1) { const b = o.bird || [[-2, -3, 5, -3], [1, -2, 2, -1]]; for (const r of b) rect(...r); }
  return R;
};
class TabNapkin extends Ent {
  constructor(g, s) {
    super(g, s, 4 * TS, 4 * TS); this.bx = Math.round((s.x - TS / 2) / TS); this.fy = Math.round(s.y / TS); this.x = this.bx * TS; this.y = (this.fy - 4) * TS;
    this.friendly = true; this.back = true; this.id = s.id; this.o = s; this.form = s.form || 0; this.shown = this.form; this.morph = 1; this.riseT = 0;
    this.cells = [0, 1, 2].map(f => formCells(s, f).map(([dx, dy]) => [this.bx + dx, this.fy + dy]));
  }
  setForm(f, quiet) {
    if (f === this.form) return;
    const g = this.g, old = this.cells[this.form], nw = this.cells[f];
    for (const [x, y] of old) if (!nw.some(c => c[0] === x && c[1] === y)) g.setTile(x, y, T.EMPTY);
    for (const [x, y] of nw) g.setTile(x, y, T.HARD);
    liftOut(g, nw);
    this.prev = this.form; this.form = f; this.morph = 0;
    if (!quiet) { TourKit.sfx('fold', 'select', { vol: 0.5, pitch: 0.8 + f * 0.2 }); g.parts.text(this.cx, this.y - 6, FORMS[f] + '!', '#fff4e0'); g.burst(this.cx, this.y + 3 * TS, 6, '#ffffff', 'dust'); }
  }
  update(dt) {
    this.t += dt; this.morph = Math.min(1, this.morph + dt * 5);
    // the twist: flat under the glass, it rises (to a sail) once Brady has crossed its centre crease
    const R = this.o.rise, p = this.g.player;
    if (R && this.form === 2 && p && !p.dead) {
      const rx1 = Math.max(...this.cells[R.form || 0].map(c => c[0])) + 1;
      const past = p.onGround && p.groundTy === this.fy && p.cx > (this.bx + R.dx) * TS && p.cx < rx1 * TS;
      if (past) { this.riseT += dt; if (this.riseT > 0.3) { this.setForm(R.form || 0); this.g.parts.text(this.cx, this.y - 20, 'UP SHE GOES!', '#ffd84a'); } } else this.riseT = 0;
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, f = this.form, fy = this.fy * TS, t = this.t, k = this.morph;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    const cloth = '#fbf5e8', fold = '#e4d6bc', stripe = RED;
    const pts = c => { ctx.beginPath(); c.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    const lerpY = (a) => fy - (fy - a) * k;
    if (f === 0) {
      // a sail: a tall triangle standing on its edge (the solid cells are its load-bearing edge)
      const S = this.o.sail || [1, -4, 2, -1], top = lerpY(fy + S[1] * TS);
      const l = this.bx * TS + S[0] * TS, r = this.bx * TS + (S[2] + 1) * TS;
      ctx.fillStyle = fold; pts([[l - TS * 0.8, fy], [l, top], [r, fy]]);
      ctx.fillStyle = cloth; pts([[l, fy], [l, top], [r + TS * 0.5, fy]]);
      ctx.strokeStyle = stripe; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l + 4, fy - 6); ctx.lineTo(r + 8, fy - 6); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(l, top, r - l, 4);
    } else if (f === 1) {
      // a bird: wings spread (the wing line is solid), a folded body, a little head
      const B = this.o.bird || [[-2, -3, 5, -3], [1, -2, 2, -1]], wing = B[0], wy = lerpY(fy + wing[1] * TS);
      const wl = this.bx * TS + wing[0] * TS, wr = this.bx * TS + (wing[2] + 1) * TS, mid = (wl + wr) / 2;
      ctx.fillStyle = fold; pts([[mid - TS, fy], [mid, wy + 6], [mid + TS, fy]]);
      ctx.fillStyle = cloth; pts([[wl, wy], [mid, wy + 14], [wr, wy], [mid, wy - 6]]);
      ctx.fillRect(wl, wy, wr - wl, 6); ctx.strokeRect(wl, wy, wr - wl, 6);
      ctx.strokeStyle = stripe; ctx.beginPath(); ctx.moveTo(wl + 6, wy + 3); ctx.lineTo(wr - 6, wy + 3); ctx.stroke();
      ctx.fillStyle = cloth; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(mid + 6, wy - 4); ctx.lineTo(mid + 18, wy - 22); ctx.lineTo(mid + 24, wy - 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(mid + 19, wy - 18, 1.5, 0, TAU); ctx.fill();
    } else {
      // flat on the cloth: a square with a stripe and a crease
      const l = this.bx * TS - 4, r = (this.bx + 4) * TS + 4;
      ctx.fillStyle = cloth; ctx.beginPath(); ctx.moveTo(l, fy); ctx.lineTo(l + 8, fy - 6); ctx.lineTo(r - 8, fy - 6); ctx.lineTo(r, fy); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = stripe; ctx.beginPath(); ctx.moveTo(l + 10, fy - 3); ctx.lineTo(r - 10, fy - 3); ctx.stroke();
      if (this.o.rise) { ctx.strokeStyle = 'rgba(30,20,30,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo((this.bx + this.o.rise.dx) * TS, fy - 6); ctx.lineTo((this.bx + this.o.rise.dx) * TS, fy); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.restore();
  }
}
// a crease on the napkin's tail (a fold line on the cloth): hopping onto it folds the napkin to its form
class TabCrease extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.id = s.id; this.form = s.form; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.was = false; this.flash = 0; }
  napkin() { return this._n || (this._n = this.g.entities.find(e => e instanceof TabNapkin && e.id === this.id)); }
  update(dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt * 2);
    // a crease folds the napkin when Brady LANDS on it (a hop): walking across a row of creases folds nothing
    const p = this.g.player, on = onMark(p, this.tx, this.fy, 0.6), air = p && !p.onGround;
    if (on && this.wasAir) { const N = this.napkin(); if (N && N.form !== this.form) { N.setForm(this.form); this.flash = 1; } }
    this.wasAir = air; this.was = on;
  }
  touchPlayer() {}
  draw(ctx) {
    const N = this.napkin(), x = this.cx, y = this.fy * TS, cur = N && N.form === this.form;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.fillStyle = cur ? '#fff4c8' : '#fbf5e8'; ctx.beginPath(); ctx.moveTo(x - 15, y); ctx.lineTo(x - 11, y - 5); ctx.lineTo(x + 11, y - 5); ctx.lineTo(x + 15, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the form's little icon on the fold
    ctx.fillStyle = cur ? RED : '#8a7a6a'; ctx.strokeStyle = cur ? RED : '#8a7a6a';
    if (this.form === 0) { ctx.beginPath(); ctx.moveTo(x - 4, y - 7); ctx.lineTo(x - 4, y - 19); ctx.lineTo(x + 5, y - 7); ctx.closePath(); ctx.fill(); }
    else if (this.form === 1) { ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - 9, y - 16); ctx.quadraticCurveTo(x - 4, y - 10, x, y - 13); ctx.quadraticCurveTo(x + 4, y - 10, x + 9, y - 16); ctx.stroke(); }
    else { ctx.fillRect(x - 7, y - 11, 14, 4); }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,240,180,${this.flash * 0.6})`; ctx.beginPath(); ctx.arc(x, y - 10, 16, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

/* ======================= 36-3 CLOTH: tablecloth service ======================= */
class TabCloth extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.cx0 = Math.round((s.x - TS / 2) / TS); this.fy = Math.round(s.y / TS); this.x = this.cx0 * TS; this.y = (this.fy - 1) * TS;
    this.friendly = true; this.back = true; this.tabProp = true; this.o = s; this.dir = s.dir || 1;   // the cloth lies on the dir side of the corner
    this.span = s.w || 8; this.state = 'on'; this.held = false; this.d = 0; this.wob = 0; this.flyT = 0; this.rattle = 0; this.tipT = 0;
    this.cover = s.cover || [];   // the cloth's cells over the mat's hollow (solid while it lies there)
  }
  get pullDir() { return -this.dir; }
  tabTouch(p) { return this.held || (this.state === 'on' && onMark(p, this.cx0, this.fy, 0.8)); }
  tabInput(p, inp, dt) {
    if (this.state !== 'on') return;
    if (!this.held) { if (inp.actionPressed) { this.held = true; this.x0 = p.cx; this.d = 0; TourKit.sfx('grab', 'select', { vol: 0.5, pitch: 0.7 }); this.g.parts.text(p.cx, p.y - 12, 'GOT THE CORNER!', '#fff4e0'); } return; }
    this.d = Math.max(0, (p.cx - this.x0) * this.pullDir / TS);
    const max = this.o.max;
    if (max && this.d > max) { this.held = false; this.fail('tip'); return; }
    if (!inp.action) { this.held = false; if (this.d >= (this.o.min || 3)) this.whip(); else this.fail('short'); }
  }
  whip() {
    const g = this.g; this.state = 'whip'; this.flyT = 0;
    for (const [x, y] of this.cover) g.setTile(x, y, T.EMPTY);
    TourKit.sfx('whoosh', 'fly', { vol: 0.7, pitch: 1.4 }); g.shake(3);
    g.bannerText = 'VOILÀ!'; g.bannerT = 1.0;
    g.parts.text(this.cx0 * TS + this.dir * this.span * TS / 2, (this.fy - 3) * TS, 'THE DISHES DIDN\'T MOVE!', '#ffd84a');
  }
  fail(why) {
    const g = this.g, p = g.player;
    if (why === 'tip') { this.tipT = 1.4; TourKit.sfx('crash', 'break', { vol: 0.6 }); g.burst((this.cx0 + this.dir * (this.o.glass || 5)) * TS, (this.fy - 2) * TS, 14, '#d8f0ff', 'spark'); if (p) g.parts.text(p.cx, p.y - 14, 'THE GLASS TIPPED! (A SHORT, CLEAN PULL)', '#ff9a9a'); }
    else { this.rattle = 0.8; TourKit.sfx('rattle', 'bump', { vol: 0.5, pitch: 1.6 }); if (p) g.parts.text(p.cx, p.y - 14, 'TOO SHORT! RUN FURTHER BEFORE YOU LET GO', '#ff9a9a'); }
    this.d = 0;
  }
  update(dt) {
    this.t += dt; if (this.rattle > 0) this.rattle -= dt; if (this.tipT > 0) this.tipT -= dt;
    if (this.state === 'whip') { this.flyT += dt; if (this.flyT > 0.8) this.state = 'off'; }
    const p = this.g.player;
    if (this.held && (!p || p.dead || p.state !== 'play')) { this.held = false; this.d = 0; }
    // the tall glass wobbles harder the longer the pull
    this.wob = this.held && this.o.max ? Math.min(1, this.d / this.o.max) : approach(this.wob, 0, dt * 2);
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, x0 = this.cx0 * TS, fy = this.fy * TS, w = this.span * TS, t = this.t, dir = this.dir, p = g.player;
    const L = dir > 0 ? x0 + TS : x0 - w, R = L + w;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the place mat in its hollow (always drawn: it shows once the cloth is gone)
    for (const [mx, my] of this.o.mat || []) { ctx.fillStyle = '#c89a5a'; ctx.fillRect(mx * TS + 1, my * TS - 4, TS - 2, 8); }
    if (this.state !== 'off') {
      const fly = this.state === 'whip' ? Math.min(1, this.flyT / 0.5) : 0, pull = this.held ? Math.min(this.d, 8) : 0;
      ctx.save(); ctx.globalAlpha = 1 - fly;
      const sx = this.pullDir * (fly * 10 * TS + pull * 4);
      // the cloth itself: gingham lying flat over the table, its corner tab hanging at the mark
      ctx.beginPath(); ctx.rect(L + sx, fy - 7, w, 9); ctx.save(); ctx.clip(); TK.gingham(ctx, L + sx - 8, fy - 7, w + 16, 9, 6, 0.7); ctx.restore(); ctx.strokeRect(L + sx, fy - 7, w, 9);
      // over the mat's hollow the cloth lies taut, a whole tile deep (it is what Brady stands on there)
      for (const [cx, cy] of this.cover) { const X = cx * TS + sx; ctx.save(); ctx.beginPath(); ctx.rect(X, cy * TS, TS, TS); ctx.clip(); TK.gingham(ctx, X - 4, cy * TS, TS + 8, TS, 6, 0.6); ctx.fillStyle = 'rgba(80,20,20,0.18)'; ctx.fillRect(X, cy * TS + TS - 6, TS, 6); ctx.restore(); }
      if (this.rattle > 0) ctx.translate(Math.sin(t * 60) * 2, 0);
      ctx.restore();
      // the corner tab and, while held, the stretched cloth to Brady's hand
      const tabX = dir > 0 ? L + sx : R + sx;
      if (this.held && p) { ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tabX, fy - 4); ctx.quadraticCurveTo((tabX + p.cx) / 2, fy - 4 + 10, p.cx, p.y + 24); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); }
      else if (this.state === 'on') { ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(tabX, fy - 6); ctx.lineTo(tabX - dir * 14, fy + 2); ctx.lineTo(tabX, fy + 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(tabX - dir * 6, fy + 1, 2, 0, TAU); ctx.fill(); }
    }
    // the dishes on top (they stay put: that's the trick)
    const jig = this.rattle > 0 ? Math.sin(t * 50) * 2 : 0;
    for (const [dx, kind] of this.o.dishes || []) {
      const dxp = x0 + dir * dx * TS + TS / 2;
      if (kind === 'plate') TabArt.plate(ctx, dxp + jig, fy - 9, 20, 6);
      else if (kind === 'teapot') Decor.tabTeapot(ctx, dxp + jig, fy - 6);
      else if (kind === 'cup') { ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(dxp - 9, fy - 22); ctx.lineTo(dxp + 9, fy - 22); ctx.lineTo(dxp + 6, fy - 8); ctx.lineTo(dxp - 6, fy - 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = NAVY; ctx.fillRect(dxp - 8, fy - 18, 16, 2.5); }
    }
    // the tall glass (the last table): wobbles while you pull, topples if you hold on too long
    if (this.o.glass) {
      const gx = x0 + dir * this.o.glass * TS + TS / 2;
      ctx.save(); ctx.translate(gx, fy - 6);
      if (this.tipT > 0) ctx.rotate(dir * Math.min(1.5, (1.4 - this.tipT) * 4)); else ctx.rotate(Math.sin(t * (8 + this.wob * 14)) * this.wob * 0.28);
      TabArt.glass(ctx, 0, 0, 74); ctx.restore();
      if (this.held) { const k = this.wob; ctx.fillStyle = k > 0.75 ? '#ff6a5a' : '#ffd84a'; ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(k > 0.75 ? 'WOBBLE!' : 'wobble', gx, fy - 92); }
    }
    // the pull meter while held: paces run so far, the mark at the clean-release length
    if (this.held && p) {
      const min = this.o.min || 3, max = this.o.max || 8, bw = 60, bx = p.cx - bw / 2, by = p.y - 46;
      ctx.fillStyle = 'rgba(20,10,20,0.7)'; rr(ctx, bx - 3, by - 3, bw + 6, 12, 5); ctx.fill();
      ctx.fillStyle = this.d >= min ? '#7aff9a' : '#ffd84a'; ctx.fillRect(bx, by, bw * Math.min(1, this.d / max), 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + bw * min / max - 1, by - 2, 2, 10);
    } else if (this.state === 'on' && p && this.tabTouch(p)) handCue(ctx, x0 + TS / 2, fy - 2 * TS - 30, t, 'HOLD THROW');
    ctx.restore();
  }
}

/* ======================= 36-4 CROUTON: rafts in the soup ======================= */
class TabRaft extends Ent {
  constructor(g, s) {
    super(g, s, (s.w || 3) * TS, 14); this.x = s.x - TS / 2; this.y = s.y - TS; this.x0 = this.x; this.x1 = this.x + (s.span || 8) * TS;
    this.isPlatform = true; this.friendly = true; this.dx = 0; this.dy = 0; this.vx = 0; this.cream = s.cream || 0; this.flipT = 1; this.wasOn = false; this.spin = 0; this.bob = 0;
    this.sp = (s.speed || 2.6) * TS;
  }
  update(dt) {
    this.t += dt; this.flipT = Math.min(1, this.flipT + dt * 3); this.spin = Math.max(0, this.spin - dt * 2);
    const p = this.g.player, on = p && !p.dead && p.ride === this && p.onGround;
    let want = 0;
    if (on) {
      const k = (p.cx - this.x) / this.w, side = k < 0.36 ? -1 : k > 0.64 ? 1 : 0;
      // the left crust paddles it right, the right crust paddles it left; a creamy crust just spins in the soup
      if (side && side === this.cream) { this.spin = 1; if (!this.told) { this.told = true; this.g.parts.text(this.cx, this.y - 30, 'SPLOSH! THE CREAM SIDE WON\'T PADDLE', '#fff4e0'); } }
      else if (side) want = -side * this.sp;
      // landing in the middle from a jump turns the crouton over (the cream goes round)
      if (!this.wasOn && side === 0 && this.pvy > 2 * TS && this.cream) { this.cream = -this.cream; this.flipT = 0; this.told = false; TourKit.sfx('flip', 'select', { vol: 0.5, pitch: 0.7 }); this.g.parts.text(this.cx, this.y - 24, 'FLIP!', '#ffd84a'); }
    }
    this.wasOn = on; if (!on && p) this.pvy = p.vy;
    this.vx = approach(this.vx, want, (want ? 6 : 3) * TS * dt);
    let nx = this.x + this.vx * dt;
    if (nx < this.x0) { nx = this.x0; this.vx = 0; } if (nx > this.x1) { nx = this.x1; this.vx = 0; }
    this.dx = nx - this.x; this.x = nx; this.dy = 0;
    this.bob = Math.sin(this.t * 2.2) * 1.5;
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y + this.bob, w = this.w, t = this.t, f = this.flipT;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // ripples and a paddling splash
    ctx.strokeStyle = 'rgba(255,240,220,0.6)'; ctx.lineWidth = 2; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.ellipse(x + w / 2, y + 16, w / 2 + 6 + k * 8 + Math.sin(t * 3 + k) * 2, 4 + k, 0, 0, Math.PI); ctx.stroke(); }
    if (Math.abs(this.vx) > 10) { const sx = this.vx > 0 ? x - 4 : x + w + 4; ctx.fillStyle = 'rgba(255,230,200,0.8)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(sx, y + 10 - k * 4 - (t * 30 + k * 5) % 8, 3, 0, TAU); ctx.fill(); } }
    ctx.save(); ctx.translate(x + w / 2, y + 8); ctx.scale(1, Math.abs(Math.cos(f * Math.PI)) * 0.8 + 0.2); if (this.spin) ctx.rotate(Math.sin(t * 30) * 0.05 * this.spin);
    // the crouton: a toasted cube, crust on both ends
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#e8b868'; rr(ctx, -w / 2, -10, w, 22, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b8742a'; rr(ctx, -w / 2, -10, 12, 22, 6); ctx.fill(); rr(ctx, w / 2 - 12, -10, 12, 22, 6); ctx.fill();
    ctx.fillStyle = '#f4d08a'; ctx.fillRect(-w / 2 + 14, -8, w - 28, 5);
    ctx.fillStyle = '#c8843a'; for (const [px, py] of [[-14, 2], [6, -2], [18, 4], [-4, 6]]) { ctx.beginPath(); ctx.arc(px, py, 2, 0, TAU); ctx.fill(); }
    // the dollop of cream on one crust
    if (this.cream) { const cx = this.cream * (w / 2 - 8); ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(cx, -12, 9, Math.PI, 0); ctx.quadraticCurveTo(cx + 9, -4, cx, -6); ctx.quadraticCurveTo(cx - 9, -4, cx - 9, -12); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - 2, -20); ctx.quadraticCurveTo(cx + 3, -24, cx + 1, -27); ctx.stroke(); }
    ctx.restore();
    // which crust paddles which way: little arrows on the crusts while Brady rides
    const p = this.g.player;
    if (p && p.ride === this) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center';
      if (this.cream !== -1) ctx.fillText('▶', x + 8, y - 4); if (this.cream !== 1) ctx.fillText('◀', x + w - 8, y - 4);
    }
    ctx.restore();
  }
}

/* ======================= 36-5 COURTESY: the hostess and the bread plate ======================= */
// the gate between places: a tall napkin ring that lifts away when the hostess accepts (a lock with the place's id
// that opens itself on the key, like the rooms' prize cages)
class TabGate extends ENTITY_TYPES.lock {
  constructor(g, s) { super(g, s); this.rise = 0; }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    if (!this.open && this.g.keys && this.g.keys.has(this.id)) { this.open = true; for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY); Sound.play('door', { vol: 0.6 }); this.g.burst(this.cx, this.cy, 16, '#ffd84a', 'confetti'); }
    if (this.open) this.rise = Math.min(1, this.rise + dt * 1.5);
  }
  touchPlayer() { if (this.open) return; if (this.msgT <= 0) { this.msgT = 2.5; this.g.parts.text(this.cx, this.y - 10, 'AFTER YOU... NO, AFTER YOU', '#ffd84a'); Sound.play('bump', { vol: 0.4 }); } }
  draw(ctx) {
    if (this.rise >= 1) return;
    const x = this.cx, y = this.y - this.rise * this.h * 1.2, h = this.h;
    ctx.save(); ctx.globalAlpha = 1 - this.rise; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = GOLD; rr(ctx, x - 12, y, 24, h, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = RED; ctx.fillRect(x - 12, y + h * 0.3, 24, 10); ctx.strokeRect(x - 12, y + h * 0.3, 24, 10);
    ctx.fillStyle = '#fff6c8'; ctx.fillRect(x - 7, y + 6, 4, h - 12);
    ctx.restore();
  }
}
// the bread plate on its mark (the prop): THROW while the hostess offers slides it to her
class TabBreadPlate extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.tabProp = true; this.id = s.id; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.slide = 0; this.done = false; }
  hostess() { return this._h || (this._h = this.g.entities.find(e => e instanceof TabHostess && e.id === this.id)); }
  tabTouch(p) { return !this.done && onMark(p, this.tx, this.fy, 0.9); }
  tabInput(p, inp) { if (!inp.actionPressed) return; const H = this.hostess(); if (H) H.offered(this); }
  update(dt) { this.t += dt; if (this.sliding) { this.slide = Math.min(1, this.slide + dt * 1.6); if (this.slide >= 1) this.sliding = false; } }
  touchPlayer() {}
  draw(ctx) {
    const H = this.hostess(), x0 = this.cx, y = this.fy * TS;
    const hx = H ? H.cx : x0 + 6 * TS, hy = H ? H.y + H.h - 4 : y;
    const k = this.slide, x = x0 + (hx - x0) * k, yy = y + (hy - y) * k - Math.sin(k * Math.PI) * 30;
    if (this.done && k >= 1) return;
    TabArt.plate(ctx, x, yy - 4, 16, 5);
    if (!this.sliding && !this.done) { ctx.save(); ctx.fillStyle = '#d8a050'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, yy - 9, 8, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    const p = this.g.player; if (!this.done && p && this.tabTouch(p)) handCue(ctx, x0, y - 2 * TS - 10, this.t, 'THROW');
  }
}
// the hostess (Madame Manners at her own end of each place): she offers the last bite; feint: at dessert her first
// offer of each pair is only for show (her tines stay closed round the plate) and only the second lets go
class TabHostess extends Ent {
  constructor(g, s) {
    super(g, s, 30, 70); this.friendly = true; this.id = s.id; this.feint = !!s.feint; this.st = 'wait'; this.at = 0; this.wait = 1.4 + (s.phase || 0); this.n = 0; this.happy = 0; this.done = false;
  }
  update(dt) {
    this.t += dt; this.at += dt; if (this.happy > 0) this.happy -= dt;
    const g = this.g, p = g.player, near = p && Math.abs(p.cx - this.cx) < 14 * TS && Math.abs(p.cy - this.cy) < 6 * TS;
    if (this.done) { this.st = 'eat'; return; }
    if (this.st === 'wait') { if (this.at > this.wait && near) this.go('lift'); }
    else if (this.st === 'lift') { if (this.at > 0.65) { this.go('offer'); this.n++; const real = !this.feint || this.n % 2 === 0; this.real = real; g.parts.text(this.cx, this.y - 16, real && this.feint ? 'NO, REALLY. AFTER YOU!' : 'THE LAST BITE?', '#fff4e0'); } }
    else if (this.st === 'offer') { if (this.at > 1.7) { this.go('wait'); this.wait = 1.0 + Math.random() * 0.8; if (this.feint && !this.real) this.wait = 0.5; else g.parts.text(this.cx, this.y - 16, '...THEN I SHALL.', '#fff4e0'); } }
    else if (this.st === 'snatch') { if (this.at > 0.9) { this.go('wait'); this.wait = 1.2; this.n = 0; } }
  }
  go(st) { this.st = st; this.at = 0; }
  offered(plate) {
    const g = this.g, p = g.player;
    if (this.done) return;
    if (this.st !== 'offer') { if (p) g.parts.text(p.cx, p.y - 14, this.st === 'lift' ? 'WAIT FOR HER TO OFFER...' : 'SHE HASN\'T OFFERED YET', '#ffd8a0'); return; }
    if (this.feint && !this.real) {
      // the feint: her tines never opened; she keeps hold and the pair starts again
      this.go('snatch'); TourKit.sfx('clink', 'bump', { vol: 0.5, pitch: 1.6 }); if (p) g.parts.text(p.cx, p.y - 14, 'SHE DIDN\'T LET GO! WAIT FOR HER SECOND OFFER', '#ff9a9a'); return;
    }
    this.done = true; this.happy = 2; plate.sliding = true; plate.done = true; g.keys.add(this.id);
    TourKit.sfx('clink', 'pick', { vol: 0.6, pitch: 1.3 }); g.parts.text(this.cx, this.y - 16, 'HOW KIND!', '#ffd84a');
  }
  touchPlayer() {}
  draw(ctx) {
    const B = Tour.tableKit.drawManners;
    const st = this.st, pose = st === 'lift' ? 'lift' : st === 'offer' ? (this.feint && !this.real ? 'feint' : 'offer') : st === 'snatch' ? 'snatch' : st === 'eat' ? 'eat' : 'idle';
    if (B) B(ctx, this.cx, this.y + this.h, 0.62, pose, this.t, -1);
    if (st === 'offer') { ctx.save(); ctx.fillStyle = '#ffd84a'; ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('?', this.cx - 26, this.y - 6 + Math.sin(this.t * 8) * 2); ctx.restore(); }
  }
}

/* ---------------- the pieces ---------------- */
const P = {
  // a spinning plate whose top is the letter's row: { w, u (the chip's start, 0..2w), rimL, rimR (rim heights), mesh,
  // follow (the second plate of a meshed pair), g (the toggle group of a meshed junction: on the leader) }
  plate(st, o) {
    const B = st.B, x0 = st.x, row = st.gy - 1, w = o.w || 6;
    for (let c = x0; c < x0 + w; c++) { B.set(c, row, T.HARD); B.setHide(c, row, 1); }
    const rimCells = [];
    if (o.rimL) for (let y = row - o.rimL; y < row; y++) { B.set(x0, y, T.HARD); B.setHide(x0, y, 1); rimCells.push([x0, y]); }
    if (o.rimR) for (let y = row - o.rimR; y < row; y++) { B.set(x0 + w - 1, y, T.HARD); B.setHide(x0 + w - 1, y, 1); rimCells.push([x0 + w - 1, y]); }
    // the checker: from every plate tile, the chip can be brought under Brady: an edge down to where he lands
    for (let c = x0 + (o.rimL ? 1 : 0); c <= x0 + w - 1 - (o.rimR ? 1 : 0); c++) {
      for (let y = row + 1; y < B.H - 1; y++) { const t = B.get(c, y); if (SOLID[t] || t === T.SEMI) { if (!SOLID[B.get(c, y - 1)] && !SOLID[B.get(c, y - 2)] && y - row >= 3) B.edge([c, row - 1], [c, y]); break; } if (t === T.LAVA || t === T.SPIKES) break; }
    }
    // a meshed junction's rims: an auto toggle (the player can always turn the bites together)
    if (o.g != null && rimCells.length) B.toggle(o.g, rimCells.map(([x, y]) => [x, y, x, y]), [], { auto: true, kind: 'tabRims' });
    B.spawn('tabPlate', x0, row, { w, u: o.u || 0, rimL: o.rimL || 0, rimR: o.rimR || 0, mesh: o.mesh || null, follow: !!o.follow, band: o.band });
    return st.x;
  },
  // a napkin standing on the letter's floor (its base x..x+3): { id, form (start), g, use: [state 0 form, state 1 form],
  // sail, bird (cell rects), rise: { dx, form } }
  napkin(st, o) {
    const B = st.B, x = st.x, F = st.gy, form = o.form || 0, use = o.use || [form, form === 2 ? 0 : 2];
    const cells = f => formCells(o, f).map(([dx, dy]) => [x + dx, F + dy]);
    for (let f = 0; f < 3; f++) for (const [cx, cy] of cells(f)) { B.set(cx, cy, T.EMPTY); }
    for (const [cx, cy] of cells(form)) B.set(cx, cy, T.HARD);
    for (let f = 0; f < 3; f++) for (const [cx, cy] of cells(f)) B.setHide(cx, cy, 1);
    if (o.g != null) {
      const A0 = cells(use[0]).map(([a, b]) => [a, b, a, b]), B1 = cells(use[1]).map(([a, b]) => [a, b, a, b]);
      B.toggle(o.g, A0, B1, { kind: 'tabNapkin' });
      // the rise (36-2's twist): in the flat state the checker feels a lift over the cells it rises in
      if (o.rise) { const sc = cells(o.rise.form || 0), xs = sc.map(c => c[0]), ys = sc.map(c => c[1]), xa = Math.min(...xs), xb = Math.max(...xs), ya = Math.min(...ys); B.zone(xa, ya - 2, xb - xa + 1, F - ya + 2, 0, -95 * TS, 7 * TS, 'updraft', { g: o.g, gOn: true, tabVal: true }); }
    }
    B.spawn('tabNapkin', x, F - 1, { id: o.id, form, sail: o.sail, bird: o.bird, rise: o.rise || null });
    return st.x;
  },
  // a crease on a napkin's tail at the letter (Brady steps onto it): { id, form, g, sw (a checker switch here) }
  crease(st, o) { const B = st.B; B.spawn('tabCrease', st.x, st.gy - 1, { id: o.id, form: o.form || 0 }); if (o.g != null && o.sw !== false) B.switchAt(o.g, st.x, st.gy - 1); return st.x; },
  // a cloth with its corner tab at the letter: { dir (the cloth lies this side of the corner), w, mat: [dx, n] (the
  // hollow under it, dx from the corner), g, min, max, glass, dishes: [[dx, kind]...] }
  cloth(st, o) {
    const B = st.B, x = st.x, F = st.gy, dir = o.dir || 1, [md, mn] = o.mat || [3, 3];
    const cover = [], mat = [];
    for (let k = 0; k < mn; k++) {
      const c = x + dir * (md + k);
      B.set(c, F, T.HARD); B.setHide(c, F, 1); cover.push([c, F]);
      B.set(c, F + 1, T.GROUND); B.setSurf(c, F + 1, SURF.BOUNCE); mat.push([c, F + 1]);
      for (let y = F + 2; y < Math.min(B.H, F + 4); y++) if (B.get(c, y) === T.EMPTY) B.set(c, y, T.GROUND);
    }
    if (o.g != null) { B.toggle(o.g, cover.map(([a, b]) => [a, b, a, b]), [], { kind: 'tabCloth' }); B.switchAt(o.g, x, F - 1); }
    B.spawn('tabCloth', x, F - 1, { dir, w: o.w || 8, cover, mat, min: o.min || 3, max: o.max || 0, glass: o.glass || 0, dishes: o.dishes || [[2, 'plate'], [5, 'cup'], [7, 'teapot']] });
    return st.x;
  },
  // a crouton raft whose left end is the letter (its top on the letter's row, over the soup): { w, span, cream, speed }
  raft(st, o) {
    const B = st.B, x = st.x, row = st.gy - 1, w = o.w || 3, span = o.span || 8;
    for (let c = x; c < x + w + span; c++) B.ghosts.push([c, row]);
    B.spawn('tabRaft', x, row, { w, span, cream: o.cream || 0, speed: o.speed });
    return st.x;
  },
  // a place at the table: the bread plate's mark at the letter, the hostess at hx/hy from it, the gate (a lock with
  // the place's id) at gx (rows gy0..gy1 above the floor): { id, hx, hy, gx, gh, feint }
  place(st, o) {
    const B = st.B, x = st.x, F = st.gy, id = 'tab:place:' + o.id;
    B.spawn('tabBreadPlate', x, F - 1, { id });
    B.spawn('tabHostess', x + o.hx, F - 1 + (o.hy || 0), { id, feint: !!o.feint, phase: o.phase || 0 });
    B.vkey(id, [[x, F - 1]]);
    if (o.gx != null) { const gx = x + o.gx, gh = o.gh || 4; B.lock(gx, F - gh, F - 1, id, 'tabGate'); B.spawns[B.spawns.length - 1].type = 'tabGate'; }
    return st.x;
  },
  // a big upturned glass whose rim's left end is the letter: { w, h } (w columns, h rows up from the rim row): solid,
  // drawn as glass
  glass(st, o) {
    const B = st.B, x = st.x, y1 = st.gy - 1, w = o.w || 7, h = o.h || 9;
    for (let c = x; c < x + w; c++) for (let y = y1 - h + 1; y <= y1; y++) { B.set(c, y, T.HARD); B.setHide(c, y, 1); }
    B.decor.push({ kind: 'tabBigGlass', x: (x + w / 2) * TS, y: (y1 + 1) * TS, w: w * TS, h: h * TS, seed: 0 });
    return st.x;
  },
  // the land's tell: a wisp of steam rising out of a hidden way (decor at the letter)
  steam(st, o) { st.B.decorAt('tabSteam', st.x, st.gy, (st.x * 3) % 17); return st.x; }
};
for (const k in P) Tour.pieces['table.' + k] = P[k];
// the upturned glass: a tumbler upside down, its thick base at the top, its rim at the bottom, highlights
Decor.tabBigGlass = function (ctx, x, y, t, th, d) {
  const w = d.w, h = d.h, l = x - w / 2;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
  ctx.fillStyle = 'rgba(210,235,255,0.42)'; ctx.beginPath(); ctx.moveTo(l + 6, y - h); ctx.lineTo(l + w - 6, y - h); ctx.lineTo(l + w, y); ctx.lineTo(l, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(190,220,250,0.7)'; ctx.fillRect(l + 6, y - h, w - 12, 18); ctx.strokeRect(l + 6, y - h, w - 12, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(l + 16, y - h + 26, 7, h - 44); ctx.fillRect(l + 30, y - h + 30, 3, h - 70);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(l + 2, y - 3); ctx.lineTo(l + w - 2, y - 3); ctx.stroke();
  ctx.restore();
};
Object.assign(ENTITY_TYPES, { tabPlate: TabPlate, tabNapkin: TabNapkin, tabCrease: TabCrease, tabCloth: TabCloth, tabRaft: TabRaft, tabGate: TabGate, tabBreadPlate: TabBreadPlate, tabHostess: TabHostess });
Object.assign(Tour.tableKit, { TabPlate, TabNapkin, TabCrease, TabCloth, TabRaft, TabGate, TabBreadPlate, TabHostess, handCue, onMark, isTable, liftOut });
try { if (typeof window !== 'undefined') window.BRADY_TABLE = { phys: (b, inp, A, dt, pl, o) => playerPhysicsFlip(b, inp, A, dt, pl, o), spikeContact: (b, A) => spikeContact(b, A), lavaContact: (b, A) => lavaContact(b, A), kit: Tour.tableKit }; } catch (e) { /* not in a browser */ }
})();
