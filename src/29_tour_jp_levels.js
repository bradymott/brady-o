/* ============================================================
   Japan (world 11): the levels in the v2 format (LEVEL_OVERHAUL.md
   §2 "World 11", §3.2 graph). Loads after 29_tour_jp.js (the look,
   the cast, the Great Kappa) and adds, with Tour.amend: the stamps,
   the country looks for library objects (skins), the overhaul's set
   pieces, the Souvenir Stand Omise, the map graph and all seven levels.
   Shrines, gates and temples never appear here at all; the castle is
   a garden and a storehouse. The tanuki hides only as scenery.
   ============================================================ */
(() => {
const C = Tour.countries.jp;
if (!C) return;
const K = TourKit;
const NEONS = ['#ff3a8a', '#3af0ff', '#ffe03a', '#7aff5a', '#b85aff', '#ff8a2a'];
const SUSHI = [['#ff8a6a', '#ffffff'], ['#ffb03a', '#ffffff'], ['#e8384f', '#ffffff'], ['#ffd84a', '#ffffff'], ['#1e2a20', '#ff8a6a']];

/* ---------------- helpers ---------------- */
// room(W, H, floor, marks, opts): rows for a stamp (walls left and right, ground from the floor row, a ceiling unless
// opts.open); marks = [[x, y, 'text'], ...] write text into the rows from (x, y)
function room(W, H, floor, marks, opts) {
  opts = opts || {};
  const wall = opts.wall || 'H', rows = [];
  for (let y = 0; y < H; y++) {
    let r;
    if (y >= floor) r = '#'.repeat(W);
    else if (y === 0 && !opts.open) r = '#'.repeat(W);
    else r = wall + '.'.repeat(W - 2) + wall;
    rows.push(r.split(''));
  }
  for (const [x, y, txt] of marks) for (let k = 0; k < txt.length; k++) if (txt[k] !== ' ' && x + k < W && y < H) rows[y][x + k] = txt[k];
  return rows.map(r => r.join(''));
}
// a pit with a liquid (the theme's: soy, pond, moat) a couple of rows down
const pond = (st, x0, x1, row) => { st.pit(x0, x1); st.B.fill(x0, row, x1, st.H - 1, T.LAVA); };
const sushi = (ctx, x, y, k, t) => {
  const [fish, rice] = SUSHI[k % SUSHI.length];
  ctx.fillStyle = '#f4f4f8'; ctx.beginPath(); ctx.ellipse(x, y, 13, 3.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8c8d8'; ctx.fillRect(x - 9, y + 1, 18, 1.5);
  ctx.fillStyle = k % 5 === 4 ? '#1e2a20' : rice; rr(ctx, x - 7, y - 7, 14, 6, 3); ctx.fill();
  ctx.fillStyle = fish; rr(ctx, x - 8, y - 9, 16, 4, 2); ctx.fill();
  if (k % 5 !== 4) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; for (let q = -1; q <= 1; q++) ctx.fillRect(x + q * 4 - 1, y - 9, 1.2, 4); }
};

/* ---------------- objects of the overhaul ---------------- */
// the kaiten belt: plates of sushi riding the conveyor tiles under them, whichever way they run
class JpBeltPlates extends Ent {
  constructor(g, s) { super(g, s, s.n * TS, 12); this.x = s.x - TS / 2; this.y = s.y - 8; this.n = s.n; this.tx0 = Math.floor(s.x / TS); this.ty = Math.floor(s.y / TS); this.off = (s.x * 7) % 40; this.friendly = true; this.back = true; this.seed = Math.floor(s.x / TS); }
  update(dt) { this.t += dt; const tl = tileAt(this.g.area, this.tx0, this.ty); this.dir = tl === T.CONV_L ? -1 : 1; this.off += this.dir * 2.2 * TS * dt; }
  draw(ctx) {
    const y = this.y + 4, x0 = this.x, w = this.w;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y - 20, w, 30); ctx.clip();
    for (let k = -1; k < this.n * 0.8 + 1; k++) { const px = x0 + ((k * 40 + this.off) % (w + 40) + w + 40) % (w + 40) - 20; sushi(ctx, px, y, k + this.seed, this.t); }
    ctx.restore();
  }
}
// the reversing belt's controller: every period it warns (the arrow lamps blink amber) and then turns the belt round
class JpBeltSwitcher extends Ent {
  constructor(g, s) { super(g, s, s.n * TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.tx0 = Math.floor(s.x / TS); this.ty = Math.floor(s.y / TS); this.n = s.n; this.period = s.period || 3.2; this.k = s.phase || 0; this.friendly = true; this.back = true; this.warn = false; }
  update(dt) {
    this.t += dt; this.k += dt; this.warn = this.k > this.period - 0.8;
    if (this.k >= this.period) {
      this.k = 0; const A = this.g.area;
      for (let q = 0; q < this.n; q++) { const tx = this.tx0 + q, tl = tileAt(A, tx, this.ty); if (tl === T.CONV_R) this.g.setTile(tx, this.ty, T.CONV_L); else if (tl === T.CONV_L) this.g.setTile(tx, this.ty, T.CONV_R); }
      if (this.g.onScreen(this, 80)) K.sfx('switch', 'select', { vol: 0.35, pitch: 0.8 });
    }
  }
  draw(ctx) {
    const dir = tileAt(this.g.area, this.tx0, this.ty) === T.CONV_L ? -1 : 1, blink = this.warn && Math.sin(this.t * 30) > 0;
    for (const lx of [this.x - 10, this.x + this.w + 10]) {
      const y = this.y + TS;
      ctx.fillStyle = '#3a3440'; ctx.fillRect(lx - 2, y - 26, 4, 26); rr(ctx, lx - 11, y - 44, 22, 18, 5); ctx.fill();
      ctx.fillStyle = blink ? '#ffb03a' : '#7aff5a'; ctx.save(); ctx.translate(lx, y - 35); ctx.scale(dir, 1); ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(2, -4); ctx.lineTo(2, -8); ctx.lineTo(8, 0); ctx.lineTo(2, 8); ctx.lineTo(2, 4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
}
// neon sign boards on the tower's outside (11-4): one-way ledges that flicker off for a moment on a clock, odd and
// even signs never dark together. The board draws itself; its tiles belong to toggle group g (auto)
const NEON_PERIOD = 4.2;
const neonOff = (t, gi) => { const k = (t + (gi === 2 ? NEON_PERIOD / 2 : 0)) % NEON_PERIOD; return k > 2.3 && k < 3.5; };
class JpNeonClock extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.state = { 1: false, 2: false }; }
  update(dt) {
    this.t += dt; const g = this.g;
    for (const gi of [1, 2]) { const off = neonOff(g.t, gi); if (off !== !!g.toggleBit(gi)) g.flipToggle(gi, true); }
    this.x = g.camX; this.y = g.camY;
  }
  draw() {}
}
class JpNeonSign extends Ent {
  constructor(g, s) { super(g, s, s.w * TS, 30); this.x = s.x - TS / 2; this.y = s.y; this.gi = s.g; this.col = NEONS[s.col % NEONS.length]; this.pic = s.pic || 0; this.back = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const g = this.g, off = !!g.toggleBit(this.gi), k = (g.t + (this.gi === 2 ? NEON_PERIOD / 2 : 0)) % NEON_PERIOD, warn = !off && k > 1.7 && k < 2.3 && Math.sin(g.t * 34) > 0;
    const x = this.x, y = this.y, w = this.w, lit = !off && !warn;
    // the board hangs under its ledge (the walkable top edge is a bright catwalk rail)
    ctx.fillStyle = '#1a1424'; rr(ctx, x + 2, y + 2, w - 4, 26, 5); ctx.fill();
    ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 2; for (const bx of [x + 8, x + w - 8]) { ctx.beginPath(); ctx.moveTo(bx, y + 28); ctx.lineTo(bx, y + 40); ctx.stroke(); }
    ctx.save(); if (lit) { ctx.shadowColor = this.col; ctx.shadowBlur = 12; }
    ctx.strokeStyle = lit ? this.col : 'rgba(120,110,140,0.6)'; ctx.lineWidth = 2.6; rr(ctx, x + 5, y + 5, w - 10, 20, 4); ctx.stroke();
    // a picture, never words: a cat, a noodle bowl, a fish, a star
    const cx = x + w / 2, cy = y + 15; ctx.beginPath();
    if (this.pic % 4 === 0) { ctx.arc(cx, cy + 1, 6, 0, TAU); ctx.moveTo(cx - 5, cy - 3); ctx.lineTo(cx - 4, cy - 9); ctx.lineTo(cx - 1, cy - 5); ctx.moveTo(cx + 5, cy - 3); ctx.lineTo(cx + 4, cy - 9); ctx.lineTo(cx + 1, cy - 5); }
    else if (this.pic % 4 === 1) { ctx.arc(cx, cy - 1, 8, 0, Math.PI); ctx.moveTo(cx - 8, cy - 1); ctx.lineTo(cx + 8, cy - 1); ctx.moveTo(cx + 2, cy - 9); ctx.lineTo(cx + 6, cy - 2); ctx.moveTo(cx + 5, cy - 9); ctx.lineTo(cx + 8, cy - 2); }
    else if (this.pic % 4 === 2) { ctx.ellipse(cx - 2, cy, 8, 4, 0, 0, TAU); ctx.moveTo(cx + 6, cy); ctx.lineTo(cx + 11, cy - 4); ctx.lineTo(cx + 11, cy + 4); ctx.closePath(); }
    else { for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + q * TAU / 5, b = a + TAU / 10; ctx.lineTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8); ctx.lineTo(cx + Math.cos(b) * 3.5, cy + Math.sin(b) * 3.5); } ctx.closePath(); }
    ctx.stroke(); ctx.restore();
    ctx.fillStyle = lit ? '#e8e8f0' : warn ? '#ffb03a' : 'rgba(150,150,170,0.35)'; ctx.fillRect(x, y - 2, w, 5);
    ctx.fillStyle = lit ? this.col : '#4a4a5a'; for (let q = x + 4; q < x + w - 2; q += 10) ctx.fillRect(q, y + 3, 4, 1.5);
  }
  get light() { return this.g.toggleBit(this.gi) ? null : { r: 60, c: 'rgba(255,120,220,', y: this.y + 14 }; }
}
// an air-conditioner unit on a wall: its exhaust is an updraft column (the zone), drawn as rising wavy air
// a polite grey heron on a garden path (11-5): it won't budge until Brady bows (crouches facing it); then it bows back
// and flies off, and the bamboo gate behind it opens. The Great Kappa's whole fight hangs on that same courtesy.
class JpHeron extends Ent {
  constructor(g, s) { super(g, s, 30, 54); this.opens = s.opens; this.state = 'stand'; this.k = 0; this.friendly = true; this.hx = this.x; this.hy = this.y; this.dir = -1; this.told = false; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player; if (!p) return;
    if (this.state === 'stand') {
      const near = Math.abs(p.cx - this.cx) < 5 * TS && Math.abs(p.y + p.h - (this.y + this.h)) < 1.5 * TS;
      if (near && !this.told) { this.told = true; K.say(g, this, 'KWAAK. *STARES*', '#ffffff'); }
      const inp = g.input ? g.input() : Input;
      if (near && (p.onGround || p.ride) && inp.down && sign(this.cx - p.cx) === p.facing) { this.state = 'bow'; this.k = 0; K.say(g, this, 'OH! *BOWS BACK*', '#bfff8a'); K.sfx('bow', 'select2', { vol: 0.45, pitch: 1.2 }); g.addScore(200, this.cx, this.y); }
    } else if (this.state === 'bow') { this.k += dt; if (this.k > 0.9) { this.state = 'fly'; this.k = 0; TourLock.open(g, this.opens); K.sfx('flap', 'jump', { vol: 0.4, pitch: 1.4 }); } }
    else if (this.state === 'fly') { this.k += dt; this.x = this.hx + this.k * 5 * TS; this.y = this.hy - this.k * this.k * 3.2 * TS; if (this.k > 3) this.remove = true; }
  }
  touchPlayer(p) { if (this.state === 'stand' && Math.abs(p.cx - this.cx) < 20) p.x += (p.cx < this.cx ? -1 : 1) * 2; }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, bow = this.state === 'bow' ? Math.min(1, this.k * 3) : 0, fly = this.state === 'fly', flap = fly ? Math.sin(this.t * 14) : 0;
    Ink.around(ctx, this.x - 30, this.y - 30, this.w + 60, this.h + 34, c => {
      c.save(); c.translate(x, y); c.scale(this.dir, 1);
      if (!fly) { c.strokeStyle = '#c8a050'; c.lineWidth = 2; c.beginPath(); c.moveTo(-3, 0); c.lineTo(-2, -18); c.moveTo(3, 0); c.lineTo(2, -18); c.stroke(); }
      c.save(); c.translate(0, -24); c.rotate(bow * 0.7);
      c.fillStyle = '#a8b0bc'; c.beginPath(); c.ellipse(-2, 0, 14, 9, -0.2, 0, TAU); c.fill();
      c.fillStyle = '#7a8290'; c.beginPath(); c.ellipse(-6, -2 + flap * 6, 12, 5, -0.3 - flap * 0.5, 0, TAU); c.fill();
      c.strokeStyle = '#d8dde4'; c.lineWidth = 4; c.beginPath(); c.moveTo(8, -4); c.quadraticCurveTo(14, -16, 9, -22); c.stroke();
      c.fillStyle = '#e8ecf0'; c.beginPath(); c.arc(10, -24, 5, 0, TAU); c.fill(); c.fillStyle = '#1a1a24'; c.fillRect(7, -27, 9, 2);
      c.fillStyle = '#e8b83a'; c.beginPath(); c.moveTo(14, -25); c.lineTo(26, -22); c.lineTo(14, -22); c.closePath(); c.fill();
      c.fillStyle = '#1a1020'; c.beginPath(); c.arc(11.5, -25, 1.2, 0, TAU); c.fill();
      c.restore(); c.restore();
    }, { pad: 6 });
    if (this.state === 'stand') { const p = this.g.player, k = 0.5 + 0.5 * Math.sin(this.t * 6); if (p && Math.abs(p.cx - this.cx) < 6 * TS) { ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(40,20,40,0.85)'; ctx.strokeText('BOW: HOLD ▼', x, this.y - 8 - k * 2); ctx.fillStyle = '#ffffff'; ctx.fillText('BOW: HOLD ▼', x, this.y - 8 - k * 2); } }
  }
}
// petals blown up a thermal (11-7): the column's look over its updraft zone
class JpPetalDraft extends Ent {
  constructor(g, s) { super(g, s, (s.w || 2) * TS, (s.h || 10) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h + TS; this.friendly = true; this.back = true; this.ps = Array.from({ length: 14 }, (_, k) => ({ u: (k * 0.37) % 1, v: (k * 0.61) % 1, r: (k % 3) * 1.3 })); }
  update(dt) { this.t += dt; for (const q of this.ps) { q.v -= dt * 0.35; if (q.v < 0) { q.v += 1; q.u = Math.random(); } } }
  draw(ctx) {
    ctx.save(); const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h); g.addColorStop(0, 'rgba(255,200,220,0)'); g.addColorStop(1, 'rgba(255,200,220,0.28)'); ctx.fillStyle = g; ctx.fillRect(this.x, this.y, this.w, this.h);
    for (const q of this.ps) { const px = this.x + q.u * this.w + Math.sin(this.t * 3 + q.r * 5 + q.v * 9) * 8, py = this.y + q.v * this.h; ctx.save(); ctx.translate(px, py); ctx.rotate(this.t * 2 + q.r); ctx.fillStyle = q.r > 1 ? '#ffb8cc' : '#ffd0de'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 2.4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
}
// the giant coin slot of the toy machine (11-6): a tall chrome face with a glowing slot at its top
Object.assign(ENTITY_TYPES, { jpBeltPlates: JpBeltPlates, jpBeltSwitcher: JpBeltSwitcher, jpNeonClock: JpNeonClock, jpNeonSign: JpNeonSign, jpHeron: JpHeron, jpPetalDraft: JpPetalDraft });

/* ---------------- moving-platform looks ---------------- */
Object.assign(PlatformArt, {
  // a window-washer's cradle on two cables
  jpGondola(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 1.5; for (const cx of [x + 6, x + w - 6]) { ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - 900); ctx.stroke(); }
    ctx.fillStyle = '#e8e8f0'; rr(ctx, x, y, w, 12, 3); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x, y + 9, w, 3);
    ctx.strokeStyle = '#9a9aa8'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y - 14, w - 4, 14); ctx.beginPath(); for (let q = x + 10; q < x + w - 4; q += 10) { ctx.moveTo(q, y - 14); ctx.lineTo(q, y); } ctx.stroke();
    ctx.fillStyle = '#3af0ff'; ctx.fillRect(x + w / 2 - 6, y - 20, 12, 4); ctx.fillStyle = '#5a5a68'; rr(ctx, x + w / 2 - 10, y + 12, 20, 6, 2); ctx.fill();
  },
  // the claw machine's claw, used as a lift: three chrome fingers hold a little cradle
  jpClawLift(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w, cx = x + w / 2;
    ctx.strokeStyle = '#c8c8d8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, y - 22); ctx.lineTo(cx, y - 900); ctx.stroke();
    ctx.fillStyle = '#d8d8e8'; rr(ctx, cx - 12, y - 30, 24, 12, 4); ctx.fill(); ctx.fillStyle = '#ff3a8a'; ctx.beginPath(); ctx.arc(cx, y - 24, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b8b8c8'; ctx.lineWidth = 3.5; for (const s of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * 6, y - 18); ctx.quadraticCurveTo(cx + s * 16, y - 8, cx + s * (w / 2 - 2), y + 2); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; rr(ctx, x + 2, y, w - 4, 10, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,58,138,0.6)'; ctx.fillRect(x + 4, y + 7, w - 8, 2);
  },
  // a giant capsule rolling back and forth: one half coloured, the other clear, a toy inside
  jpCapsulePlat(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w, cx = x + w / 2, r = w / 2, k = Math.floor(p.hx / TS) % 4, col = ['#ff7aa8', '#7ad8ff', '#ffd84a', '#9aff8a'][k];
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y, w + 8, r + 6); ctx.clip();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, y + r * 0.62, r, r * 0.62, 0, 0, Math.PI); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.ellipse(cx, y + 2, r, r * 0.25, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 2, y - 2, w + 4, 7, 3); ctx.fill(); ctx.fillStyle = shade(col, -0.2); ctx.fillRect(x, y + 4, w, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.45, y + r * 0.3, r * 0.18, r * 0.08, -0.4, 0, TAU); ctx.fill();
  },
  // the drum's paddles (the wheel's seats) in 11-6: chunky pastel bars with rivets
  jpDrumSeat(ctx, p, t) { ctx.fillStyle = '#4a2a6a'; rr(ctx, p.x - 2, p.y - 2, p.w + 4, 16, 6); ctx.fill(); ctx.fillStyle = '#ff7aa8'; rr(ctx, p.x, p.y, p.w, 12, 5); ctx.fill(); ctx.fillStyle = '#ffd0e4'; ctx.fillRect(p.x + 4, p.y + 2, p.w - 8, 3); ctx.fillStyle = '#ffffff'; for (const q of [p.x + 7, p.x + p.w - 7]) { ctx.beginPath(); ctx.arc(q, p.y + 7, 2.2, 0, TAU); ctx.fill(); } }
});

/* ---------------- country looks for library objects (skins) ---------------- */
const skins = {
  // 11-1: a fridge door in the back of the sushi bar, cold mist curling out at its foot
  jpFridgeDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#e8eef4'; rr(ctx, x - 26, y - 82, 52, 82, 6); ctx.fill(); ctx.fillStyle = '#c8d4e0'; ctx.fillRect(x - 26, y - 52, 52, 3);
    ctx.fillStyle = '#9aa8b8'; rr(ctx, x + 14, y - 74, 5, 18, 2); ctx.fill(); rr(ctx, x + 14, y - 44, 5, 22, 2); ctx.fill();
    ctx.fillStyle = '#3a6ad8'; ctx.beginPath(); ctx.arc(x - 12, y - 66, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 14, y - 67, 4, 2);
    ctx.fillStyle = '#ffd84a'; rr(ctx, x - 18, y - 34, 14, 10, 2); ctx.fill(); ctx.fillStyle = '#e8384f'; ctx.fillRect(x - 15, y - 31, 8, 3);
    for (let k = 0; k < 6; k++) { const ph = (t * 0.6 + k / 6) % 1; ctx.fillStyle = `rgba(230,245,255,${0.55 * (1 - ph)})`; ctx.beginPath(); ctx.ellipse(x - 20 + k * 8 + ph * 18, y - 3 - ph * 10, 7 + ph * 10, 4 + ph * 4, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = `rgba(190,230,255,${0.35 + 0.15 * Math.sin(t * 3)})`; ctx.fillRect(x - 25, y - 3, 50, 3);
  },
  jpFridgeInside(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#ffe8b0'; rr(ctx, x - 16, y - 54, 32, 54, 4); ctx.fill(); ctx.fillStyle = '#c89a62'; ctx.fillRect(x - 16, y - 54, 32, 6);
    ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('◀', x, y - 58);
  },
  // 11-2: the little station's door onto the siding
  jpSidingDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#d8d8d0'; ctx.fillRect(x - 24, y - 60, 48, 60); ctx.fillStyle = '#3a6ad8'; ctx.fillRect(x - 28, y - 66, 56, 8);
    ctx.fillStyle = '#2a3a4a'; rr(ctx, x - 13, y - 48, 26, 48, 3); ctx.fill(); ctx.fillStyle = '#9ad0ff'; ctx.fillRect(x - 10, y - 44, 9, 20); ctx.fillRect(x + 1, y - 44, 9, 20);
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(x - 8, y - 74); ctx.lineTo(x + 2, y - 74); ctx.lineTo(x + 2, y - 78); ctx.lineTo(x + 9, y - 71); ctx.lineTo(x + 2, y - 64); ctx.lineTo(x + 2, y - 68); ctx.lineTo(x - 8, y - 68); ctx.fill();
  },
  // 11-3: the wind chime on its post (the day / night switch): glass bell, a paper tail that flutters
  jpWindChime(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, night = e.g && e.g.toggleBit(e.gi), sw = Math.sin(t * 3) * 0.2 + (e.cool > 0 ? Math.sin(t * 30) * 0.4 : 0);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 2, y - 56, 4, 56); ctx.fillRect(x - 2, y - 56, 16, 3);
    ctx.save(); ctx.translate(x + 12, y - 53); ctx.rotate(sw);
    ctx.fillStyle = night ? 'rgba(160,190,255,0.9)' : 'rgba(200,240,255,0.9)'; ctx.beginPath(); ctx.moveTo(-9, 14); ctx.quadraticCurveTo(-9, 0, 0, 0); ctx.quadraticCurveTo(9, 0, 9, 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = night ? '#ffe8a0' : '#e8384f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-2, 7, 2.5, 0, TAU); ctx.moveTo(3, 4); ctx.lineTo(5, 9); ctx.stroke();
    ctx.strokeStyle = '#8a8a98'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, 22); ctx.stroke();
    ctx.fillStyle = night ? '#ffe8a0' : '#fff4e0'; ctx.save(); ctx.translate(0, 22); ctx.rotate(Math.sin(t * 5) * 0.4); ctx.fillRect(-3, 0, 6, 14); ctx.restore();
    ctx.restore();
    if (night) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(160,190,255,0.25)'; ctx.beginPath(); ctx.arc(x + 12, y - 46, 14, 0, TAU); ctx.fill(); ctx.restore(); }
  },
  // the teahouse's sliding door (11-3): paper panes, a warm glow at night
  jpTeahouseDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, night = e.g && e.g.area && e.g.area.night;
    ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.moveTo(x - 46, y - 64); ctx.lineTo(x, y - 84); ctx.lineTo(x + 46, y - 64); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d8c8a0'; ctx.fillRect(x - 38, y - 64, 76, 64); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 38, y - 64, 4, 64); ctx.fillRect(x + 34, y - 64, 4, 64);
    ctx.fillStyle = night ? '#ffe0a0' : '#fbf6e8'; ctx.fillRect(x - 15, y - 52, 30, 52);
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.4; ctx.strokeRect(x - 15, y - 52, 30, 52); for (let q = 1; q < 3; q++) { ctx.beginPath(); ctx.moveTo(x - 15 + q * 10, y - 52); ctx.lineTo(x - 15 + q * 10, y); ctx.stroke(); } for (let q = 1; q < 4; q++) { ctx.beginPath(); ctx.moveTo(x - 15, y - 52 + q * 13); ctx.lineTo(x + 15, y - 52 + q * 13); ctx.stroke(); }
    ctx.fillStyle = '#5a7a3a'; ctx.fillRect(x - 34, y - 30, 14, 30); ctx.fillRect(x + 20, y - 30, 14, 30);
    if (night) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,214,140,0.2)'; ctx.beginPath(); ctx.arc(x, y - 26, 40, 0, TAU); ctx.fill(); ctx.restore(); }
  },
  // 11-4: the lit window of the arcade on the 30th floor: claw machines glowing behind the glass
  jpArcadeDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#1a1424'; rr(ctx, x - 40, y - 70, 80, 70, 4); ctx.fill();
    ctx.fillStyle = `rgba(255,120,220,${0.35 + 0.15 * Math.sin(t * 4)})`; ctx.fillRect(x - 36, y - 66, 72, 62);
    for (let k = 0; k < 3; k++) { const mx = x - 26 + k * 26; ctx.fillStyle = NEONS[k]; rr(ctx, mx - 9, y - 50, 18, 46, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(mx - 6, y - 46, 12, 18); ctx.fillStyle = ['#ffd84a', '#ff7aa8', '#7ad8ff'][k]; ctx.beginPath(); ctx.arc(mx - 2, y - 32, 3.5, 0, TAU); ctx.arc(mx + 3, y - 34, 3, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#3af0ff'; ctx.lineWidth = 2.4; ctx.save(); ctx.shadowColor = '#3af0ff'; ctx.shadowBlur = 10; rr(ctx, x - 38, y - 68, 76, 66, 5); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y - 78, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff3a8a'; ctx.beginPath(); ctx.arc(x, y - 78, 3, 0, TAU); ctx.fill();
  },
  // 11-5: the castle garden's inner gate (the way to the pond garden)
  jpGardenGate(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#3e4a52'; ctx.beginPath(); ctx.moveTo(x - 44, y - 76); ctx.lineTo(x, y - 92); ctx.lineTo(x + 44, y - 76); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f2eee6'; ctx.fillRect(x - 34, y - 76, 68, 76); ctx.fillStyle = '#5a3a24'; rr(ctx, x - 16, y - 56, 32, 56, 2); ctx.fill();
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 56); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = '#c8a040'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 5, y - 28, 2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffc0d0'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(x - 40 + k * 13, y - 84 + (k % 2) * 6, 6, 0, TAU); ctx.fill(); }
  },
  // the revolving plaster panel that turns twice and opens on the storehouse: its pivot pin glints, a draught puffs
  jpKuraPanel(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, k = e.near ? 1 : 0, sp = Math.sin(t * (e.near ? 9 : 0.7)) ;
    ctx.fillStyle = '#e8e2d4'; ctx.fillRect(x - 48, y - 128, 96, 128);
    ctx.fillStyle = '#c8bca0'; for (let r = 0; r < 8; r++) ctx.fillRect(x - 48, y - 128 + r * 16, 96, 1.5);
    ctx.save(); ctx.translate(x, y - 50); ctx.scale(Math.abs(Math.cos(t * (e.near ? 4 : 0.35))) * 0.3 + 0.7, 1);
    ctx.fillStyle = '#f4f0e6'; ctx.fillRect(-18, -50, 36, 100); ctx.strokeStyle = 'rgba(80,60,40,0.55)'; ctx.lineWidth = 1.5; ctx.strokeRect(-18, -50, 36, 100);
    ctx.restore();
    ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.arc(x, y - 100, 3 + (sp > 0.9 ? 1.5 : 0), 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 2, 3, 0, TAU); ctx.fill();
    for (let q = 0; q < 3; q++) { const ph = (t * 0.8 + q / 3) % 1; ctx.fillStyle = `rgba(230,220,200,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + 20 + ph * 14, y - 10 - ph * 20, 3 + ph * 4, 0, TAU); ctx.fill(); }
  },
  jpKuraDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#2a2a30'; rr(ctx, x - 18, y - 56, 36, 56, 3); ctx.fill(); ctx.fillStyle = '#f2eee6'; ctx.fillRect(x - 14, y - 52, 28, 52);
    ctx.fillStyle = '#8a8a90'; ctx.fillRect(x - 2, y - 30, 4, 8); ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('◀', x, y - 60);
  },
  // the bamboo gate the heron guards
  jpBowGate(ctx, e, t) {
    const x = e.x, y = e.y, h = e.h, k = e.k || 0;
    ctx.save(); ctx.globalAlpha = 1 - k * 0.85;
    for (let q = 0; q < 4; q++) { ctx.fillStyle = q % 2 ? '#7ab04a' : '#8ac05a'; rr(ctx, x + 3 + q * 7, y - k * h, 6, h, 3); ctx.fill(); ctx.fillStyle = '#5a8a34'; for (let yy = y + 10 - k * h; yy < y + h - k * h; yy += 22) ctx.fillRect(x + 3 + q * 7, yy, 6, 2); }
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; for (const yy of [y + 12, y + h - 14]) { ctx.beginPath(); ctx.moveTo(x, yy - k * h); ctx.lineTo(x + TS, yy - k * h); ctx.stroke(); }
    ctx.restore();
  },
  // 11-6: the capsule that opens: it wobbles and a little light glows through the clear half
  jpCapsuleDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, wob = Math.sin(t * 3) * 0.06;
    ctx.save(); ctx.translate(x, y - 34); ctx.rotate(wob);
    ctx.fillStyle = '#ff7aa8'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(0, -6, 34, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; rr(ctx, -36, -6, 72, 8, 3); ctx.fill();
    ctx.fillStyle = `rgba(255,240,150,${0.5 + 0.3 * Math.sin(t * 5)})`; ctx.beginPath(); ctx.arc(-4, -18, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; rr(ctx, -12, -4, 24, 38, 10); ctx.fill();
    ctx.restore();
  },
  // 11-7: the mountain hut on its island: a small timber hut with a deep roof and a smoking chimney
  jpHutDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 40, y - 58, 80, 58); ctx.fillStyle = '#7a5a3a'; for (let r = 0; r < 4; r++) ctx.fillRect(x - 40, y - 58 + r * 14, 80, 2);
    ctx.fillStyle = '#5a6a7a'; ctx.beginPath(); ctx.moveTo(x - 52, y - 56); ctx.lineTo(x, y - 90); ctx.lineTo(x + 52, y - 56); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f8fbff'; ctx.beginPath(); ctx.moveTo(x - 40, y - 64); ctx.lineTo(x, y - 90); ctx.lineTo(x + 40, y - 64); ctx.lineTo(x + 28, y - 66); ctx.lineTo(x, y - 82); ctx.lineTo(x - 28, y - 66); ctx.fill();
    ctx.fillStyle = '#3a2a1a'; rr(ctx, x - 13, y - 46, 26, 46, 3); ctx.fill(); ctx.fillStyle = '#ffe0a0'; ctx.fillRect(x + 20, y - 44, 14, 12);
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x + 22, y - 92, 8, 22);
    for (let q = 0; q < 3; q++) { const ph = (t * 0.4 + q / 3) % 1; ctx.fillStyle = `rgba(240,240,250,${0.6 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + 26 + ph * 20, y - 96 - ph * 40, 5 + ph * 8, 0, TAU); ctx.fill(); }
  },
  // back doors out of the rooms
  jpBackDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#5a3a24'; rr(ctx, x - 15, y - 54, 30, 54, 5); ctx.fill(); ctx.fillStyle = '#fbf6e8'; ctx.fillRect(x - 11, y - 50, 22, 24);
    ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 50); ctx.lineTo(x, y - 26); ctx.moveTo(x - 11, y - 38); ctx.lineTo(x + 11, y - 38); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('◀', x, y - 58);
  },
  // the paper-crane glider stand (11-7): a crane folded from a postcard, on a little bamboo stand
  jpCraneStand(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#7ab04a'; ctx.fillRect(x - 2, y - 30, 4, 30); ctx.fillRect(x - 12, y - 3, 24, 3);
    ctx.save(); ctx.translate(x, y - 40 + Math.sin(t * 2) * 2);
    ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.moveTo(-16, 2); ctx.lineTo(0, -6); ctx.lineTo(16, 2); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe0e8'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-20, -14 + Math.sin(t * 4) * 3); ctx.lineTo(0, -2); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(20, -14 - Math.sin(t * 4) * 3); ctx.lineTo(0, -2); ctx.fill();
    ctx.strokeStyle = '#c8a878'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, 1); ctx.lineTo(19, -8); ctx.stroke();
    ctx.fillStyle = '#e8384f'; ctx.beginPath(); ctx.arc(-3, 1, 2, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // the drum (11-6): a giant turning wheel of paddles, a crank at its hub
  jpDrum(ctx, e, t) {
    const plats = e.g.entities.filter(q => q.isPlatform && q.orbit && q.s.hub === e.s.hub);
    if (plats[0]) { e.cxp = plats[0].hx + plats[0].w / 2; e.cyp = plats[0].hy + 4; }
    const x = e.cxp, y = e.cyp;
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x, y, e.r + 20, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(200,160,240,0.7)'; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = '#d8d8e8'; ctx.lineWidth = 6; for (const p of plats) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(p.x + p.w / 2, p.y + 4); ctx.stroke(); }
    ctx.fillStyle = '#c8c8d8'; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff7aa8'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
    const a = t * 0.9; ctx.strokeStyle = '#9a9aac'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 34, y + Math.sin(a) * 34); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 34, y + Math.sin(a) * 34, 7, 0, TAU); ctx.fill();
    ctx.restore();
  }
};

/* ---------------- background props (decor) ---------------- */
Object.assign(Decor, {
  // food on the fridge shelves: a stack of egg cartons, a jar of pickled plums, a block of tofu
  jpFridgeFood(ctx, x, y, t, th, d) {
    const k = (d && d.seed) || 0;
    if (k % 3 === 0) { ctx.fillStyle = '#e8d8b8'; for (let q = 0; q < 3; q++) { rr(ctx, x - 16, y - 8 - q * 8, 32, 7, 2); ctx.fill(); ctx.fillStyle = '#fff8ec'; for (let e = 0; e < 4; e++) { ctx.beginPath(); ctx.arc(x - 11 + e * 7, y - 9 - q * 8, 3, Math.PI, TAU); ctx.fill(); } ctx.fillStyle = '#e8d8b8'; } }
    else if (k % 3 === 1) { ctx.fillStyle = 'rgba(220,235,245,0.8)'; rr(ctx, x - 10, y - 26, 20, 26, 4); ctx.fill(); ctx.fillStyle = '#e8384f'; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.arc(x - 5 + (q % 3) * 5, y - 6 - Math.floor(q / 3) * 7, 3, 0, TAU); ctx.fill(); } ctx.fillStyle = '#5a7a3a'; rr(ctx, x - 11, y - 30, 22, 5, 2); ctx.fill(); }
    else { ctx.fillStyle = '#fbfbf2'; rr(ctx, x - 14, y - 16, 28, 16, 2); ctx.fill(); ctx.fillStyle = 'rgba(200,200,190,0.6)'; ctx.fillRect(x - 14, y - 10, 28, 1.5); ctx.fillStyle = '#3a6ad8'; ctx.fillRect(x - 14, y - 4, 28, 4); }
    ctx.fillStyle = 'rgba(220,240,255,0.5)'; for (let q = 0; q < 3; q++) ctx.fillRect(x - 12 + q * 10, y - 34 - (t * 3 + q) % 6, 1.5, 3);
  },
  // the station at the siding (11-2): a canopy on posts over the platform, the siding rails bending away
  jpStation(ctx, x, y, t, th, d) {
    const w = d.w || 10 * TS, x0 = x - w / 2;
    ctx.fillStyle = '#5a5a68'; for (const px of [x0 + 20, x0 + w - 20]) ctx.fillRect(px - 3, y - 96, 6, 96);
    ctx.fillStyle = '#3a6ad8'; ctx.beginPath(); ctx.moveTo(x0, y - 92); ctx.lineTo(x0 + w, y - 92); ctx.lineTo(x0 + w - 12, y - 104); ctx.lineTo(x0 + 12, y - 104); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x0, y - 92, w, 4);
    ctx.fillStyle = '#ffffff'; rr(ctx, x0 + w / 2 - 34, y - 86, 68, 16, 3); ctx.fill(); ctx.fillStyle = '#26408a'; ctx.beginPath(); ctx.moveTo(x0 + w / 2 - 20, y - 78); ctx.lineTo(x0 + w / 2 + 14, y - 78); ctx.lineTo(x0 + w / 2 + 14, y - 82); ctx.lineTo(x0 + w / 2 + 24, y - 76); ctx.lineTo(x0 + w / 2 + 14, y - 70); ctx.lineTo(x0 + w / 2 + 14, y - 74); ctx.lineTo(x0 + w / 2 - 20, y - 74); ctx.fill();
    // the siding: two rails curving down and away behind the platform, buffers at the end
    ctx.strokeStyle = '#7a7a84'; ctx.lineWidth = 3; for (const off of [0, 10]) { ctx.beginPath(); ctx.moveTo(x0 - 60, y + 92 + off); ctx.quadraticCurveTo(x0 + w * 0.3, y + 70 + off, x0 + w + 40, y + 40 + off); ctx.stroke(); }
    ctx.fillStyle = '#e8384f'; rr(ctx, x0 + w + 34, y + 30, 10, 26, 2); ctx.fill();
  },
  // a lucky-cat statue's shelf, AC units, a rooftop water tank (11-4)
  jpACUnit(ctx, x, y, t, th, d) {
    ctx.fillStyle = '#d8dce4'; rr(ctx, x - 22, y - 26, 44, 26, 3); ctx.fill(); ctx.strokeStyle = '#9aa0ac'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x - 4, y - 13, 10, 0, TAU); ctx.stroke();
    ctx.save(); ctx.translate(x - 4, y - 13); ctx.rotate(t * 14); ctx.fillStyle = '#7a808c'; for (let q = 0; q < 3; q++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(0, -5, 2.5, 5, 0, 0, TAU); ctx.fill(); } ctx.restore();
    ctx.fillStyle = '#7a808c'; for (let q = 0; q < 4; q++) ctx.fillRect(x + 10, y - 22 + q * 5, 9, 2);
    ctx.strokeStyle = 'rgba(220,240,255,0.55)'; ctx.lineWidth = 2; for (let q = 0; q < 3; q++) { const ph = (t * 1.2 + q / 3) % 1; ctx.beginPath(); for (let s = 0; s < 8; s++) ctx.lineTo(x - 14 + q * 12 + Math.sin(s * 1.3 + t * 6) * 3, y - 30 - ph * 60 - s * 7); ctx.stroke(); }
  },
  jpWaterTank(ctx, x, y) { ctx.fillStyle = '#8a8e9a'; for (const s of [-1, 1]) ctx.fillRect(x + s * 18 - 2, y - 30, 4, 30); ctx.fillStyle = '#c8ccd8'; rr(ctx, x - 26, y - 70, 52, 42, 8); ctx.fill(); ctx.fillStyle = '#9aa0ac'; for (let q = 0; q < 3; q++) ctx.fillRect(x - 26, y - 62 + q * 12, 52, 2); ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(x, y - 78, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3a48'; ctx.fillRect(x - 1, y - 78, 2, 8); },
  // rice bales and lacquer boxes in the castle storehouse
  jpRiceBales(ctx, x, y) { for (const [dx, dy] of [[-16, 0], [16, 0], [0, -18]]) { ctx.fillStyle = '#d8c078'; rr(ctx, x + dx - 16, y + dy - 18, 32, 18, 8); ctx.fill(); ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 2; for (const q of [-8, 8]) { ctx.beginPath(); ctx.moveTo(x + dx + q, y + dy - 18); ctx.lineTo(x + dx + q, y + dy); ctx.stroke(); } } },
  jpLacquerBox(ctx, x, y) { ctx.fillStyle = '#2a1a1a'; rr(ctx, x - 16, y - 22, 32, 22, 3); ctx.fill(); ctx.fillStyle = '#c8322a'; ctx.fillRect(x - 16, y - 22, 32, 5); ctx.fillStyle = '#e8b83a'; ctx.beginPath(); ctx.arc(x, y - 11, 4, 0, TAU); ctx.fill(); },
  // a straw sandal lying on the path (real scenery, so the tanuki's sandal has company)
  jpSandal(ctx, x, y) { ctx.fillStyle = '#d8b866'; ctx.beginPath(); ctx.ellipse(x, y - 4, 15, 5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#b8964a'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x - 12, y - 4 + k * 1.6); ctx.lineTo(x + 12, y - 4 + k * 1.6); ctx.stroke(); } ctx.strokeStyle = '#c8322a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - 7, y - 5); ctx.quadraticCurveTo(x, y - 13, x + 7, y - 5); ctx.stroke(); },
  // toys and capsules lying about inside the machine
  jpToyPile(ctx, x, y, t, th, d) { const cols = ['#ff7aa8', '#7ad8ff', '#ffd84a', '#9aff8a']; for (let q = 0; q < 3; q++) { const c = cols[(q + ((d && d.seed) || 0)) % 4]; ctx.save(); ctx.translate(x - 14 + q * 14, y - 10 - (q % 2) * 4); ctx.rotate(q * 0.7); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(-10, -1, 20, 2); ctx.restore(); } },
  // the coin slot's chrome face (11-6, a prop over its wall)
  jpCoinSlot(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, y0 = y - h;
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#9a9aac'); g.addColorStop(0.5, '#f0f0f8'); g.addColorStop(1, '#8a8a9c');
    ctx.fillStyle = g; rr(ctx, x0, y0, w, h, 10); ctx.fill();
    ctx.fillStyle = '#1a1424'; rr(ctx, x - 6, y0 + 14, 12, 40, 5); ctx.fill(); ctx.fillStyle = `rgba(255,216,74,${0.4 + 0.3 * Math.sin(t * 4)})`; rr(ctx, x - 3, y0 + 18, 6, 32, 3); ctx.fill();
    ctx.fillStyle = '#ff3a8a'; ctx.beginPath(); ctx.arc(x, y0 + 70, 7, 0, TAU); ctx.fill();
  },
  // a giant coin lying flat (a step), and the mountain pines for 11-7
  jpBigCoin(ctx, x, y, t, th, d) { const w = d.w; ctx.fillStyle = '#c8901a'; rr(ctx, x - w / 2, y - d.h, w, d.h, 8); ctx.fill(); ctx.fillStyle = '#ffd24a'; rr(ctx, x - w / 2 + 2, y - d.h, w - 4, d.h - 6, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - w / 2 + 8, y - d.h + 4, w - 16, 2); }
});

/* ---------------- pieces ---------------- */
const P = {
  /* ---- 11-1 the sushi carousel ---- */
  // a conveyor belt counter: plates of sushi ride along it (and carry Brady). { n, dir, h (a raised counter), enemy }
  kaiten(st, o) {
    // a counter island (h rows up from here, or down if negative) whose top is the belt; a soy gap before it
    const B = st.B, n = o.n || 10, h = o.h != null ? o.h : 2, dir = o.dir || 1; let x = st.x;
    st.floor(x, x + 1); x += 2;
    if (o.gap) { pond(st, x, x + o.gap - 1, Math.max(st.gy, st.gy - h) + 2); st.arc(x - 1, x + o.gap, Math.min(st.gy, st.gy - h) - 2, 2); x += o.gap; }
    const top = clamp(st.gy - h, st.gyMin, st.gyMax);
    st.floor(x, x + n + 1, top);
    for (let q = 1; q <= n; q++) B.set(x + q, top, dir > 0 ? T.CONV_R : T.CONV_L);
    st.spawn('jpBeltPlates', x + 1, top - 1, { n });
    st.coins(x + 2, x + n - 1, top - 3);
    if (o.enemy) st.enemy(o.enemy, x + n - 1, top);
    if (o.first) st.sign(x, 'The plates on the belt carry you along. Ride them!', top);
    st.gy = top;
    return x + n + 2;
  },
  // a high shelf of plates over the counter (the upper way), chopsticks diving at the floor beyond it
  shelfRun(st, o) {
    const B = st.B, x = st.x, n = 22; st.floor(x, x + n);
    st.semi(x + 2, x + 10, st.gy - 4); st.decor('jpPlates', x + 4, st.gy - 4, 1); st.decor('jpTeapot', x + 9, st.gy - 4, 2);
    st.coins(x + 3, x + 9, st.gy - 6);
    for (let k = 0; k < 2; k++) st.spawn('jpChopsticks', x + 13 + k * 4, st.gy - 1, { top: st.gy - 9, delay: 0.8 + k * 1.2, every: 2.6 });
    st.coins(x + 12, x + 20, st.gy - 2);
    // P3: between the two pairs of chopsticks, up where they grab
    st.semi(x + 15, x + 16, st.gy - 4); st.gold(x + 15, st.gy - 6, o.gold || 'risky');
    st.enemy('jpTamago', x + 6, st.gy);
    return x + n + 1;
  },
  // the plate wheel over the soy pool, with P1 on top
  plateWheel(st, o) {
    const x0 = st.x + 2, y0 = st.gy - 5, nx = Tour.pieces['jp.wheel'](st, { up: o.up });
    st.gold(x0 + 4, y0 - 3, o.gold || 'must');
    return nx;
  },
  // a belt bridge over a soy pool that turns round every few seconds (the arrow lamps blink amber first)
  reverseBelt(st, o) {
    const B = st.B, x = st.x, n = o.n || 10; st.floor(x, x + 1);
    pond(st, x + 2, x + n + 1, st.gy + 2);
    for (let q = 2; q <= n + 1; q++) B.set(x + q, st.gy, T.CONV_R);
    st.spawn('jpBeltPlates', x + 2, st.gy - 1, { n });
    st.spawn('jpBeltSwitcher', x + 2, st.gy - 1, { n, period: o.period || 3.2, phase: o.phase || 0 });
    st.coins(x + 3, x + n, st.gy - 3);
    if (o.first) st.sign(x, 'This belt turns round when the arrows blink!');
    st.floor(x + n + 2, x + n + 4);
    return x + n + 5;
  },
  // the soy bottles on the counter: one of them has a leaf on its cap (a tanuki)
  soyTanuki(st, o) {
    const x = st.x, n = 13; st.floor(x, x + n);
    st.decor('jpSoyBottle', x + 3, st.gy, 1); st.decor('jpPlates', x + 6, st.gy, 2); st.decor('jpSoyBottle', x + 11, st.gy, 3);
    st.enemy('jpTanuki', x + 8, st.gy, { disguise: 'soy' });
    if (o.two) st.enemy('jpTanuki', x + 1, st.gy, { disguise: 'soy' });
    st.coins(x + 5, x + 10, st.gy - 4);
    if (o.sign) st.sign(x, 'A soy bottle with a leaf on its cap? That\'s a tanuki in disguise! Stomp it when it pops out');
    return x + n + 1;
  },
  // the fridge at the back of the bar: cold mist curls out of it (the secret room)
  fridge(st, o) { return Tour.pieces.door(st, { to: o.to, perch: 0, look: 'jpFridgeDoor', back: o.back }); },
  // three sets of chopsticks over a soy-dish run; P3 hangs where only a jump between the pinches gets it
  chopRide(st, o) {
    const x = st.x, nx = Tour.pieces['jp.chopsticks'](st, { n: 3 });
    st.semi(x + 5, x + 7, st.gy - 4); st.coins(x + 5, x + 7, st.gy - 6);
    st.gold(x + 6, st.gy - 7, 'risky');
    return nx;
  },

  /* ---- 11-2 the bullet train (pieces place things along the route; the train carries Brady past them) ---- */
  // a station with a side track: hop off onto the platform and in at the door before the train pulls away
  station(st, o) {
    const B = st.B, x = st.x, d = st.deck, y = d - 3, w = 11;
    for (let q = 0; q < w; q++) { B.set(x + q, y, T.SEMI); }
    B.prop('jpStation', x, y - 3, w, 3, 'none', {});
    B.spawn('portal', x + 7, y - 1, { kind: 'door', look: 'jpSidingDoor', targetRef: o.to || null });
    st.coins(x + 1, x + 5, y - 2);
    return x + w + 2;
  },

  /* ---- 11-3 night of things ---- */
  // the wind chime: ring it (UP) and the grove falls into night, ring it again for day. g: the phase group
  chime(st, o) {
    const B = st.B, x = st.x, g = 0; st.floor(x, x + 3);
    B.toggle(g, [], [], { kind: 'phase' }); B.switchAt(g, x + 1, st.gy - 1); B.switchAt(g, x + 2, st.gy - 1);
    B.spawn('toggleSwitch', x + 1, st.gy - 1, { g, kind: 'phase', look: 'jpWindChime' });
    if (o.sign) st.sign(x + 3, 'Ring the wind chime (UP): night falls, and the old things of the grove wake up');
    return x + 4;
  },
  // a pond crossed on a bamboo pole laid flat by day, or on glowing path stones by night (one or both)
  phaseCross(st, o) {
    const B = st.B, x = st.x, n = o.n || 7, g = 0; st.floor(x, x + 1);
    pond(st, x + 2, x + 1 + n, st.gy + 2);
    if (o.day !== false) { const y = st.gy - (o.dayY || 0); const r = [x + 2, y, x + 1 + n, y, T.SEMI]; B.toggle(g, [r], [], { kind: 'phase' }); for (let q = 0; q < n; q++) { B.set(x + 2 + q, y, T.SEMI); B.setHide(x + 2 + q, y, 1); } B.spawn('phaseBlocks', x + 2, y, { g, rect: r, state: 'A' }); }
    if (o.night) {
      const y = st.gy - (o.nightY || 2);
      for (let q = 0; q < n; q += 3) { const r = [x + 2 + q, y - (q % 2), Math.min(x + 1 + n, x + 3 + q), y - (q % 2), T.SEMI]; B.toggle(g, [], [r], { kind: 'phase' }); for (let k = r[0]; k <= r[2]; k++) B.set(k, r[1], T.EMPTY); B.spawn('phaseBlocks', r[0], r[1], { g, rect: r, state: 'B' }); }
      if (o.gold) st.gold(x + 2 + Math.floor(n / 2), y - 3, o.gold);
    }
    st.coins(x + 3, x + n, st.gy - 3);
    st.floor(x + 2 + n, x + 4 + n);
    return x + 5 + n;
  },
  // a stone path through the grove: real stone lanterns and one with a leaf on top (a tanuki)
  lanternTanuki(st, o) {
    const x = st.x, n = 14; st.floor(x, x + n);
    st.decor('jpStoneLantern', x + 2, st.gy, 1); st.decor('jpFern', x + 5, st.gy, 2); st.decor('jpStoneLantern', x + 12, st.gy, 3);
    st.enemy('jpTanuki', x + 8, st.gy, { disguise: 'lantern' });
    if (o.two) st.enemy('jpTanuki', x + 14, st.gy, { disguise: 'lantern' });
    st.coins(x + 4, x + 10, st.gy - 4);
    return x + n + 1;
  },
  // night things: a lantern spirit that blinks closer, a hopping umbrella (both sleep by day)
  nightThings(st, o) {
    const x = st.x, n = o.len || 12; st.floor(x, x + n - 1);
    st.enemy('jpChochin', x + n - 3, st.gy);
    st.enemy('jpUmbrella', x + Math.floor(n / 2), st.gy);
    if (o.onigiri) st.enemy('jpOnigiri', x + 3, st.gy);
    st.coins(x + 2, x + n - 3, st.gy - 3);
    return x + n;
  },
  // the teahouse in the grove: its door leads to the tea room (the secret)
  teahouse(st, o) { return Tour.pieces.door(st, { to: o.to, perch: 0, look: 'jpTeahouseDoor', back: o.back }); },
  // P1: the pole vault; the postcard hangs where a bent pole's spring flings Brady
  vault(st, o) {
    const x = st.x, nx = Tour.pieces['jp.poles'](st, { n: o.n || 2, first: o.first });
    st.gold(x + 8, st.gy - 6, o.gold || 'must');
    return nx;
  },

  /* ---- 11-4 the neon tower (climb bands: pieces move st.y up) ---- */
  // the lobby: a vending machine, the first block, a lucky cat on the first floor
  lobby(st, o) {
    const B = st.B, W = st.W, y = st.y - 3;
    B.decorAt('jpVending', 6, st.y, 1); B.decorAt('jpCones', 10, st.y, 2);
    B.fill(W - 10, y, W - 3, y, T.GROUND); st.block(W - 6, y - 4, 'power');
    st.coins(W - 9, W - 4, y - 2);
    for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y, T.SEMI);
    st.top(y - 3);
  },
  // window-washers' gondolas: ride one up the face to a ledge on the far side
  gondolaBand(st, o) {
    const B = st.B, W = st.W, rise = o.rise || 8, left = o.left !== false, x = left ? 3 : W - 7, y0 = st.y;
    B.spawn('mplat', x, y0 - 1, { pw: 3, ax: 0, ay: -rise * TS, speed: 1.3, skin: 'jpGondola' });
    for (let y = y0 - rise; y <= y0; y++) for (let k = 0; k < 3; k++) B.ghosts.push([x - 1 + k, y]);
    const y1 = y0 - rise, lx = left ? x + 3 : x - 8;
    B.fill(lx, y1, lx + 5, y1, T.GROUND); st.coins(lx, lx + 5, y1 - 2);
    if (o.enemy) st.enemy(o.enemy, lx + 3, y1, { edgeTurn: true });
    if (o.gear) { const sx = st.x, sg = st.gy; st.x = lx + 1; st.gy = y1; Tour.pieces.gearStand(st, { item: o.gear, here: true }); st.x = sx; st.gy = sg; }
    if (o.first) B.spawn('sign', left ? 8 : W - 9, y0 - 1, { text: 'Step into a window-washer\'s cradle: it carries you up the tower' });
    st.top(y1 - 3);
  },
  // neon sign ledges: they flicker off for a moment on a clock (odd and even ones never dark together). { n, gold }
  neonBand(st, o) {
    const B = st.B, W = st.W, n = o.n || 3;
    if (!st.neonClock) { st.neonClock = true; B.spawn('jpNeonClock', 2, st.y - 1, {}); B.toggle(1, [], [], { kind: 'neon', auto: true }); B.toggle(2, [], [], { kind: 'neon', auto: true }); }
    let y = st.y;
    for (let k = 0; k < n; k++) {
      y = st.y - 3 * (k + 1); const left = (k + (o.flip ? 1 : 0)) % 2 === 0, x0 = left ? 3 : W - 9, gi = 1 + ((k + (st.neonK || 0)) % 2);
      const r = [x0, y, x0 + 5, y, T.SEMI];
      for (let q = r[0]; q <= r[2]; q++) { B.set(q, y, T.SEMI); B.setHide(q, y, 1); }
      B.toggle(gi, [r], [], { kind: 'neon', auto: true });
      B.spawn('jpNeonSign', x0, y, { w: 6, g: gi, col: k + (st.neonK || 0), pic: k + 2 * (st.neonK || 0) });
      st.coins(x0 + 1, x0 + 4, y - 2);
      if (k === 1 && o.gold) st.gold(x0 + 3, y - 2, o.gold);
      if (k === 2 && o.enemy) st.enemy(o.enemy, st.mid, y - 1);
      // a short steady rung between one sign and the next
      if (k < n - 1) for (let q = st.mid - 1; q <= st.mid; q++) B.set(q, y - 2, T.SEMI);
    }
    st.neonK = (st.neonK || 0) + n;
    // a steady middle rung so a dark sign never strands anyone: the band's one-way floor waits above
    for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y - 1, T.SEMI);
    if (o.first) B.spawn('sign', st.mid, st.y - 1, { text: 'The neon signs blink off now and then. Watch for the flicker, then jump!' });
    st.top(y - 3);
  },
  // air-conditioner units: their exhaust lifts Brady up the face. { n }
  acBand(st, o) {
    const B = st.B, W = st.W, n = o.n || 2; let y = st.y;
    for (let k = 0; k < n; k++) {
      const left = (k + (o.flip ? 1 : 0)) % 2 === 0, x0 = left ? 2 : W - 6, h = 9;
      // the AC's base: from the wall to the draught (after the first, a catwalk reaching back toward the last landing)
      if (k === 0) B.fill(left ? 1 : W - 7, y, left ? 6 : W - 2, y, T.GROUND); else B.fill(left ? 1 : W - 14, y, left ? 13 : W - 2, y, T.GROUND);
      B.decorAt('jpACUnit', x0 + 1, y, k);
      B.zone(x0, y - h - 1, 3, h + 1, 0, -110 * TS, 7.2 * TS, 'updraft', { pull: 3 });
      const ly = y - h + 1, lx = left ? x0 + 3 : x0 - 6;
      B.fill(lx, ly, lx + 5, ly, T.GROUND); st.coins(lx + 1, lx + 4, ly - 2);
      for (let yy = y - 2; yy > ly; yy -= 3) st.coins(x0 + 1, x0 + 1, yy);
      if (k === 0 && o.enemy) st.enemy(o.enemy, lx + 3, ly, { edgeTurn: true });
      y = ly;
    }
    if (o.first) B.spawn('sign', 9, st.y - 1, { text: 'Hop into the air-con\'s warm draught: it blows you up!' });
    st.top(y - 3);
  },
  // a lucky-cat statue on a ledge flicking coins, a capsule rolling along the next one
  catBand(st, o) {
    const B = st.B, W = st.W, y1 = st.y - 3, y2 = st.y - 6;
    B.fill(2, y1, 10, y1, T.GROUND); st.enemy('jpLuckyCat', 5, y1);
    B.fill(W - 12, y2, W - 3, y2, T.GROUND); st.enemy('jpCapsule', W - 6, y2, { edgeTurn: true });
    st.coins(W - 11, W - 4, y2 - 2);
    if (o.item) st.block(7, y1 - 4, o.item);
    for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y1 - 1, T.SEMI);
    st.top(y2 - 3);
  },
  // the arcade window on a ledge: in through the glass to the capsule-toy room (the secret)
  arcadeBand(st, o) {
    const B = st.B, W = st.W, y = st.y - 3, left = !!o.left, x0 = left ? 2 : W - 12;
    B.fill(x0, y, x0 + 9, y, T.GROUND);
    B.spawn('portal', x0 + 5, y - 1, { kind: 'door', look: 'jpArcadeDoor', targetRef: o.to || null });
    if (o.back) B.anchor(o.back, x0 + 8, y - 1);
    st.coins(left ? x0 + 10 : x0 - 4, left ? x0 + 13 : x0 - 1, y - 2);
    for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y, T.SEMI);
    st.top(y - 3);
  },
  // the claw machine's claw as a lift up a light well; P3 hangs off its top. { rise }
  clawBand(st, o) {
    const B = st.B, W = st.W, rise = o.rise || 10, x = st.mid - 1, y0 = st.y;
    B.spawn('mplat', x, y0 - 1, { pw: 3, ax: 0, ay: -rise * TS, speed: 1.1, skin: 'jpClawLift' });
    for (let y = y0 - rise; y <= y0; y++) for (let k = 0; k < 3; k++) B.ghosts.push([x - 1 + k, y]);
    const y1 = y0 - rise;
    B.fill(2, y1, 8, y1, T.GROUND); B.fill(W - 9, y1, W - 3, y1, T.GROUND);
    st.coins(x - 1, x + 1, y1 - 3);
    // P3: off the side of the claw half-way up (jump for it; a miss lands on the band below)
    st.gold(x + 3, y0 - 5, o.gold || 'risky'); st.coins(x + 3, x + 3, y0 - 7);
    st.enemy('jpCrow', W - 6, y1);
    st.top(y1 - 3);
  },
  // the checkpoint floor (a full-width deck with a checkpoint)
  deckCp(st) { const B = st.B, W = st.W, y = st.y - 3; B.fill(2, y, W - 3, y, T.GROUND); st.spawn('checkpoint', Math.floor(W / 2) + 4, y - 1); B.decorAt('jpVending', 5, y, 2); for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y, T.SEMI); st.top(y - 3); },
  // the rooftop: a water tank and an antenna (the summit itself is built by the climb)
  roofDecor(st) { st.B.decorAt('jpWaterTank', 6, st.y, 0); return st.x; },

  /* ---- 11-5 the castle garden ---- */
  // a grey heron on the path: bow to it (hold DOWN facing it) and it bows back and lets you through
  heron(st, o) {
    const B = st.B, x = st.x, id = o.id || 'heron' + x, h = 4; st.floor(x, x + 12);
    B.spawn('jpHeron', x + 8, st.gy - 1, { opens: id });
    B.vkey(id, [[x + 4, st.gy - 1], [x + 5, st.gy - 1], [x + 6, st.gy - 1]]);
    tourShutterLock(B, x + 10, st.gy - h, st.gy - 1, id, 'jpBowGate');
    B.fill(x + 10, Math.max(0, st.gy - h - 8), x + 10, st.gy - h - 1, T.HARD);
    if (o.sign) st.sign(x + 1, 'A polite heron blocks the gate. Bow to it: hold DOWN, facing it');
    st.coins(x + 1, x + 6, st.gy - 3);
    return x + 13;
  },
  // the revolving wall that turns twice: a secret door into the storehouse
  kuraWall(st, o) {
    const x = st.x, nx = Tour.pieces.secretDoor(st, { to: o.to, look: 'painted', skin: 'jpKuraPanel', back: o.back });
    for (let yy = st.gy - 4; yy < st.gy; yy++) for (let xx = x + 3; xx <= x + 5; xx++) st.B.setHide(xx, yy, 1);
    return nx;
  },
  // the garden: P1 on the high beam
  gardenP1(st, o) { const x = st.x, nx = Tour.pieces['jp.garden'](st, {}); st.gold(x + 9, st.gy - 7, 'must'); return nx; },

  /* ---- 11-6 inside the capsule-toy machine ---- */
  // giant capsules rolling back and forth across the gaps: ride them. { n }
  capsules(st, o) {
    const B = st.B, n = o.n || 2; let x = st.x; st.floor(x, x + 1); x += 2;
    for (let k = 0; k < n; k++) {
      const span = 7; st.pit(x, x + span - 1);
      st.spawn('mplat', x + 1, st.gy - 1, { pw: 3, ax: (span - 4) * TS, ay: 0, speed: 1.6 + k * 0.2, phase: k * 0.8, skin: 'jpCapsulePlat' });
      for (let q = 0; q < span; q++) B.ghosts.push([x + q, st.gy]);
      st.coins(x + 2, x + span - 3, st.gy - 3);
      x += span; st.floor(x, x + 2); if (k < n - 1) { st.decor('jpToyPile', x + 1, st.gy, k); x += 3; }
    }
    if (o.first) st.sign(st.x, 'Inside a capsule-toy machine! Ride the rolling capsules');
    return x + 3;
  },
  // the coin slot: a chrome wall with the glowing slot; climb the giant coins, P1 on top. { gold }
  coinSlot(st, o) {
    const B = st.B, x = st.x, h = 7; st.floor(x, x + 14);
    for (let k = 0; k < 3; k++) { const cx = x + 1 + k * 2, cy = st.gy - 2 - k * 2; B.prop('jpBigCoin', cx, cy, 2, 1, 'top', {}); }
    B.prop('jpCoinSlot', x + 7, st.gy - h, 3, h, 'body', {});
    st.coins(x + 7, x + 9, st.gy - h - 2);
    st.gold(x + 8, st.gy - h - 3, o.gold || 'must');
    st.enemy('jpCapsule', x + 12, st.gy);
    return x + 15;
  },
  // the spiral chute: a winding slide of slick plastic steps down to the machine's floor
  chute(st, o) {
    const B = st.B, n = o.n || 5; let x = st.x; st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) { st.gy = clamp(st.gy + 1, st.gyMin, st.gyMax + 2); st.floor(x, x + 2); for (let q = x; q <= x + 2; q++) B.set(q, st.gy, T.ICE); st.coins(x, x + 2, st.gy - 2); x += 3; }
    st.floor(x, x + 3); st.enemy('jpCapsule', x + 2, st.gy);
    if (o.first) st.sign(st.x, 'The spiral chute is slippery. Wheee!');
    return x + 4;
  },
  // the crank turns the whole drum: ride its paddles round; P3 at the top of the turn
  drum(st, o) {
    const x = st.x, r = o.r || 4, nx = Tour.pieces.wheel(st, { r, arms: 4, speed: o.speed || 0.5, skin: 'jpDrum' });
    st.gold(x + 3 + r, st.gy - 2 * r - 4, o.gold || 'risky');
    return nx;
  },
  // a straw sandal on the floor of the machine (one of them is a tanuki)
  sandalTanuki(st, o) {
    const x = st.x, n = 12; st.floor(x, x + n);
    st.decor('jpSandal', x + 3, st.gy, 1); st.decor('jpToyPile', x + 6, st.gy, 2);
    st.enemy('jpTanuki', x + 9, st.gy, { disguise: 'sandal' });
    st.coins(x + 4, x + 10, st.gy - 4);
    return x + n + 1;
  },
  // a big capsule you can open: in through the gap (the secret room)
  openCapsule(st, o) { return Tour.pieces.door(st, { to: o.to, perch: 0, look: 'jpCapsuleDoor', back: o.back }); },

  /* ---- 11-7 Fuji thermals ---- */
  // a chain of islands stepping down, coins in arcs between them like a line of paper cranes. { n, gold }
  craneChain(st, o) {
    const n = o.n || 3; let x = st.x;
    for (let k = 0; k < n; k++) {
      st.floor(x, x + 3); if (k % 2 === 0) st.decor('jpPine', x + 2, st.gy, k);
      const gap = o.gap || 4; st.arc(x + 3, x + 4 + gap, st.gy - 2, 3);
      if (k === 1 && o.gold) st.gold(x + 5, st.gy - 4, o.gold);
      x += 4 + gap; st.gy = clamp(st.gy + (o.down === false ? 0 : 1), st.gyMin, st.gyMax);
    }
    st.floor(x, x + 3);
    return x + 4;
  },
  // a cherry-petal thermal: an updraft column over a gap lifts Brady to a higher island. { h }
  petalDraft(st, o) {
    const B = st.B, x = st.x, h = o.h || 10, w = 2; st.floor(x, x + 3);
    st.pit(x + 4, x + 5 + w);
    B.zone(x + 4, st.gy - h, w + 1, h + 4, 0, -110 * TS, 7.2 * TS, 'updraft', { pull: 3 });
    B.spawn('jpPetalDraft', x + 4, st.gy + 3, { w: w + 1, h: h + 4 });
    for (let yy = st.gy - 1; yy > st.gy - h; yy -= 3) st.coins(x + 5, x + 5, yy);
    const top = clamp(st.gy - Math.min(h - 3, 6), st.gyMin, st.gyMax);
    // the landing island (also reachable by a plain jump from a step: no glide needed)
    st.floor(x + 1, x + 2, st.gy - 3);
    st.gy = top; st.floor(x + 6 + w, x + 10 + w);
    if (o.gold) st.gold(x + 5, st.gy + 2, o.gold);
    return x + 11 + w;
  },
  // low over the lake: little stepping islets, the water close below (falling in is a swim, not a loss)
  lakeIslets(st, o) {
    const B = st.B, n = o.n || 4; let x = st.x; st.floor(x, x + 2); x += 3;
    const lake = st.B.H - 4;
    // the islets sit just above the water, so a dunk is a swim and a hop back out (the lake has a sandy bed)
    st.gy = lake - 2;
    for (let k = 0; k < n; k++) {
      const w = 3; B.fill(x, lake, x + w + 1, B.H - 2, T.WATER); B.fill(x, B.H - 1, x + w + 1, B.H - 1, T.GROUND);
      const iy = lake - 2 - (k % 2);
      B.fill(x + w + 2, iy, x + w + 4, B.H - 1, T.GROUND);
      st.arc(x, x + w + 2, iy - 2, 2); x += w + 5; st.gy = iy;
    }
    st.floor(x, x + 2);
    if (o.gold) st.gold(x - 6, B.H - 5, o.gold);
    return x + 3;
  },
  // the mountain hut on its island (the secret room)
  hut(st, o) { return Tour.pieces.door(st, { to: o.to, perch: 0, look: 'jpHutDoor', back: o.back }); }
};

/* ---------------- themes for the rooms ---------------- */
THEMES.jp_fridge = Object.assign({}, THEMES.jp_sushi, {
  name: 'The Fridge', particles: 'snow', sky: ['#cfe8f8', '#e8f4fc', '#ffffff'], horizonGlow: '#ffffff', fog: '#f0f8ff',
  layers: [{ kind: 'jpSushiBar', color: '#bcd8ec', base: 336, f: 0.08 }],
  ground: { style: 'jpFrost', cap: '#e8f6ff', capHi: '#ffffff', dirt: '#a8c8e0', dirt2: '#88a8c8', rock: '#c8e0f0' },
  hard: { c1: '#e8f0f8', c2: '#b8c8d8' }
});

/* ---------------- stamps ---------------- */
const stamps = {
  // 11-1 (s): inside the fridge: frosty shelves, ice underfoot, the pickled plums and a 1-up on the top shelf
  reizoko: {
    floor: 11,
    rows: room(28, 14, 11, [
      [2, 10, '@.D'],
      [6, 11, 'IIIIIIIIIIIIIIIII'],
      [6, 8, '-----'], [13, 6, '------'], [21, 8, '----'],
      [6, 7, 'o.o.o'], [21, 7, 'o.o'],
      [15, 4, '*'], [11, 3, '?'],
      [8, 10, 'k'], [16, 10, 'k'], [23, 10, 'k']
    ]),
    legend: { k: ['decor', 'jpFridgeFood'] },
    items: ['oneup'],
    doors: [{ to: 'kaiten@fridgeBack', look: 'jpFridgeInside' }],
    gold: { '*': 'hidden' }
  },
  // 11-2 (s): the siding: an old carriage parked at the buffers, the way out along the empty track
  sokusen: {
    floor: 11,
    rows: room(32, 14, 11, [
      [2, 10, '@'],
      [7, 8, '------'], [15, 6, '-----'],
      [7, 7, 'o.o.o'], [16, 4, '*'],
      [10, 10, 'k'], [20, 9, '?'],
      [27, 10, 'g']
    ]),
    legend: { k: ['decor', 'jpBench'] },
    items: ['star'],
    gold: { '*': 'hidden' }
  },
  // 11-3 (s): the tea room: tatami, a low table, the far screen slides to the secret gate (the Souvenir Stand)
  chashitsu: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [8, 8, '-----'], [15, 6, '----'],
      [8, 7, 'o.o.o'], [16, 4, '*'],
      [12, 10, 'k'], [20, 7, '?'],
      [25, 10, 'g']
    ]),
    legend: { k: ['decor', 'jpIkebana'] },
    items: ['lsd'],
    doors: [{ to: 'chikurin@teaBack', look: 'jpBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 11-4 (s): the capsule-toy arcade on the 30th floor; the far machine hides the secret gate
  gachaRoom: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [7, 10, 'k...k'], [8, 7, '----'], [15, 5, '-----'],
      [8, 6, 'o.o.o'], [17, 3, '*'], [21, 7, '?'],
      [25, 10, 'g']
    ]),
    legend: { k: ['decor', 'jpCapsuleMachine'] },
    items: ['star'],
    doors: [{ to: 'biru@arcadeBack', look: 'jpBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 11-5 (s): the castle storehouse: rice bales, lacquer boxes, a hidden 1-up
  kura: {
    floor: 11,
    rows: room(28, 14, 11, [
      [2, 10, '@.D'],
      [8, 10, 'r'], [18, 10, 'x'], [22, 10, 'x'],
      [9, 7, '------'], [17, 5, '----'],
      [10, 6, 'o.o.o'], [18, 3, '*'], [13, 3, 'h']
    ]),
    legend: { r: ['decor', 'jpRiceBales'], x: ['decor', 'jpLacquerBox'] },
    hidden: ['oneup'],
    doors: [{ to: 'shiro@kuraBack', look: 'jpKuraDoor' }],
    gold: { '*': 'hidden' }
  },
  // 11-6 (s): inside the big capsule: a toy cache, a bubble wand, coins
  capsuleRoom: {
    floor: 11,
    rows: room(28, 14, 11, [
      [2, 10, '@.D'],
      [7, 10, 'k'], [20, 10, 'k'],
      [8, 8, '----'], [14, 6, '----'], [20, 4, '---'],
      [8, 7, 'o.o.o'], [21, 2, '*'], [15, 3, '?']
    ]),
    legend: { k: ['decor', 'jpToyPile'] },
    items: ['oneup'],
    doors: [{ to: 'gacha@capsuleBack', look: 'jpBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 11-7 (s): the mountain hut: a warm hearth room, a high shelf with P2
  hutRoom: {
    floor: 11,
    rows: room(28, 14, 11, [
      [2, 10, '@.D'],
      [8, 10, 'k'], [18, 10, 'k'],
      [9, 8, '----'], [15, 6, '----'], [21, 4, '---'],
      [9, 7, 'o.o.o'], [22, 2, '*'], [16, 3, '?']
    ]),
    legend: { k: ['decor', 'jpTeapot'] },
    items: ['star'],
    doors: [{ to: 'fuji@hutBack', look: 'jpBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // the Souvenir Stand Omise (a Shiba's shop)
  stand: {
    floor: 10,
    rows: room(28, 12, 10, [
      [2, 9, '@'], [5, 9, 'k'], [8, 9, 'l'], [11, 9, '$'], [21, 9, 'l'], [24, 9, 'G']
    ]),
    legend: { k: ['decor', 'jpTeapot'], l: ['decor', 'jpStoneLantern'] }
  }
};

/* ---------------- the levels ---------------- */
const levels = [
  // 11-1 FACTORY: the sushi carousel
  { n: 1, name: 'Sushi Carousel', arch: 'factory', theme: 'jp_sushi',
    gimmick: 'A giant conveyor-belt sushi bar: ride the plates along the belts, dodge the chopsticks, float on tea steam, and mind the soy bottle with a leaf on its cap',
    hint: 'Belts carry you; some turn round when their arrows blink. A soy bottle with a leaf is a tanuki!',
    postcard: 'Brady! The sushi goes round and round on little plates. One soy bottle winked at me. ♥ C',
    enemies: [['jpTamago', 2], ['jpTako', 2], ['jpWasabi', 1], ['jpTanuki', 1]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '11-2' } },
    areas: [
      { id: 'kaiten', gen: 'strip', W: 210, H: 20,
        script: [
          'shiba',
          ['itemBlock', { item: 'power', y: 4 }],
          // ① the belts on their counters, the plate wheel over the soy
          ['kaiten', { n: 8, h: 2, first: true }],
          ['kaiten', { n: 9, h: -1, gap: 3, enemy: 'jpTamago' }],
          'counter',
          ['plateWheel', { up: true }],
          ['kaiten', { n: 10, h: 3, gap: 2, enemy: 'jpTako' }],
          'cp',
          // ② chopsticks from above, tea steam, the cold fridge
          ['shelfRun', {}],
          ['teacup', { first: true }],
          ['fridge', { to: 'reizoko@in', back: 'fridgeBack' }],
          ['kaiten', { n: 9, dir: -1, h: -2, gap: 3 }],
          // ③ the soy-bottle tanuki and the belts that turn round
          ['soyTanuki', { sign: true, two: true }],
          ['reverseBelt', { n: 9, first: true }],
          ['itemBlock', { item: 'oneup', y: 4, hidden: true }],
          ['reverseBelt', { n: 10, period: 2.6, phase: 1 }],
          ['enemies', { kind: 'jpWasabi', n: 2, len: 8 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'reizoko', gen: 'room', role: 'secret', theme: 'jp_fridge', stamp: 'reizoko' }
    ] },
  // 11-2 RIDE: on the roof of the bullet train; a station's siding is the way to Fuji
  { n: 2, name: 'Bullet Train', arch: 'ride', theme: 'jp_rail',
    gimmick: 'Ride the roof of a bullet train past the volcano: duck the gantries, crouch through the tunnels, swat crows and runaway umbrellas; a station siding peels off',
    hint: 'Hold DOWN to duck the gantries and tunnel lamps. At the station, hop up onto the platform!',
    postcard: 'We\'re going 300 km an hour and you\'re on the ROOF?! Hold on to something. ♥ C',
    enemies: [['jpCrow', 2], ['jpUmbrellaFly', 2]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '11-3' }, secret: { to: '11-7', hint: 'At a little station, a side track curves away toward the mountain...' } },
    areas: [
      { id: 'shinkansen', gen: 'ride', vehicle: 'jpBullet', vehicleW: 16, deck: 11, H: 16, len: 232, scroll: 3.2,
        script: [
          'endcap',
          ['fujiview', { item: 'power' }],
          'gantry',
          ['postcard', { kind: 'must', dx: -2, dy: -2 }],
          'crows',
          ['tunnel', { n: 16 }],
          'brollies',
          ['station', { to: 'sokusen@in' }],
          'gantry',
          ['fujiview', { item: 'sig' }],
          'cp',
          ['tunnel', { n: 22, lamps: 3, gold: true }],
          'crows',
          ['gantry', { two: true }],
          'brollies',
          ['tunnel', { n: 14 }],
          ['fujiview', { item: 'star' }]
        ] },
      { id: 'sokusen', gen: 'room', role: 'secret', theme: 'jp_rail', stamp: 'sokusen' }
    ] },
  // 11-3 PHASE: the bamboo grove by day and by night
  { n: 3, name: 'Night of Things', arch: 'phase', theme: 'jp_bamboo',
    gimmick: 'Ring the wind chime and the bamboo grove falls into night: lantern spirits blink closer, umbrellas hop, glowing stones rise from the pond. One stone lantern has a leaf on top',
    hint: 'Ring the wind chime (UP) to swap day and night. A bamboo pole crosses by day; glowing stones by night',
    postcard: 'The bamboo is taller than a house. At night the umbrellas here go hopping! Honestly. ♥ C',
    enemies: [['jpOnigiri', 2], ['jpUmbrella', 2], ['jpChochin', 2], ['jpTanuki', 1]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '11-4' }, secret: { to: 'house:jp-omise', hint: 'A teahouse in the grove: behind the tea room\'s far screen...' } },
    areas: [
      { id: 'chikurin', gen: 'strip', W: 220, H: 20, phase: { night: 'jp_bamboo_night' },
        script: [
          ['itemBlock', { item: 'power', y: 4 }],
          // ① by day: bending bamboo, bursting shoots, a lazy rice ball
          ['vault', { n: 2, first: true }],
          ['step', { h: 2 }],
          'shoots',
          ['step', { h: 2 }],
          'grove',
          ['phaseCross', { n: 7 }],
          // ② the wind chime: night falls; the things wake
          ['gearStand', { item: 'kazoo' }],
          ['chime', { sign: true }],
          ['phaseCross', { n: 8, day: false, night: true, nightY: 2 }],
          ['nightThings', { len: 12 }],
          ['step', { h: -3 }],
          'cp',
          ['teahouse', { to: 'chashitsu@in', back: 'teaBack' }],
          ['lanternTanuki', {}],
          ['itemBlock', { item: 'lsd', y: 5 }],
          // ③ swap on the move: a crossing for each, tanuki among the lanterns, spirits blinking in
          ['chime', {}],
          ['phaseCross', { n: 9, dayY: 1, night: true, nightY: 4, gold: 'risky' }],
          ['step', { h: 2 }],
          ['nightThings', { len: 12, onigiri: true }],
          ['step', { h: -2 }],
          ['lanternTanuki', { two: true }],
          ['chime', {}],
          ['kpond', {}],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'chashitsu', gen: 'room', role: 'secret', theme: 'jp_castle', stamp: 'chashitsu' }
    ] },
  // 11-4 TOWER (c) exterior: up the outside of a neon tower at dusk
  { n: 4, name: 'Neon Tower', arch: 'tower', theme: 'jp_tower',
    gimmick: 'Climb the outside of a tower at dusk: window-washer gondolas, neon sign ledges that blink off, air-con draughts, a claw-machine lift, then the rooftop',
    hint: 'Neon signs blink before they go dark. Hop into an air-con draught to float up',
    postcard: 'You\'re climbing the OUTSIDE of a skyscraper. The window washers waved. ♥ C',
    enemies: [['jpCrow', 2], ['jpLuckyCat', 1], ['jpCapsule', 1]],
    mapCell: [2, 1], mapFrom: 2,
    exits: { main: { to: '11-5' }, secret: { to: '11-6', hint: 'A lit arcade window halfway up the tower...' } },
    areas: [
      { id: 'biru', gen: 'climb', variant: 'exterior', W: 30, H: 110,
        script: [
          'lobby',
          ['gondolaBand', { left: true, rise: 8, first: true, enemy: 'jpCapsule' }],
          ['neonBand', { n: 3, gold: 'must', first: true }],
          ['gondolaBand', { left: false, rise: 7, gear: 'plane' }],
          'deckCp',
          ['acBand', { n: 2, first: true }],
          ['arcadeBand', { to: 'gachaRoom@in', back: 'arcadeBack' }],
          ['catBand', { item: 'power' }],
          ['neonBand', { n: 3, flip: true, enemy: 'jpCrow' }],
          ['clawBand', { rise: 10 }]
        ] },
      { id: 'gachaRoom', gen: 'room', role: 'secret', theme: 'jp_neon', stamp: 'gachaRoom' }
    ] },
  // 11-5 LAIR: the castle garden and the Great Kappa's pond
  { n: 5, name: 'Kappa Garden', arch: 'lair', theme: 'jp_castle', boss: 'jp_kappa',
    gimmick: 'Nightingale floors chirp underfoot, a polite heron guards a gate, a revolving wall turns twice; then the Great Kappa at his garden pond',
    hint: 'Kappa are VERY polite. When he glares, crouch (hold DOWN) facing him: he bows back and spills his dish. Block his pond with the stones!',
    postcard: 'The golden fish are back on the castle roof! The Baron took off toward the Himalaya. This is it, Brady. ♥ C',
    enemies: [['jpUmbrella', 2], ['jpTop', 2]],
    mapCell: [1, 2], mapFrom: 3,
    exits: { main: { to: 'country:next' } },
    areas: [
      { id: 'shiro', gen: 'strip', W: 84, H: 18,
        script: [
          ['shiba', { quiet: true }],
          ['itemBlock', { item: 'power', y: 4 }],
          'nightingale',
          ['heron', { sign: true }],
          ['moat', { gold: true }],
          ['revolve', { first: true }],
          'cp',
          ['kuraWall', { to: 'kura@in', back: 'kuraBack' }],
          'gardenP1',
          ['door', { to: 'pond', perch: 0, look: 'jpGardenGate' }]
        ] },
      { id: 'kura', gen: 'room', role: 'secret', stamp: 'kura' },
      { id: 'pond', gen: 'arena', role: 'arena', layout: 'pond', arenaW: 26, H: 18, roof: false }
    ] },
  // 11-6 MINI (secret): inside a capsule-toy machine
  { n: 6, name: 'Capsule Toy Machine', arch: 'mini', secret: true, theme: 'jp_gacha',
    gimmick: 'Tiny Brady inside a giant capsule-toy machine: ride the rolling capsules, climb the coin slot, slide the spiral chute and ride the crank-turned drum',
    hint: 'The Bubble Wand traps capsule critters in bubbles you can stand on',
    postcard: 'I got a tiny Brady out of a capsule machine! It looks just like you. ♥ C',
    enemies: [['jpCapsule', 3], ['jpTanuki', 1]],
    mapCell: [2, 2], mapFrom: 3,
    exits: { main: { to: null } },
    areas: [
      { id: 'gacha', gen: 'strip', W: 180, H: 22,
        script: [
          ['itemBlock', { item: 'power', y: 4 }],
          ['capsules', { n: 2, first: true }],
          ['gearStand', { item: 'wand' }],
          ['coinSlot', {}],
          ['enemies', { kind: 'jpCapsule', n: 2, len: 10 }],
          'cp',
          ['chute', { n: 5, first: true }],
          ['openCapsule', { to: 'capsuleRoom@in', back: 'capsuleBack' }],
          ['sandalTanuki', {}],
          ['capsules', { n: 3 }],
          ['itemBlock', { item: 'lsd', y: 5 }],
          ['drum', { r: 4 }],
          ['enemies', { kind: 'jpCapsule', n: 1, len: 8 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'capsuleRoom', gen: 'room', role: 'secret', theme: 'jp_gacha', stamp: 'capsuleRoom' }
    ] },
  // 11-7 GLIDE (secret): over the lake under the volcano
  { n: 7, name: 'Fuji Thermals', arch: 'glide', secret: true, theme: 'jp_fuji',
    gimmick: 'Fold the paper plane into a crane and glide from island to island; cherry-petal thermals lift you; skim the lake low',
    hint: 'Hold jump while falling to glide. Petal columns are warm air: they lift you',
    postcard: 'The mountain sits in the lake like it\'s looking in a mirror. Paper cranes everywhere! ♥ C',
    enemies: [['jpCrow', 2], ['jpUmbrellaFly', 2]],
    mapCell: [0, 1], mapFrom: 1,
    exits: { main: { to: null } },
    areas: [
      { id: 'fuji', gen: 'islands', W: 220, H: 34, GY: 12,
        script: [
          ['gearStand', { item: 'plane', skin: 'jpCraneStand' }],
          ['itemBlock', { item: 'power', y: 4 }],
          // ① glide the crane chain down
          ['craneChain', { n: 4, gold: 'must' }],
          ['enemies', { kind: 'jpCrow', n: 1, len: 6 }],
          // ② cherry-petal thermals
          ['petalDraft', { h: 11 }],
          ['hut', { to: 'hutRoom@in', back: 'hutBack' }],
          ['craneChain', { n: 3 }],
          ['petalDraft', { h: 12 }],
          'cp',
          ['gearStand', { item: 'plane', skin: 'jpCraneStand' }],
          // ③ down to the lake and its reflections, a last thermal up
          ['craneChain', { n: 3, gap: 5 }],
          ['lakeIslets', { n: 4, gold: 'risky' }],
          ['enemies', { kind: 'jpUmbrellaFly', n: 1, len: 6 }],
          ['itemBlock', { item: 'lsd', y: 5 }],
          ['petalDraft', { h: 12 }],
          ['craneChain', { n: 2 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'hutRoom', gen: 'room', role: 'secret', theme: 'jp_fuji', stamp: 'hutRoom' }
    ] }
];

for (const k in P) Tour.pieces['jp.' + k] = P[k];
Tour.amend('jp', {
  stamps, skins,
  map: { fort: 'garden', start: [0, 0] },
  houses: [{ id: 'jp-omise', kind: 'stand', name: 'Omise', keeper: 'shiba', stock: ['kazoo', 'plane', 'wand', 'magnet', 'oneup', 'sundial'], mapCell: [1, 1], mapFrom: 2 }],
  levels
});
})();
