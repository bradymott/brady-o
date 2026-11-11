/* ============================================================
   France (world 7): the levels in the v2 format (LEVEL_OVERHAUL.md
   §2 "World 7", §3.2 graph). Loads after 29_tour_fr.js (the look,
   the cast, the boss) and adds, with Tour.amend: the stamps (rooms
   drawn in ASCII), the country looks for library objects (skins),
   the set pieces of the overhaul, the Souvenir Stand La Brocante,
   the map graph and all seven levels.
   ============================================================ */
(() => {
const C = Tour.countries.fr;
if (!C) return;
const K = TourKit;
const MAC = ['#ff9ab8', '#a8e0b0', '#c8a8ff', '#ffe08a', '#8ad0ff', '#ffb08a'];

/* ---------------- stamps on a grid ----------------
   room(W, H, floor, marks, opts): rows for a stamp. Walls left and right (opts.wall, default 'H'), ground from the
   floor row down, a ceiling unless opts.open; marks = [[x, y, 'text'], ...] write text into the rows from (x, y). */
function room(W, H, floor, marks, opts) {
  opts = opts || {};
  const wall = opts.wall || 'H', rows = [];
  for (let y = 0; y < H; y++) {
    let r;
    if (y >= floor) r = '#'.repeat(W);
    else if (y === 0 && !opts.open) r = (opts.roof || '#').repeat(W);
    else r = wall + '.'.repeat(W - 2) + wall;
    rows.push(r.split(''));
  }
  for (const [x, y, txt] of marks) for (let k = 0; k < txt.length; k++) if (txt[k] !== ' ' && x + k < W && y < H) rows[y][x + k] = txt[k];
  return rows.map(r => r.join(''));
}

/* ---------------- objects of the overhaul ---------------- */
// a delivery for the 7-1 rounds (a HUB stamp): a parcel to pick up at the end of a sub-area; it is a key for the
// matching hatch at the plaza's post office (the validator: a vkey with the same id)
const PARCEL = {
  bread(ctx, x, y, t) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5); const g = ctx.createLinearGradient(-5, 0, 5, 0); g.addColorStop(0, '#c87a32'); g.addColorStop(0.5, '#f0b860'); g.addColorStop(1, '#b86a2a'); ctx.fillStyle = g; rr(ctx, -5, -16, 10, 32, 5); ctx.fill(); ctx.strokeStyle = '#fff0c8'; ctx.lineWidth = 1.4; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-2.5, -11 + k * 7); ctx.lineTo(2.5, -7 + k * 7); ctx.stroke(); } ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, 2, 12, 9); ctx.fillStyle = '#c8283a'; ctx.fillRect(-6, 5, 12, 2); ctx.restore(); },
  letter(ctx, x, y, t) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2) * 0.15); ctx.fillStyle = '#fff8ec'; rr(ctx, -13, -9, 26, 18, 2); ctx.fill(); ctx.strokeStyle = '#c8a878'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-13, -9); ctx.lineTo(0, 1); ctx.lineTo(13, -9); ctx.stroke(); ctx.fillStyle = '#3a6ad8'; ctx.fillRect(5, -6, 6, 7); ctx.fillStyle = '#c8283a'; ctx.beginPath(); ctx.arc(0, 2, 3, 0, TAU); ctx.fill(); ctx.restore(); },
  crepe(ctx, x, y, t) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 6, 15, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b860'; ctx.beginPath(); ctx.moveTo(-12, 4); ctx.quadraticCurveTo(0, -14, 12, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#6a3a1a'; ctx.beginPath(); ctx.moveTo(-8, 2); ctx.quadraticCurveTo(0, -8, 8, 2); ctx.lineTo(4, 2); ctx.quadraticCurveTo(0, -3, -4, 2); ctx.fill(); ctx.fillStyle = '#c8843a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-6 + k * 4, -2 + (k % 2) * 3, 1.2, 0, TAU); ctx.fill(); } ctx.restore(); }
};
class FrParcel extends Ent {
  constructor(g, s) { super(g, s, 30, 34); this.id = s.id; this.item = s.item || 'bread'; this.hy = this.y; if (g.keys && g.keys.has(this.id)) this.remove = true; this.item_ = true; }
  update(dt) { this.t += dt; this.y = this.hy + Math.sin(this.t * 2.4) * 4; }
  touchPlayer(p) {
    if (this.remove) return;
    const g = this.g; this.remove = true; g.keys.add(this.id);
    const n = ['d1', 'd2', 'd3'].filter(k => g.keys.has(k)).length;
    K.sfx('stamp', 'checkpoint'); g.burst(this.cx, this.cy, 18, '#ffd84a', 'confetti');
    g.toast(n >= 3 ? 'ALL THREE DELIVERIES! THE POST OFFICE OPENS' : `DELIVERY ${n} OF 3: TAKE IT BACK TO THE PLAZA`);
  }
  draw(ctx) {
    const x = this.cx, y = this.y + 14;
    ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.t * 4); ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill(); ctx.restore();
    Ink.around(ctx, this.x - 6, this.y - 8, this.w + 12, this.h + 16, c => PARCEL[this.item](c, x, y, this.t), { pad: 8 });
  }
  get light() { return { r: 70, c: 'rgba(255,240,170,' }; }
}
// the plaza's post office: one hatch per delivery (a lock that opens for its parcel), painted with what it wants
class FrHatch extends ENTITY_TYPES.lock {
  constructor(g, s) { super(g, s); this.icon = s.icon || 'bread'; }
  draw(ctx) {
    const x = this.x + 6, y = this.y, w = TS, h = this.h, k = this.open ? clamp(1 - (this.openT || 0) / 0.6, 0, 1) : 0;
    ctx.fillStyle = '#2a4a8a'; rr(ctx, x - 3, y - 6, w + 6, h + 6, 4); ctx.fill();
    const hh = h * (1 - k);
    for (let yy = 0; yy < hh; yy += 7) { ctx.fillStyle = yy % 14 ? '#c8ccd8' : '#a8b0c0'; ctx.fillRect(x + 1, y + yy, w - 2, Math.min(7, hh - yy)); }
    if (k < 0.5) { ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.42, 12, 0, TAU); ctx.fill(); ctx.save(); ctx.translate(x + w / 2, y + h * 0.42); ctx.scale(0.6, 0.6); PARCEL[this.icon](ctx, 0, 0, this.t); ctx.restore(); }
    const done = this.g.keys.has(this.id);
    ctx.fillStyle = done ? '#7ae07a' : '#ffd84a'; ctx.beginPath(); ctx.arc(x + w / 2, y - 12, 4, 0, TAU); ctx.fill();
  }
}
// the truffle pig (7-4): a friend on the surface who trots to the next dig spot, snuffles and points down
class FrTrufflePig extends Ent {
  constructor(g, s) { super(g, s, 34, 24); this.spots = (s.spots || []).map(x => x * TS + TS / 2); this.k = 0; this.friendly = true; this.dir = 1; this.sniff = 0; this.hx = this.cx; }
  update(dt) {
    this.t += dt; const p = this.g.player; if (!p) return;
    const tgt = this.spots[this.k];
    if (tgt == null) return;
    // it waits until Brady is close, trots to the spot, then snuffles there until Brady passes it
    if (Math.abs(this.cx - tgt) > 6) { if (p.cx > this.cx - 6 * TS) { this.dir = sign(tgt - this.cx); this.x += this.dir * 3.2 * TS * dt; } this.sniff = 0; }
    else { this.sniff += dt; if (Math.floor(this.sniff * 2) !== Math.floor((this.sniff - dt) * 2)) this.g.parts.text(this.cx + this.dir * 14, this.y - 8, 'SNIFF', '#ffd8e8'); if (p.cx > this.cx + 3 * TS || p.y > this.y + 3 * TS) this.k++; }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, d = this.dir, bob = Math.abs(this.cx - (this.spots[this.k] || this.cx)) > 6 ? Math.abs(Math.sin(this.t * 14)) * 2 : 0;
    // the fr_x atlas pig (sniffing as it trots, waving while it waits for Brady, pointing at the dig spot)
    const clip = this.sniff > 0.3 ? 'trufflePig_point_000' : this.sniff > 0 || bob ? 'trufflePig/idle' : 'trufflePig/wave';
    if (typeof Atlas !== 'undefined' && Atlas.animate(ctx, 'fr_x', clip, this.t, x, y - bob, d, { scale: 1.15 })) {
      if (this.sniff > 0.3) { ctx.fillStyle = `rgba(255,216,74,${0.6 + 0.4 * Math.sin(this.t * 8)})`; ctx.font = `14px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▼', x + d * 22, y - 34 + Math.sin(this.t * 8) * 3); }
      return;
    }
    Ink.around(ctx, this.x - 10, this.y - 30, this.w + 20, this.h + 34, c => {
      c.save(); c.translate(x, y - bob); c.scale(d, 1);
      c.fillStyle = '#e8a0a8'; for (const lx of [-9, -4, 5, 10]) c.fillRect(lx - 1.5, -7, 3, 7);
      c.beginPath(); c.ellipse(0, -13, 15, 9, 0, 0, TAU); c.fill();
      c.beginPath(); c.arc(13, -15 + (this.sniff > 0 ? 4 : 0), 7, 0, TAU); c.fill();
      c.fillStyle = '#d88890'; c.beginPath(); c.ellipse(19, -14 + (this.sniff > 0 ? 5 : 0), 3.4, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#8a4a50'; c.beginPath(); c.arc(19, -15 + (this.sniff > 0 ? 5 : 0), 0.9, 0, TAU); c.arc(19, -12.5 + (this.sniff > 0 ? 5 : 0), 0.9, 0, TAU); c.fill();
      c.fillStyle = '#c87880'; c.beginPath(); c.moveTo(9, -21); c.lineTo(12, -27); c.lineTo(15, -21); c.fill();
      c.fillStyle = '#1a1020'; c.beginPath(); c.arc(14, -17 + (this.sniff > 0 ? 4 : 0), 1.2, 0, TAU); c.fill();
      c.strokeStyle = '#e8a0a8'; c.lineWidth = 2; c.beginPath(); c.arc(-16, -15, 3, 0, Math.PI * 1.5); c.stroke();
      c.fillStyle = '#3a6ad8'; c.fillRect(-4, -22, 8, 3);
      c.restore();
    }, { pad: 6 });
    if (this.sniff > 0.3) { ctx.fillStyle = `rgba(255,216,74,${0.6 + 0.4 * Math.sin(this.t * 8)})`; ctx.font = `14px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▼', x + d * 22, y - 30 + Math.sin(this.t * 8) * 3); }
  }
}
FrTrufflePig.cfg = { atlas: 'fr_x' };   // so a level with the pig preloads its atlas (Play.extraAtlases)
Object.assign(ENTITY_TYPES, { frParcel: FrParcel, frHatch: FrHatch, frTrufflePig: FrTrufflePig });

/* ---------------- pieces ---------------- */
const P = {
  // the parcel at the end of a HUB sub-area: { id, item }
  delivery(st, o) {
    const x = st.x; st.floor(x, x + 4);
    st.B.spawn('frParcel', x + 2, st.gy - 2, { id: o.id, item: o.item });
    st.B.vkey(o.id, [[x + 2, st.gy - 1], [x + 2, st.gy - 2]]);
    return x + 5;
  },
  // a post-office hatch (from a stamp letter at its bottom cell): { id, icon, h }; solid wall above it to the roof
  hatch(st, o) {
    const B = st.B, x = st.x, y1 = st.gy - 1, h = o.h || 3, tiles = [];
    for (let y = y1 - h + 1; y <= y1; y++) { B.set(x, y, T.HARD); tiles.push([x, y]); }
    B.locks.push({ id: o.id, tiles });
    B.fill(x, 0, x, y1 - h, T.HARD);
    B.spawn('frHatch', x, y1, { id: o.id, h, icon: o.icon });
    return x;
  }
  ,
  /* a secret door whose whole look is the country skin: the wall section (3 x 4 tiles) is drawn by the draft's skin
     (an advertising column, a farmhouse wall, a mirror, a painted cave wall) instead of the theme's tiles */
  skinDoor(st, o) {
    const x = st.x, nx = Tour.pieces.secretDoor(st, o);
    for (let yy = st.gy - 4; yy < st.gy; yy++) for (let xx = x + 3; xx <= x + 5; xx++) st.B.setHide(xx, yy, 1);
    return nx;
  },
  /* ---- 7-2 Provence ---- */
  // rolling lavender rows on little rises, a beehive among them: { n, snail }
  lavenderRows(st, o) {
    const B = st.B, n = o.n || 3; let x = st.x;
    for (let k = 0; k < n; k++) {
      st.gy = clamp(st.gy + (k % 2 ? 1 : -1), st.gyMin, st.gyMax);
      st.floor(x, x + 6);
      for (let q = 0; q < 3; q++) B.decorAt('frLavenderBush', x + 1 + q * 2, st.gy, k * 3 + q);
      if (k === 1) B.decorAt('frHive', x + 5, st.gy, k);
      st.coins(x + 1, x + 5, st.gy - 3);
      if (o.snail && k === n - 1) st.enemy('frSnail', x + 4, st.gy);
      x += 7;
      if (k < n - 1) { st.pit(x, x + 1); x += 2; }
    }
    return x;
  },
  // sunflowers taller than Brady: their heads are springy (bounce surfaces), each higher than the last: { n, gold }
  sunflowers(st, o) {
    const B = st.B, x = st.x, n = o.n || 4;
    st.floor(x, x + n * 4 + 3);
    let top = st.gy;
    for (let k = 0; k < n; k++) {
      const hx = x + 2 + k * 4, hy = st.gy - 3 - Math.min(k, 2) * 2 - (k % 2);
      for (let q = 0; q < 2; q++) { B.set(hx + q, hy, T.SEMI); B.setSurf(hx + q, hy, SURF.BOUNCE); B.setHide(hx + q, hy, 1); }
      B.prop('frSunflower', hx, hy, 2, st.gy - hy, 'none', { seed: k });
      st.coins(hx, hx + 1, hy - 6); top = Math.min(top, hy);
    }
    if (o.gold) st.gold(x + 3 + (n - 1) * 4, Math.max(2, top - 4), o.gold);
    return x + n * 4 + 4;
  },
  // the farmyard: a rooster on a fence post watching the path, wild boars asleep in the straw: { boars }
  farmyard(st, o) {
    const B = st.B, x = st.x, n = o.boars || 2, w = 10 + n * 6;
    st.floor(x, x + w);
    B.fill(x + 2, st.gy - 1, x + 3, st.gy - 1, T.HARD); B.decorAt('frFence', x + 3, st.gy - 1, 0);
    st.enemy('frCoq', x + 3, st.gy - 1, { dir: 1 });
    for (let k = 0; k < n; k++) { st.enemy('frBoar', x + 9 + k * 6, st.gy, { dir: -1 }); B.decorAt('frStraw', x + 9 + k * 6, st.gy, k); }
    B.decorAt('frFence', x + w - 1, st.gy, 1);
    st.coins(x + 6, x + w - 2, st.gy - 5);
    return x + w + 1;
  },
  // the lavender distillery: copper stills, steam vents that lift Brady to the still-house roof: { gold }
  distillery(st, o) {
    const B = st.B, x = st.x;
    st.floor(x, x + 22);
    B.prop('frStill', x + 2, st.gy - 3, 2, 3, 'top', {});
    Tour.pieces.updraft(Object.assign(st, { x: x + 6 }), { w: 2, h: 8, look: 'steam' });
    B.prop('frStillHouse', x + 11, st.gy - 7, 9, 7, 'body', {});
    st.coins(x + 12, x + 18, st.gy - 9);
    if (o.gold) st.gold(x + 16, st.gy - 10, o.gold);
    B.decorAt('frStill', x + 21, st.gy, 0);
    st.x = x;
    return x + 23;
  },
  /* ---- 7-3 the bay ---- */
  // a shallow tide pool dug into the flats (dry at low tide): { w, d, oyster, gold }
  pool(st, o) {
    const B = st.B, x = st.x, w = o.w || 5, d = o.d || 2;
    st.floor(x, x + w + 3);
    B.fill(x + 2, st.gy, x + 1 + w, st.gy + d - 1, T.EMPTY);
    if (o.oyster) st.enemy('frOyster', x + 2 + Math.floor(w / 2), st.gy + d - 1 + 1, { phase: o.phase || 0 });
    st.coins(x + 2, x + 1 + w, st.gy + d - 2);
    if (o.gold) st.gold(x + 2 + Math.floor(w / 2), st.gy + d - 2, o.gold);
    return x + w + 4;
  },
  // a sea wall: too tall to jump at low tide (swim over it at high tide); a ledge and coins at the top: { h }
  seawall(st, o) {
    const B = st.B, x = st.x, h = o.h || 6;
    st.floor(x, x + 6);
    B.fill(x + 3, st.gy - h, x + 4, st.gy - 1, T.HARD);
    B.decorAt('frWeed', x + 3, st.gy, 0);
    st.coins(x + 3, x + 4, st.gy - h - 2);
    return x + 7;
  },
  // quicksand: sticky sand that slows Brady to a crawl: { n }
  quicksand(st, o) { return Tour.pieces.honey(st, { n: o.n || 6, look: 'frQuicksand' }); },
  // a tethered balloon on a sandbar: ride its basket up to a cloud ledge with a door: { to, back, rise }
  tetherBalloon(st, o) {
    const B = st.B, x = st.x, rise = o.rise || 8;
    const nx = Tour.pieces.balloon(st, { rise, drift: 2, skin: 'frTetherBalloon' });
    const ly = st.gy - 1 - rise;
    st.floor(x + 5, nx);
    for (let q = nx - 1; q <= nx + 4; q++) { B.set(q, ly, T.SEMI); }
    B.decorAt('frStreamer', nx + 1, ly, 0);
    const s = B.spawn('portal', nx + 3, ly - 1, { kind: 'door', look: o.look || 'frCloudDoor', targetRef: o.to || null });
    if (o.back) B.anchor(o.back, nx + 6, st.gy - 1);
    st.floor(nx, nx + 7);
    return nx + 8;
  },
  /* ---- 7-4 Périgord (dig) ---- */
  // the truffle pig friend on the surface: it sniffs and points down at the next dig spot
  trufflePig(st, o) {
    const B = st.B, x = st.x;
    B.spawn('frTrufflePig', x + 2, st.gy - 1, { spots: o.spots || [] });
    B.spawn('sign', x + 6, st.gy - 1, { text: 'THE PIG SNIFFS OUT TRUFFLES. HOLD DOWN + JUMP WHERE IT POINTS TO DIG' });
    return x + 8;
  },
  // a hollow oak on the surface: climb in through its knothole for a postcard: { gold }
  oak(st, o) {
    const B = st.B, x = st.x, top = st.gy;
    B.prop('frOak', x, top - 9, 4, 9, 'none', {});
    for (let yy = top - 7; yy < top; yy++) for (let xx = x; xx <= x + 3; xx++) { B.set(xx, yy, T.HARD); B.setHide(xx, yy, 1); }
    B.fill(x + 1, top - 6, x + 2, top - 3, T.EMPTY);
    B.fill(x, top - 5, x, top - 3, T.EMPTY);
    for (let q = x - 1; q <= x + 4; q++) B.set(q, top - 8, T.SEMI);
    if (o.gold) st.gold(x + 1, top - 4, o.gold);
    return x + 5;
  },
  // an underground river cave at depth: water to swim, a ledge on each side; postcard under the water: { w, gold }
  river(st, o) {
    if (st.mode !== 'dig') return st.x;
    const B = st.B, x = st.x, w = o.w || 14, y0 = Math.min(B.H - 9, st.y + (o.dy || 2)), y1 = y0 + 5;
    st.cavern(x, y0, x + w - 1, y1);
    for (let yy = y0 + 3; yy <= y1; yy++) for (let xx = x + 3; xx <= x + w - 4; xx++) B.set(xx, yy, T.WATER);
    for (let xx = x + 3; xx <= x + w - 4; xx++) B.set(xx, y1 + 1, T.HARD);
    st.coins(x + 3, x + w - 4, y0 + 1);
    if (o.gold) st.gold(x + Math.floor(w / 2), y1, o.gold);
    st.y = y1; return x + w + 2;
  },
  // a cave-in: a ceiling of crumbling rock over a cavern
  caveIn(st, o) {
    if (st.mode !== 'dig') return st.x;
    const B = st.B, x = st.x, w = o.w || 8, y = Math.min(B.H - 6, st.y + (o.dy || 3));
    st.cavern(x, y, x + w - 1, y + 3);
    for (let xx = x + 1; xx < x + w - 1; xx++) B.set(xx, y, T.CRUMBLE);
    st.coins(x + 1, x + w - 2, y + 2);
    if (o.enemy) st.enemy(o.enemy, x + Math.floor(w / 2), y + 4);
    st.y = y + 3; return x + w + 2;
  },
  // the painted cave: a wall of prehistoric-style animal paintings; one painted doorway is real (a secret door)
  paintedCave(st, o) {
    if (st.mode !== 'dig') return st.x;
    const B = st.B, x = st.x, y1 = Math.min(B.H - 4, st.y + (o.dy || 3)), y0 = y1 - 5;
    st.cavern(x, y0, x + 13, y1);
    B.decorAt('frCavePaintings', x + 4, y1 + 1, 0);
    const save = { x: st.x, gy: st.gy, floor: st.floor };
    st.x = x + 5; st.gy = y1 + 1; st.floor = () => {};
    P.skinDoor(st, { to: o.to, look: 'painted', skin: 'frPaintedHorse', back: o.back });
    st.x = save.x; st.gy = save.gy; st.floor = save.floor;
    st.y = y1; return x + 15;
  },
  /* ---- 7-5 the château ---- */
  // a chandelier to swing on over the hall's pit: { len, gold }
  chandelierSwing(st, o) {
    const x0 = st.x, nx = Tour.pieces.ring(st, { len: o.len || 3, w: 8, skin: 'frChandelierRing' });
    if (o.gold) st.gold(x0 + 6, st.gy - 5, o.gold);
    return nx;
  },
  /* ---- 7-7 the sky ---- */
  // a balloon to ride up to the next, higher island: { rise, drift, skin }
  balloonHop(st, o) {
    const rise = o.rise || 6, nx = Tour.pieces.balloon(st, { rise, drift: o.drift || 3, skin: o.skin || null });
    st.gy = clamp(st.gy - rise + 1, st.gyMin, st.gyMax);
    st.floor(nx, nx + 4);
    st.coins(nx + 1, nx + 3, st.gy - 2);
    return nx + 5;
  },
  // a trade wind blowing east across a wide gap (a gust zone), streamers on the far bank: { w }
  tradeWind(st, o) {
    const B = st.B, x = st.x, w = o.w || 14;
    st.floor(x, x + 2); st.pit(x + 3, x + w - 3);
    B.zone(x + 1, st.gy - 9, w - 2, 9, 3.4 * TS, 0, 0, 'gust');
    st.arc(x + 3, x + w - 3, st.gy - 3, 3);
    st.floor(x + w - 2, x + w + 1); B.decorAt('frStreamer', x + w, st.gy, 0);
    return x + w + 2;
  },
  // a burner: a hot-air jet from a balloon basket bolted to an island (an updraft that lifts): { h }
  burner(st, o) { return Tour.pieces.fan(st, { w: 2, h: o.h || 8, force: 34, skin: 'frBurner' }); },
  // an island with a basket hanging under a moored balloon: a door into it (the nacelle): { to, back }
  nacelle(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 7);
    B.decorAt('frMooredBalloon', x + 4, st.gy - 1, 0);
    const s = B.spawn('portal', x + 4, st.gy - 1, { kind: 'door', look: 'frBasketDoor', targetRef: o.to || null });
    if (o.back) B.anchor(o.back, x + 7, st.gy - 1);
    return x + 8;
  }
};

/* ---------------- country looks for library objects ---------------- */
const skins = {
  // the advertising column whose torn poster hides a doorway (7-1's fake wall): drawn over the wall section
  frTornPoster(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, w = 70;
    ctx.save();
    ctx.fillStyle = '#1e4a32'; rr(ctx, x - w / 2 - 4, y - 112, w + 8, 10, 4); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y - 116, w / 2 + 2, 7, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 122, w / 4, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#2a5a3a'; ctx.fillRect(x - w / 2, y - 104, w, 104);
    const cols = ['#f2e8d0', '#ffd86a', '#ff9ab8', '#8ad0ff'];
    for (let k = 0; k < 4; k++) { ctx.fillStyle = cols[k]; ctx.fillRect(x - w / 2 + 4 + (k % 2) * 32, y - 98 + Math.floor(k / 2) * 40, 30, 36); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - w / 2 + 8 + (k % 2) * 32, y - 92 + Math.floor(k / 2) * 40, 18, 3); ctx.fillRect(x - w / 2 + 8 + (k % 2) * 32, y - 86 + Math.floor(k / 2) * 40, 22, 2); }
    // the torn poster at the bottom: a flap curling away, darkness behind it
    ctx.fillStyle = '#120c18'; rr(ctx, x - 12, y - 44, 26, 44, 8); ctx.fill();
    const flap = 0.25 + Math.sin(t * 3) * 0.08;
    ctx.save(); ctx.translate(x + 14, y - 44); ctx.rotate(flap);
    ctx.fillStyle = '#c8a8ff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-24, 2); ctx.lineTo(-20, 22); ctx.lineTo(-26, 30); ctx.lineTo(-8, 34); ctx.lineTo(0, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-18, 6, 12, 3); ctx.restore();
    ctx.fillStyle = '#1e4a32'; ctx.fillRect(x - w / 2 - 3, y - 8, w + 6, 8);
    ctx.restore();
  },
  // shop doors in the plaza (door looks get { x, y, w: 30, h: 50, cx, near })
  frBakeryDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#3a5a8a'; ctx.fillRect(x - 46, y - 92, 92, 92);
    ctx.fillStyle = '#f2d890'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('BOULANGERIE', x, y - 80);
    ctx.fillStyle = '#ffd890'; ctx.fillRect(x - 42, y - 72, 22, 40); ctx.fillRect(x + 20, y - 72, 22, 40);
    ctx.fillStyle = '#c87a3a'; for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(x - 37 + k * 6, y - 40); ctx.rotate(-0.3 + k * 0.2); ctx.beginPath(); ctx.ellipse(0, 0, 2.5, 11, 0, 0, TAU); ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.arc(x + 25 + k * 6, y - 40, 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#5a3a22'; rr(ctx, x - 15, y - 54, 30, 54, 6); ctx.fill(); ctx.fillStyle = '#ffd890'; rr(ctx, x - 11, y - 50, 22, 22, 4); ctx.fill();
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff4e8' : '#c8283a'; ctx.beginPath(); ctx.moveTo(x - 48 + k * 16, y - 70); ctx.lineTo(x - 32 + k * 16, y - 70); ctx.lineTo(x - 30 + k * 16, y - 62); ctx.lineTo(x - 46 + k * 16, y - 62); ctx.fill(); }
  },
  frRoofDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - 22, y - 70, 44, 70); ctx.fillStyle = '#7a8aa0'; ctx.beginPath(); ctx.moveTo(x - 26, y - 70); ctx.lineTo(x - 18, y - 84); ctx.lineTo(x + 18, y - 84); ctx.lineTo(x + 26, y - 70); ctx.fill();
    ctx.fillStyle = '#2a4a6a'; rr(ctx, x - 14, y - 56, 28, 56, 12); ctx.fill(); ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 44, 9, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - 53); ctx.lineTo(x, y - 35); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 9, y - 24, 2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a3a48'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('TOITS ▲', x, y - 62);
  },
  frCafeDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#7a2a2a'; ctx.fillRect(x - 40, y - 74, 80, 74);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff4e8' : '#2a8a5a'; ctx.beginPath(); ctx.moveTo(x - 44 + k * 14.6, y - 78); ctx.lineTo(x - 30 + k * 14.6, y - 78); ctx.lineTo(x - 28 + k * 14.6, y - 66); ctx.lineTo(x - 42 + k * 14.6, y - 66); ctx.fill(); }
    ctx.fillStyle = '#f2d890'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('CRÊPERIE', x, y - 82);
    ctx.fillStyle = '#ffe8b0'; ctx.fillRect(x - 36, y - 60, 18, 30); ctx.fillRect(x + 18, y - 60, 18, 30);
    ctx.fillStyle = '#3a2016'; rr(ctx, x - 14, y - 54, 28, 54, 5); ctx.fill(); ctx.fillStyle = '#ffd890'; rr(ctx, x - 10, y - 50, 20, 26, 3); ctx.fill();
  },
  frShopDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#5a3a22'; rr(ctx, x - 15, y - 54, 30, 54, 6); ctx.fill(); ctx.fillStyle = '#ffd890'; rr(ctx, x - 11, y - 50, 22, 22, 4); ctx.fill();
    ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x + 8, y - 22, 2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('◀ PLACE', x, y - 58);
  },
  // the griddle in the crêperie (the pancake flipper): a round cast-iron plate on a stand, a crêpe on it
  frGriddle(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, k = e.flipT > 0 ? Math.sin((0.7 - e.flipT) / 0.7 * Math.PI) : 0;
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 4, y - 18, 8, 18); ctx.fillRect(x - 20, y - 4, 40, 4);
    ctx.fillStyle = '#2e2e38'; ctx.beginPath(); ctx.ellipse(x, y - 20, 30, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = e.warn ? '#ff8a4a' : '#4a4a58'; ctx.beginPath(); ctx.ellipse(x, y - 22, 26, 5, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x, y - 24 - k * 40); ctx.rotate(k * Math.PI * 2); ctx.fillStyle = '#f2cc7a'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8843a'; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.arc(-14 + q * 7, 0, 1.4, 0, TAU); ctx.fill(); } ctx.restore();
    if (e.warn) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let q = 0; q < 3; q++) { const ph = (t * 1.5 + q / 3) % 1; ctx.beginPath(); ctx.arc(x - 12 + q * 12, y - 30 - ph * 20, 3 + ph * 3, 0, TAU); ctx.fill(); } }
  },
  // a farmhouse wall (7-2): pale stone; a cracked patch where the cellar draught puffs out
  frMasWall(ctx, e, t) {
    const x = e.x, y = e.y - TS, w = e.w, h = e.h + TS;
    ctx.fillStyle = '#e8d8b8'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#d0c098'; for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { ctx.fillRect(x + 2 + k * 24 + (r % 2) * 12, y + 2 + r * 16, 20, 12); }
    ctx.fillStyle = '#c86a3a'; ctx.beginPath(); ctx.moveTo(x - 8, y + 2); ctx.lineTo(x + w / 2, y - 18); ctx.lineTo(x + w + 8, y + 2); ctx.fill();
    ctx.fillStyle = '#5a8ac8'; ctx.fillRect(x + w / 2 - 10, y + 10, 20, 16); ctx.fillStyle = '#3a5a8a'; ctx.fillRect(x + w / 2 - 1, y + 10, 2, 16);
    ctx.strokeStyle = 'rgba(60,40,30,0.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + w / 2 + 4, y + h - 64); ctx.lineTo(x + w / 2 - 2, y + h - 44); ctx.lineTo(x + w / 2 + 6, y + h - 26); ctx.lineTo(x + w / 2, y + h - 6); ctx.stroke();
  },
  frMasDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#6a4a2a'; rr(ctx, x - 14, y - 50, 28, 50, 4); ctx.fill(); ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 14 + k * 7, y - 50); ctx.lineTo(x - 14 + k * 7, y); ctx.stroke(); } ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▲', x, y - 54); },
  // quicksand (honey look): wet sand with slow bubbles and a sinking sheen
  frQuicksand(ctx, e, t) {
    const x = e.x, y = e.y + 4, w = e.w;
    ctx.fillStyle = 'rgba(160,130,80,0.9)'; ctx.beginPath(); ctx.moveTo(x, y + 6); for (let q = 0; q <= w; q += 8) ctx.lineTo(x + q, y - 2 - Math.sin(t * 1.4 + q * 0.2) * 1.2); ctx.lineTo(x + w, y + 6); ctx.fill();
    for (let q = 10; q < w; q += 26) { const ph = (t * 0.7 + q * 0.03) % 1; ctx.strokeStyle = `rgba(90,70,40,${0.6 * (1 - ph)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x + q, y, 3 + ph * 8, 1 + ph * 2, 0, 0, TAU); ctx.stroke(); }
  },
  // the balloon tethered on the sandbar (7-3): a striped envelope on a rope, streamers pointing up the shore
  frTetherBalloon(ctx, e, t) {
    const x = e.cx, y = e.y;
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.quadraticCurveTo(x - 30, y + 60, x - 40 - e.u * 30, y + 12 + e.u * 260); ctx.stroke();
    Ink.around(ctx, e.x - 24, y - 130, e.w + 48, 146, c => {
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 1.5; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 18, y); c.lineTo(x + s * 24, y - 60); c.stroke(); }
      for (let k = 0; k < 6; k++) { c.fillStyle = ['#c8283a', '#fff4e8', '#2a5ad8'][k % 3]; c.beginPath(); c.moveTo(x, y - 128); c.quadraticCurveTo(x - 46 + k * 15.3, y - 110, x - 26 + k * 10.5, y - 62); c.lineTo(x - 26 + (k + 1) * 10.5, y - 62); c.quadraticCurveTo(x - 46 + (k + 1) * 15.3, y - 110, x, y - 128); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(x - 14, y - 104, 6, 14, -0.3, 0, TAU); c.fill();
      c.fillStyle = '#a07a44'; rr(c, e.x + 6, y - 2, e.w - 12, 16, 4); c.fill();
    }, { pad: 10 });
  },
  frCloudDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = 'rgba(255,255,255,0.92)'; for (const [dx, dy, r] of [[-14, -20, 14], [10, -24, 16], [0, -40, 16], [-4, -8, 14], [14, -8, 12]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill(); } ctx.fillStyle = '#2a4a6a'; rr(ctx, x - 10, y - 40, 20, 40, 10); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); TourKit.star(ctx, x, y - 26, 5, 2, 5); ctx.fill(); },
  frBoatDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12);
    ctx.fillStyle = '#2a4a7a'; ctx.beginPath(); ctx.moveTo(-60, -40); ctx.lineTo(60, -44); ctx.lineTo(48, 0); ctx.lineTo(-50, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(-58, -40, 116, 6); ctx.fillStyle = '#c8283a'; ctx.fillRect(-54, -24, 104, 4);
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -42); ctx.lineTo(14, -110); ctx.stroke();
    ctx.fillStyle = '#1a1a24'; rr(ctx, -12, -36, 24, 34, 10); ctx.fill();
    ctx.restore();
  },
  frCausewayGate(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#8a7a60'; ctx.fillRect(x - 24, y - 64, 8, 64); ctx.fillRect(x + 16, y - 64, 8, 64); ctx.fillRect(x - 26, y - 70, 52, 8); ctx.fillStyle = '#3a3040'; rr(ctx, x - 14, y - 56, 28, 56, 10); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('CAUSEWAY ▶', x, y - 74); },
  // the cave painting doorway (7-4): a painted horse whose body is a real doorway (the fake-wall draught shows it)
  frPaintedHorse(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#7a6a58'; ctx.fillRect(e.x, y - 4 * TS, e.w, 4 * TS); ctx.fillStyle = 'rgba(255,240,210,0.12)'; for (let k = 0; k < 6; k++) ctx.fillRect(e.x + 6 + (k % 3) * 30, y - 4 * TS + 10 + Math.floor(k / 3) * 50, 22, 3);
    ctx.save(); ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#a8442a'; ctx.beginPath(); ctx.ellipse(x, y - 52, 30, 16, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 24, y - 60); ctx.quadraticCurveTo(x + 40, y - 80, x + 50, y - 74); ctx.lineTo(x + 46, y - 64); ctx.quadraticCurveTo(x + 36, y - 66, x + 28, y - 50); ctx.fill();
    ctx.strokeStyle = '#3a2016'; ctx.lineWidth = 3; for (const lx of [-20, -10, 12, 22]) { ctx.beginPath(); ctx.moveTo(x + lx, y - 42); ctx.lineTo(x + lx + (lx % 2 ? 4 : -2), y - 20); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - 28, y - 56); ctx.quadraticCurveTo(x - 44, y - 50, x - 40, y - 30); ctx.stroke();
    ctx.fillStyle = 'rgba(30,16,10,0.55)'; rr(ctx, x - 12, y - 48, 24, 48, 10); ctx.fill();
    ctx.restore();
  },
  // the chandelier to swing on (7-5, a ring look)
  frChandelierRing(ctx, e, t) {
    ctx.save(); ctx.strokeStyle = '#c8962a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.ax, e.ay); ctx.lineTo(e.hx, e.hy - 12); ctx.stroke();
    Ink.around(ctx, e.hx - 26, e.hy - 16, 52, 40, c => {
      c.fillStyle = '#e8c870'; c.beginPath(); c.ellipse(e.hx, e.hy, 22, 7, 0, 0, TAU); c.fill();
      for (let k = -2; k <= 2; k++) { c.fillStyle = '#fff8e0'; c.fillRect(e.hx + k * 8 - 1.5, e.hy - 12, 3, 9); c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(e.hx + k * 8, e.hy - 13, 2, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(220,240,255,0.85)'; for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(e.hx + k * 4.6, e.hy + 6); c.lineTo(e.hx + k * 4.6 - 1.8, e.hy + 14); c.lineTo(e.hx + k * 4.6 + 1.8, e.hy + 14); c.fill(); }
    }, { pad: 6 });
    ctx.restore();
  },
  // a mirror in the gallery that shows another room (7-5's way into the boudoir: a painted-door look)
  frMirrorShow(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#c8962a'; rr(ctx, x - 26, y - 98, 52, 98, 18); ctx.fill();
    const g = ctx.createLinearGradient(x, y - 94, x, y); g.addColorStop(0, '#f8d8e8'); g.addColorStop(1, '#c8a0c8'); ctx.fillStyle = g; rr(ctx, x - 21, y - 93, 42, 90, 14); ctx.fill();
    // the other room in the glass: a pink boudoir with a canopy bed
    ctx.fillStyle = '#e88ab0'; ctx.fillRect(x - 14, y - 40, 28, 12); ctx.fillStyle = '#fff0f8'; ctx.fillRect(x - 14, y - 46, 28, 6); ctx.fillStyle = '#a8507a'; ctx.beginPath(); ctx.moveTo(x - 16, y - 70); ctx.quadraticCurveTo(x, y - 82, x + 16, y - 70); ctx.lineTo(x + 16, y - 46); ctx.lineTo(x + 12, y - 46); ctx.lineTo(x + 12, y - 66); ctx.lineTo(x - 12, y - 66); ctx.lineTo(x - 12, y - 46); ctx.lineTo(x - 16, y - 46); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x - 16, y - 88, 4, 70);
  },
  frBallroomDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#c8962a'; rr(ctx, x - 22, y - 74, 44, 74, 20); ctx.fill(); ctx.fillStyle = '#fff4dc'; rr(ctx, x - 17, y - 68, 16, 68, 6); ctx.fill(); rr(ctx, x + 1, y - 68, 16, 68, 6); ctx.fill(); ctx.fillStyle = '#c8962a'; ctx.beginPath(); ctx.arc(x - 4, y - 34, 2, 0, TAU); ctx.arc(x + 4, y - 34, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('BALLROOM', x, y - 80); },
  // a balloon burner (7-7, a fan look): a brass burner on a stand; its flame roars while it pushes
  frBurner(ctx, e, t) {
    const x = e.x, y = e.y + e.h, w = e.w;
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x + w / 2 - 4, y - 14, 8, 14); ctx.fillStyle = '#c8962a'; rr(ctx, x + 4, y - 22, w - 8, 10, 3); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const fh = 16 + k * 10 + Math.sin(t * 20 + k) * 4; ctx.fillStyle = `rgba(255,${180 - k * 25},60,${0.55 - k * 0.08})`; ctx.beginPath(); ctx.ellipse(x + w / 2 + Math.sin(t * 15 + k) * 2, y - 22 - fh / 2, 7 - k * 0.6, fh / 2, 0, 0, TAU); ctx.fill(); } ctx.restore();
  },
  frBasketDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#a07a44'; rr(ctx, x - 20, y - 40, 40, 40, 6); ctx.fill(); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.2; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x - 18 + k * 7, y - 38); ctx.lineTo(x - 18 + k * 7, y - 2); ctx.stroke(); } ctx.fillStyle = '#3a2416'; rr(ctx, x - 9, y - 30, 18, 30, 6); ctx.fill(); },
  // the boudoir mirror back to the gallery
  frBoudoirMirror(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#c8962a'; rr(ctx, x - 18, y - 60, 36, 60, 14); ctx.fill(); ctx.fillStyle = '#d8e8ff'; rr(ctx, x - 14, y - 56, 28, 54, 11); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 10, y - 50, 3, 40); },
  frQuaiStairs(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#5a5048'; rr(ctx, x - 16, y - 56, 32, 56, 4); ctx.fill();
    for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#c8bca8' : '#b0a490'; ctx.fillRect(x - 12, y - 52 + k * 10, 24, 8); }
    ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▲', x, y - 60);
  }
};

/* ---------------- decor the stamps and pieces use ---------------- */
Object.assign(Decor, {
  frLavenderBush(ctx, x, y, t, th, d) { const sd = (d && d.seed) || 0; for (let k = 0; k < 7; k++) { const a = -1.2 + k * 0.4, sw = Math.sin(t * 1.5 + k + sd) * 1.5; ctx.strokeStyle = '#5a7a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(a) * 14 + sw, y - 16 - Math.cos(a) * 4); ctx.stroke(); ctx.fillStyle = k % 2 ? '#8a5ac8' : '#a87ae0'; ctx.beginPath(); ctx.ellipse(x + Math.sin(a) * 14 + sw, y - 19 - Math.cos(a) * 4, 2.4, 5, a * 0.5, 0, TAU); ctx.fill(); } ctx.fillStyle = '#4a6a2a'; ctx.beginPath(); ctx.ellipse(x, y - 2, 12, 4, 0, Math.PI, TAU); ctx.fill(); },
  frHive(ctx, x, y, t) { ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 12, y - 6, 24, 6); ctx.fillStyle = '#e8c870'; for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#d8b860' : '#e8c870'; rr(ctx, x - 10, y - 14 - k * 7, 20, 8, 2); ctx.fill(); } ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.moveTo(x - 13, y - 26); ctx.lineTo(x, y - 33); ctx.lineTo(x + 13, y - 26); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 3, y - 10, 6, 3); for (let k = 0; k < 3; k++) { const a = t * 3 + k * 2.1; ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 16, y - 20 + Math.sin(a * 1.3) * 8, 1.6, 0, TAU); ctx.fill(); } },
  frCypress(ctx, x, y) { ctx.fillStyle = '#2a5a2a'; ctx.beginPath(); ctx.ellipse(x, y - 34, 7, 34, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a6a32'; ctx.beginPath(); ctx.ellipse(x - 2, y - 40, 3, 22, 0, 0, TAU); ctx.fill(); },
  frSunflower(ctx, x, y, t, th, d) {
    const h = d.h, hx = x, hy = y - h + 4, sw = Math.sin(t * 1.2 + d.seed) * 2;
    ctx.strokeStyle = '#3a7a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4, y - h / 2, hx + sw, hy); ctx.stroke();
    ctx.fillStyle = '#4a9a3a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * 9, y - h * 0.4, 9, 4, s * 0.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffc828'; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; ctx.beginPath(); ctx.ellipse(hx + sw + Math.cos(a) * 17, hy + Math.sin(a) * 9, 7, 3.4, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#6a3a1a'; ctx.beginPath(); ctx.ellipse(hx + sw, hy, 13, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a5a2a'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(hx + sw - 8 + (k % 4) * 5, hy - 2 + Math.floor(k / 4) * 4, 1.2, 0, TAU); ctx.fill(); }
  },
  frFence(ctx, x, y) { ctx.fillStyle = '#8a6a44'; ctx.fillRect(x - 3, y - 26, 6, 26); ctx.fillRect(x - 18, y - 20, 36, 3); ctx.fillRect(x - 18, y - 11, 36, 3); },
  frStraw(ctx, x, y) { ctx.fillStyle = '#e8c870'; ctx.beginPath(); ctx.ellipse(x, y, 22, 5, 0, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(x - 18 + k * 4.5, y); ctx.lineTo(x - 20 + k * 4.5 + (k % 3), y - 6); ctx.stroke(); } },
  frStill(ctx, x, y, t, th, d) {
    const w = Math.min((d && d.w) || 1.6 * TS, 2.2 * TS), h = Math.min((d && d.h) || 1.8 * TS, 2.4 * TS);
    ctx.fillStyle = '#c87a3a'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.38, w * 0.42, h * 0.38, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e89a5a'; ctx.beginPath(); ctx.ellipse(x - w * 0.12, y - h * 0.5, w * 0.12, h * 0.16, -0.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a85a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - h * 0.76); ctx.quadraticCurveTo(x + w * 0.3, y - h * 1.0, x + w * 0.55, y - h * 0.6); ctx.stroke();
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - w * 0.4, y - 6, w * 0.8, 6);
    for (let k = 0; k < 2; k++) { const ph = (t * 0.6 + k / 2) % 1; ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + w * 0.55 + ph * 10, y - h * 0.62 - ph * 30, 4 + ph * 6, 0, TAU); ctx.fill(); }
  },
  frStillHouse(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2;
    ctx.fillStyle = '#e8d8b8'; ctx.fillRect(x0, y - h, w, h);
    ctx.fillStyle = '#d0c098'; for (let r = 0; r < 6; r++) for (let k = 0; k < 7; k++) ctx.fillRect(x0 + 3 + k * 40 + (r % 2) * 20, y - h + 6 + r * 34, 34, 26);
    ctx.fillStyle = '#c86a3a'; ctx.fillRect(x0 - 6, y - h - 4, w + 12, 10);
    ctx.fillStyle = '#5a8ac8'; for (let k = 0; k < 3; k++) { ctx.fillRect(x0 + 30 + k * 90, y - h + 40, 26, 34); ctx.fillStyle = '#3a5a8a'; ctx.fillRect(x0 + 42 + k * 90, y - h + 40, 2, 34); ctx.fillStyle = '#5a8ac8'; }
    ctx.fillStyle = '#6a4a2a'; rr(ctx, x - 22, y - 70, 44, 70, 6); ctx.fill();
    ctx.fillStyle = '#8a5ac8'; ctx.font = `bold 11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('DISTILLERIE', x, y - h + 26);
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x0 + w - 30, y - h - 40, 14, 40);
    for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3) % 1; ctx.fillStyle = `rgba(240,240,255,${0.45 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x0 + w - 23 + ph * 14, y - h - 44 - ph * 50, 6 + ph * 10, 0, TAU); ctx.fill(); }
  },
  frWeed(ctx, x, y, t) { ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 6 + k * 4, y); ctx.quadraticCurveTo(x - 8 + k * 4 + Math.sin(t + k) * 3, y - 14, x - 4 + k * 4, y - 24); ctx.stroke(); } },
  frShell(ctx, x, y) { ctx.fillStyle = '#f4d8c8'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x, y - 12, x + 6, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#d8a890'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + k * 2.6, y); ctx.stroke(); } },
  // 7-3's beach life (ink line, flat toon colours): a rock pool with a starfish and weed, a striped mooring buoy
  // lying on the sand, a child's bucket and spade
  frTidePool(ctx, x, y, t) {
    Ink.around(ctx, x - 26, y - 14, 52, 16, c => {
      c.fillStyle = '#a89878'; c.beginPath(); c.ellipse(x - 18, y - 3, 8, 6, -0.2, 0, TAU); c.ellipse(x + 19, y - 4, 7, 7, 0.3, 0, TAU); c.fill();
      c.fillStyle = '#6ab8d8'; c.beginPath(); c.ellipse(x, y - 1, 16, 4, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x - 9 + Math.sin(t * 2) * 2, y - 3, 8, 1.2);
      c.fillStyle = '#ff7a4a'; c.beginPath(); TourKit.star(c, x + 6, y - 2, 5, 2.2, 5); c.fill();
      c.strokeStyle = '#3a8a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 20, y - 6); c.quadraticCurveTo(x - 22 + Math.sin(t) * 2, y - 12, x - 18, y - 16); c.stroke();
    }, { pad: 4 });
  },
  frBuoy(ctx, x, y, t) {
    Ink.around(ctx, x - 14, y - 26, 30, 28, c => {
      c.save(); c.translate(x, y - 9); c.rotate(-0.35 + Math.sin(t * 0.8) * 0.03);
      c.fillStyle = '#e8423a'; rr(c, -9, -9, 18, 18, 8); c.fill();
      c.fillStyle = '#fff4e8'; c.fillRect(-9, -2.5, 18, 5);
      c.fillStyle = '#3a3a48'; c.fillRect(-2, -16, 4, 8); c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(0, -17, 2.5, 0, TAU); c.fill();
      c.restore();
      c.strokeStyle = '#8a7a62'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 6, y - 2); c.quadraticCurveTo(x + 12, y + 1, x + 15, y - 1); c.stroke();
    }, { pad: 4 });
  },
  frBucket(ctx, x, y) {
    Ink.around(ctx, x - 14, y - 22, 28, 24, c => {
      c.fillStyle = '#2a8ad8'; c.beginPath(); c.moveTo(x - 9, y - 14); c.lineTo(x + 7, y - 14); c.lineTo(x + 5, y); c.lineTo(x - 7, y); c.closePath(); c.fill();
      c.fillStyle = '#7ac8ff'; c.fillRect(x - 9, y - 14, 16, 2.5);
      c.strokeStyle = '#ffd23a'; c.lineWidth = 1.6; c.beginPath(); c.arc(x - 1, y - 14, 7, Math.PI, TAU); c.stroke();
      c.fillStyle = '#ffd23a'; c.save(); c.translate(x + 10, y - 2); c.rotate(0.5); c.fillRect(-1, -16, 2, 12); rr(c, -3.5, -5, 7, 7, 2); c.fill(); c.restore();
    }, { pad: 4 });
  },
  frPost(ctx, x, y) { ctx.fillStyle = '#6a5040'; rr(ctx, x - 4, y - 30, 8, 30, 3); ctx.fill(); ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - 4, y - 12, 8, 3); ctx.fillStyle = '#3a6a3a'; ctx.fillRect(x - 4, y - 4, 8, 4); },
  frStreamer(ctx, x, y, t) { ctx.fillStyle = '#8a6a44'; ctx.fillRect(x - 1, y - 40, 2, 40); for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#c8283a', '#fff4e8', '#2a5ad8'][k]; ctx.beginPath(); ctx.moveTo(x, y - 40 + k * 5); ctx.quadraticCurveTo(x + 14, y - 42 + k * 5 + Math.sin(t * 6 + k) * 3, x + 28, y - 38 + k * 5 + Math.sin(t * 6 + k + 1) * 4); ctx.lineTo(x, y - 36 + k * 5); ctx.fill(); } },
  frWalnut(ctx, x, y, t) { ctx.fillStyle = '#5a4030'; ctx.fillRect(x - 3, y - 30, 6, 30); ctx.fillStyle = '#5a8a3a'; ctx.beginPath(); ctx.arc(x, y - 40, 16, 0, TAU); ctx.arc(x - 12, y - 32, 10, 0, TAU); ctx.arc(x + 12, y - 32, 10, 0, TAU); ctx.fill(); },
  frMushroomRing(ctx, x, y) { for (let k = 0; k < 4; k++) { const mx = x - 12 + k * 8; ctx.fillStyle = '#f4ecd8'; ctx.fillRect(mx - 1, y - 5, 2.4, 5); ctx.fillStyle = k % 2 ? '#c87a4a' : '#a85a3a'; ctx.beginPath(); ctx.ellipse(mx, y - 5, 4, 2.6, 0, Math.PI, TAU); ctx.fill(); } },
  frOak(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2;
    ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.moveTo(x0 + 4, y); ctx.quadraticCurveTo(x0 + 10, y - h * 0.5, x0 + 14, y - h * 0.75); ctx.lineTo(x0 + w - 14, y - h * 0.75); ctx.quadraticCurveTo(x0 + w - 10, y - h * 0.5, x0 + w - 4, y); ctx.fill();
    ctx.fillStyle = '#4a3020'; for (let k = 0; k < 4; k++) ctx.fillRect(x0 + 18 + k * 22, y - h * 0.7, 3, h * 0.6);
    ctx.fillStyle = '#1a1010'; rr(ctx, x0 + 24, y - 5.5 * TS, 2 * TS + 8, 3 * TS, 20); ctx.fill(); rr(ctx, x0, y - 4.6 * TS, 26, 2 * TS - 4, 10); ctx.fill();
    ctx.fillStyle = '#4a7a3a'; for (const [dx, dy, r] of [[0, -h * 0.82, 60], [-44, -h * 0.72, 40], [44, -h * 0.72, 40], [-20, -h - 10, 40], [24, -h - 6, 36]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#5a8a42'; ctx.beginPath(); ctx.arc(x - 18, y - h * 0.9, 18, 0, TAU); ctx.fill();
  },
  frCavePaintings(ctx, x, y) {
    ctx.save(); ctx.globalAlpha = 0.75;
    const beast = (bx, by, col, s) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, by, 18 * s, 9 * s, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(bx + 16 * s, by - 6 * s, 6 * s, 5 * s, 0.4, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2.5 * s; for (const lx of [-10, -4, 6, 12]) { ctx.beginPath(); ctx.moveTo(bx + lx * s, by + 6 * s); ctx.lineTo(bx + lx * s, by + 18 * s); ctx.stroke(); } };
    beast(x - 70, y - 90, '#a8442a', 1.1); beast(x + 80, y - 110, '#3a2016', 0.9); beast(x + 40, y - 60, '#c8803a', 0.7);
    ctx.fillStyle = '#a8442a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - 110 + k * 12, y - 140 + (k % 2) * 6, 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  frMooredBalloon(ctx, x, y, t) {
    const by = y - 150 + Math.sin(t * 1.3) * 4;
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.5; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 18, y - 44); ctx.lineTo(x + s * 26, by + 50); ctx.stroke(); }
    for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#ffd84a', '#3a6ad8', '#ff8aa8'][k % 3]; ctx.beginPath(); ctx.moveTo(x, by - 50); ctx.quadraticCurveTo(x - 56 + k * 18.6, by - 30, x - 30 + k * 10, by + 50); ctx.lineTo(x - 30 + (k + 1) * 10, by + 50); ctx.quadraticCurveTo(x - 56 + (k + 1) * 18.6, by - 30, x, by - 50); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x - 16, by - 20, 7, 18, -0.3, 0, TAU); ctx.fill();
  },
  frBarrel(ctx, x, y) { ctx.fillStyle = '#7a4a2a'; rr(ctx, x - 12, y - 30, 24, 30, 8); ctx.fill(); ctx.fillStyle = '#4a3a3a'; ctx.fillRect(x - 12, y - 24, 24, 3); ctx.fillRect(x - 12, y - 9, 24, 3); ctx.fillStyle = '#9a6a3a'; ctx.fillRect(x - 3, y - 30, 3, 30); },
  frCanopyBed(ctx, x, y) { ctx.fillStyle = '#a8507a'; ctx.fillRect(x - 40, y - 90, 6, 90); ctx.fillRect(x + 34, y - 90, 6, 90); ctx.beginPath(); ctx.moveTo(x - 44, y - 88); ctx.quadraticCurveTo(x, y - 110, x + 44, y - 88); ctx.fill(); ctx.fillStyle = '#ffd8e8'; ctx.fillRect(x - 36, y - 30, 72, 20); ctx.fillStyle = '#e88ab0'; ctx.fillRect(x - 36, y - 18, 72, 12); ctx.fillStyle = '#ffffff'; rr(ctx, x - 32, y - 38, 20, 10, 4); ctx.fill(); },
  frBallGown(ctx, x, y) { ctx.fillStyle = '#c8a0e8'; ctx.beginPath(); ctx.moveTo(x - 4, y - 50); ctx.lineTo(x + 4, y - 50); ctx.lineTo(x + 18, y - 4); ctx.lineTo(x - 18, y - 4); ctx.fill(); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 1, y - 62, 2, 12); ctx.fillRect(x - 10, y - 4, 20, 4); },
  frPostOffice(ctx, x, y, t) {
    ctx.fillStyle = '#ffd84a'; rr(ctx, x - 36, y - 18, 72, 16, 4); ctx.fill(); ctx.fillStyle = '#2a4a8a'; ctx.font = `bold 10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('LA POSTE', x, y - 6);
  }
});

/* ---------------- stamps ---------------- */
const stamps = {
  // 7-1: the plaza. Three doors (bakery, rooftops, crêperie), the advertising column with the torn poster (a fake
  // wall to the quay), the post office's three hatches before the gate
  place: {
    floor: 19,
    rows: room(64, 22, 19, [
      [16, 11, 'o.o.o.o'],
      [15, 13, '--------'],
      [37, 11, 'o.o.o'],
      [36, 13, '-------'],
      [4, 14, 'o'], [6, 15, '?'],
      [8, 18, 'n'], [3, 18, '@'], [11, 18, 'D'], [13, 18, 'a'], [21, 18, 'K'], [31, 18, 'l'],
      [34, 18, 'D'], [36, 18, 'r'], [44, 18, 'D'], [46, 18, 'f'], [48, 18, 'l'],
      [52, 18, '1'], [54, 18, '2'], [56, 18, '3'], [54, 13, 'm'], [60, 18, 'G'],
      [27, 9, 'e']
    ], { open: true }),
    legend: {
      n: ['spawn', 'sign', { text: 'THREE DELIVERIES OPEN THE POST OFFICE: BREAD, A LETTER, A CRÊPE' }],
      a: ['anchor', 'bakeBack'], r: ['anchor', 'roofBack'], f: ['anchor', 'cafeBack'],
      K: ['piece', 'skinDoor', { to: 'quai@in', look: 'fake', skin: 'frTornPoster', back: 'quaiBack' }],
      l: ['decor', 'frLamp'], m: ['decor', 'frPostOffice'],
      e: ['enemy', 'frPigeon'],
      1: ['piece', 'hatch', { id: 'd1', icon: 'bread' }],
      2: ['piece', 'hatch', { id: 'd2', icon: 'letter' }],
      3: ['piece', 'hatch', { id: 'd3', icon: 'crepe' }]
    },
    items: ['sig'],
    doors: [{ to: 'boulangerie', look: 'frBakeryDoor' }, { to: 'toits', look: 'frRoofDoor' }, { to: 'cafe', look: 'frCafeDoor' }]
  },
  // 7-1 ③: the crêperie terrace: café umbrellas to bounce over, the griddle, crêpe pans on the counter
  cafe: {
    floor: 13,
    rows: room(44, 16, 13, [
      [6, 4, 'o.o.o'],
      [26, 3, 'o.o.o.o'],
      [5, 9, '-----'], [13, 6, '-----'],
      [24, 5, '-----------'],
      [2, 12, '@..t...t....j.......p.......t..u......'],
      [30, 9, 'HH'], [30, 10, 'HH'], [30, 11, 'HH'], [30, 12, 'HH'],
      [27, 4, 'q'], [33, 4, 'q'],
      [36, 12, 'x...D']
    ], { open: true }),
    legend: {
      t: ['decor', 'frCafe'], j: ['enemy', 'frPoele'], p: ['piece', 'pancake', { look: 'frGriddle' }], q: ['enemy', 'frPoele'],
      u: ['enemy', 'frPoodle'], x: ['piece', 'delivery', { id: 'd3', item: 'crepe' }]
    },
    doors: [{ to: 'place@cafeBack', look: 'frShopDoor' }]
  },
  // 7-2 (s): the farmhouse cellar (mas): wine barrels and lavender bundles drying from the beams
  mas: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [7, 5, 'o.o.o.o'], [8, 7, '-------'], [11, 5, '*'],
      [17, 10, 'k..k..k'], [23, 7, '?'], [26, 10, 'u']
    ]),
    legend: { k: ['decor', 'frBarrel'], u: ['decor', 'frLavenderBush'] },
    items: ['oneup'],
    doors: [{ to: 'lavande@masBack', look: 'frMasDoor' }],
    gold: { '*': 'hidden' }
  },
  // 7-3 (s): inside the beached boat: a tilted hold, a chest, coins in the bilge
  bateau: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [6, 9, '---'], [10, 7, '---'], [14, 5, '----'],
      [15, 3, '*'],
      [19, 10, 'o.o.o.o'], [24, 7, '?'], [27, 10, 'k']
    ]),
    legend: { k: ['decor', 'frBarrel'] },
    items: ['power'],
    doors: [{ to: 'baie@boatBack', look: 'frBoatDoor' }],
    gold: { '*': 'hidden' }
  },
  // 7-3 (s): the high sandbank in the clouds, where the balloon's rope ends: the secret gate
  banc: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [8, 6, 'o.o.o.o.o'],
      [12, 8, '-----'],
      [22, 10, 'g'], [18, 10, 'r'], [26, 10, 'r']
    ], { open: true }),
    legend: { r: ['decor', 'frStreamer'] },
    doors: [{ to: 'baie@balloonBack', look: 'frCloudDoor' }]
  },
  // 7-4 (s): the painted grotto: herds on the walls, a truffle cache, the way out to the antiques stall
  grotte: {
    floor: 11,
    rows: room(32, 14, 11, [
      [2, 10, '@.D'],
      [8, 10, 'p'],
      [6, 5, 'o.o.o.o'], [7, 7, '-------'],
      [10, 5, '*'],
      [20, 7, '?'],
      [27, 10, 'g']
    ]),
    legend: { p: ['decor', 'frCavePaintings'] },
    items: ['pick'],
    doors: [{ to: 'perigord@grotteBack', look: 'frShopDoor' }],
    gold: { '*': 'hidden' }
  },
  // 7-5 (s): the boudoir behind the mirror: a canopy bed, a ball gown on a stand, a hidden 1-up
  boudoir: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [8, 10, 'q'], [20, 10, 'w'],
      [12, 4, 'o.o.o'], [11, 6, '-------'], [14, 4, '*'],
      [24, 7, 'h']
    ]),
    legend: { q: ['decor', 'frCanopyBed'], w: ['decor', 'frBallGown'] },
    hidden: ['oneup'],
    doors: [{ to: 'galerie@boudoirBack', look: 'frBoudoirMirror' }],
    gold: { '*': 'hidden' }
  },
  // 7-6 (s): the bouquinistes' stockroom under a bridge
  seineQuai: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [8, 10, 'k....k....k'],
      [7, 4, 'o.o.o.o.o'], [9, 6, '-------'], [12, 4, '*'],
      [24, 7, '?']
    ]),
    legend: { k: ['decor', 'frBookbox'] },
    items: ['oneup'],
    doors: [{ to: 'seine@quaiBack', look: 'frQuaiStairs' }],
    gold: { '*': 'hidden' }
  },
  // 7-7 (s): inside the moored balloon's basket and up its rigging
  nacelle: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [6, 8, '---'], [11, 6, '---'], [16, 4, '---'],
      [17, 2, '*'],
      [6, 3, 'o.o.o'], [22, 7, '?']
    ], { open: true }),
    items: ['star'],
    doors: [{ to: 'ciel@nacelleBack', look: 'frBasketDoor' }],
    gold: { '*': 'hidden' }
  },
  // the Souvenir Stand La Brocante (a hedgehog's antiques stall)
  stand: {
    floor: 10,
    rows: room(28, 12, 10, [
      [2, 9, '@'], [5, 9, 'k'], [8, 9, 'l'], [11, 9, '$'], [21, 9, 'l'], [24, 9, 'G']
    ]),
    legend: { k: ['decor', 'frBarrel'], l: ['decor', 'frLamp'] }
  },
  // 7-1 (s): under the quay, the bouquinistes' steps down to the water; the far arch hides the secret gate
  quai: {
    floor: 11,
    rows: room(40, 14, 11, [
      [2, 10, '@.D'],
      [6, 4, 'o.o.o.o.o'],
      [12, 7, '------'],
      [14, 5, '*'],
      [22, 10, 'k.....k'],
      [32, 10, 'g']
    ]),
    legend: { k: ['decor', 'frBookbox'] },
    doors: [{ to: 'place@quaiBack', look: 'frQuaiStairs' }],
    gold: { '*': 'hidden' }
  }
};

/* ---------------- the levels ---------------- */
const levels = [
  // 7-1 HUB (errand): the plaza and its three rounds
  { n: 1, name: 'Paris Morning Rounds', arch: 'hub', theme: 'fr_place',
    gimmick: 'Three errands from the plaza: bread from the bakery, a letter over the rooftops, a crêpe from the café',
    hint: 'Each door leads to an errand. Bring all three deliveries back to the post office',
    postcard: 'Bonjour from Paris! Three errands before breakfast: the baker, the roofer and the crêpe café. ♥ C',
    enemies: [['frBaguette', 2], ['frCroissant', 2], ['frPoele', 1], ['frPigeon', 1], ['frCat', 1]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '7-2' }, secret: { to: '7-6', hint: 'Dust puffs out of a torn poster on the advertising column...' } },
    areas: [
      { id: 'place', gen: 'room', role: 'main', theme: 'fr_place', stamp: 'place' },
      { id: 'boulangerie', gen: 'strip', role: 'sub', theme: 'fr_morning', W: 74,
        enemies: [['frBaguette', 2], ['frCroissant', 1]],
        script: [
          'bakery',
          ['belt', { dir: 1, n: 7 }],
          ['postcard', { kind: 'must', dy: -5, dx: -4 }],
          'gap',
          'croissants',
          ['enemies', { kind: 'frBaguette', n: 1, len: 8 }],
          ['delivery', { id: 'd1', item: 'bread' }],
          ['door', { to: 'place@bakeBack', perch: 0, look: 'frShopDoor' }]
        ] },
      { id: 'toits', gen: 'strip', role: 'sub', theme: 'fr_toits', W: 86, H: 20,
        enemies: [['frCat', 1], ['frPigeon', 1]],
        script: [
          ['gearStand', { item: 'plane' }],
          ['roofs', { n: 2 }],
          ['chimney', {}],
          'clothesline',
          ['roofs', { n: 2, cat: true }],
          ['chimney', { gold: true }],
          ['delivery', { id: 'd2', item: 'letter' }],
          ['door', { to: 'place@roofBack', perch: 0, look: 'frShopDoor' }]
        ] },
      { id: 'cafe', gen: 'room', role: 'sub', theme: 'fr_place', stamp: 'cafe' },
      { id: 'quai', gen: 'room', role: 'secret', theme: 'fr_quai', stamp: 'quai' }
    ] },
  // 7-2 THIEF: the magpie and the stamps, across Provence
  { n: 2, name: 'Lavender Magpie', arch: 'thief', theme: 'fr_provence',
    gimmick: 'A magpie snatches the passport stamps: chase it through lavender rows, sunflowers and a sleepy farmyard',
    hint: 'Stomp the magpie when you catch up: three catches win the stamps back. Walk softly past sleeping boars',
    postcard: 'Provence smells like a giant bar of lavender soap. A magpie stole my passport stamps! ♥ C',
    enemies: [['frSnail', 2], ['frCoq', 1], ['frBoar', 2]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '7-3' } },
    areas: [
      { id: 'lavande', gen: 'strip', W: 210, H: 20,
        script: [
          ['itemBlock', { item: 'sig', y: 4 }],
          ['thief', { type: 'frMagpie' }],
          ['lavenderRows', { n: 3, snail: true }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['lavenderRows', { n: 2 }],
          ['thiefStop', { n: 1 }],
          'cp',
          ['sunflowers', { n: 4, gold: 'must' }],
          ['gearStand', { item: 'kazoo' }],
          ['farmyard', { boars: 2 }],
          ['skinDoor', { to: 'mas@in', look: 'fake', skin: 'frMasWall', back: 'masBack' }],
          ['thiefStop', { n: 2 }],
          'cp',
          ['enemies', { kind: 'frSnail', n: 2, len: 10 }],
          ['distillery', { gold: 'high' }],
          ['farmyard', { boars: 1 }],
          ['thiefStop', { n: 3, lock: true }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'mas', gen: 'room', role: 'secret', stamp: 'mas' }
    ] },
  // 7-3 TIDE: the bay of the abbey island (background only), the tide in and out, the bore at the end
  { n: 3, name: 'Mont-Saint-Michel Tides', arch: 'tide', theme: 'fr_baie',
    gimmick: 'The tide fills and empties the bay: walk the sand at low tide, swim over the sea walls at high tide, then outrun the tidal bore',
    hint: 'Wait for the tide: high water floats you over the sea walls. Quicksand slows you down',
    postcard: 'The tide here comes in as fast as a galloping horse. I watched from the causeway, dry feet. ♥ C',
    enemies: [['frCrab', 3], ['frGull', 2], ['frOyster', 2]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '7-4' }, secret: { to: '7-7', hint: 'A balloon tugs at its rope on a sandbar at low tide...' } },
    areas: [
      { id: 'baie', gen: 'strip', W: 210, H: 22, tide: { low: 20, high: 9, period: 16, hold: 4 },
        script: [
          ['itemBlock', { item: 'power', y: 4 }],
          ['pool', { w: 4 }],
          ['enemies', { kind: 'frCrab', n: 2, len: 10 }],
          ['quicksand', { n: 6 }],
          ['pool', { w: 5, oyster: true }],
          ['door', { to: 'bateau@in', perch: 0, look: 'frBoatDoor', back: 'boatBack' }],
          ['gearStand', { item: 'fins' }],
          'cp',
          ['seawall', { h: 6 }],
          ['pool', { w: 6, d: 3, oyster: true, phase: 0.9 }],
          ['itemBlock', { item: 'globe', y: 4 }],
          ['seawall', { h: 6 }],
          ['tetherBalloon', { to: 'banc@in', back: 'balloonBack', rise: 8 }],
          ['enemies', { kind: 'frCrab', n: 2, len: 10 }],
          ['quicksand', { n: 5 }],
          ['seawall', { h: 6 }],
          ['postcard', { kind: 'must', dy: -5 }],
          'cp',
          ['door', { to: 'chaussee', perch: 0, look: 'frCausewayGate' }]
        ] },
      { id: 'chaussee', gen: 'strip', role: 'sub', W: 84, chase: { speed: 3.0, ramp: 0.2, look: 'wave', lethal: false },
        enemies: [['frCrab', 2], ['frGull', 1]],
        script: [
          ['flat', { n: 6 }],
          'gap',
          ['enemies', { kind: 'frCrab', n: 1, len: 8 }],
          ['pool', { w: 4 }],
          ['postcard', { kind: 'risky', dy: -4 }],
          'gap',
          ['enemies', { kind: 'frGull', n: 1, len: 8 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'bateau', gen: 'room', role: 'secret', stamp: 'bateau' },
      { id: 'banc', gen: 'room', role: 'secret', theme: 'fr_baie', stamp: 'banc' }
    ] },
  // 7-4 DIG: Périgord truffles, under the oaks
  { n: 4, name: 'Truffle Hunt', arch: 'dig', theme: 'fr_perigord',
    gimmick: 'A truffle pig sniffs out where to dig: stomp down through the soil, dodge the moles, find the underground river',
    hint: 'Hold DOWN and press JUMP on soil to dig. The Hard Hat dashes sideways through it',
    postcard: 'A pig with a better nose than any chef found a truffle the size of my fist. ♥ C',
    enemies: [['frMole', 3], ['frBoar', 1], ['frSnail', 1]],
    mapCell: [2, 1], mapFrom: 2,
    exits: { main: { to: '7-5' }, secret: { to: 'house:fr-brocante', hint: 'Somewhere underground, a painted horse has a draught blowing through it...' } },
    areas: [
      { id: 'perigord', gen: 'dig', W: 140, H: 40, surface: 8,
        script: [
          ['gearStand', { item: 'hat' }],
          ['trufflePig', { spots: [28, 52, 84] }],
          ['oak', { gold: 'must' }],
          ['pocket', { item: 'power' }],
          ['cavern', { w: 10, h: 4, dy: 4 }],
          ['caveIn', { w: 9, enemy: 'frMole' }],
          ['rockBand', { w: 5 }],
          ['caveIn', { w: 10, dy: 2, enemy: 'frSnail' }],
          ['river', { w: 16, gold: 'risky' }],
          ['paintedCave', { to: 'grotte@in', back: 'grotteBack' }],
          ['pocket', { item: 'magnet' }],
          ['caveIn', { w: 10, enemy: 'frMole' }],
          ['caveIn', { w: 12, dy: 2, enemy: 'frBoar' }],
          'exit'
        ] },
      { id: 'grotte', gen: 'room', role: 'secret', stamp: 'grotte' }
    ] },
  // 7-5 LAIR: the château of mirrors and Le Grand Soufflé's ballroom
  { n: 5, name: 'Château des Glaces', arch: 'lair', theme: 'fr_chateau', boss: 'fr_souffle',
    gimmick: 'Mirror doors and falling chandeliers lead to the ballroom, where Le Grand Soufflé waits by the great oven',
    hint: 'In the ballroom: jump into each wall mirror from its balcony to aim it at the oven, then lure him into the light',
    postcard: 'The iron tower is back to full size! The Baron flew north, muttering about tulips. ♥ C',
    enemies: [['frAccordion', 2], ['frBaguette', 1], ['frPoele', 2]],
    mapCell: [1, 2], mapFrom: 3,
    exits: { main: { to: 'country:next' } },
    areas: [
      { id: 'galerie', gen: 'strip', W: 90, H: 18,
        script: [
          ['itemBlock', { item: 'power', y: 4 }],
          ['mirrors', {}],
          'chandeliers',
          ['enemies', { kind: 'frPoele', n: 1, len: 8 }],
          'gallery',
          ['postcard', { kind: 'must', dx: -8, dy: -8 }],
          'cp',
          ['skinDoor', { to: 'boudoir@in', look: 'painted', skin: 'frMirrorShow', back: 'boudoirBack' }],
          ['chandelierSwing', { gold: 'risky' }],
          ['chandeliers', { n: 3 }],
          ['enemies', { kind: 'frAccordion', n: 1, len: 8 }],
          ['door', { to: 'ballroom', perch: 0, look: 'frBallroomDoor' }]
        ] },
      { id: 'boudoir', gen: 'room', role: 'secret', stamp: 'boudoir' },
      { id: 'ballroom', gen: 'arena', role: 'arena', layout: 'ballroom', arenaW: 26, H: 18 }
    ] },
  // 7-6 SCROLL (secret): the Seine quays, the bouquinistes' boxes in time with the music
  { n: 6, name: 'Seine Chase', arch: 'scroll', secret: true, theme: 'fr_seine',
    gimmick: 'The quay scrolls on: book-box lids snap in time, barges drift through the gaps, pigeons swoop under the bridges',
    hint: 'The green book boxes snap shut on the beat: time your hops',
    postcard: 'Found a secret staircase to the river! The booksellers wave at everyone. ♥ C',
    enemies: [['frPigeon', 2], ['frBaguette', 1]],
    mapCell: [0, 1], mapFrom: 0,
    exits: { main: { to: null } },
    areas: [
      { id: 'seine', gen: 'strip', mode: 'auto', W: 229, scroll: 2.5, bpm: 100,
        script: [
          ['itemBlock', { item: 'power', y: 4 }],
          'bookboxes', 'bridge', 'barge',
          ['bookboxes', { n: 4 }],
          ['steps', { up: true }],
          ['bridge', { gold: true }],
          'cp',
          'barge',
          ['door', { to: 'seineQuai@in', perch: 0, look: 'frQuaiStairs', back: 'quaiBack' }],
          ['bookboxes', { n: 3 }],
          ['steps', {}],
          ['itemBlock', { item: 'lsd', y: 5 }],
          ['enemies', { n: 2, len: 10 }],
          'barge',
          ['bridge', { gold: true }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'seineQuai', gen: 'room', role: 'secret', theme: 'fr_quai', stamp: 'seineQuai' }
    ] },
  // 7-7 SKY (secret): balloons over France; one trade-wind balloon flies east (the secret flight to Vietnam)
  { n: 7, name: 'Montgolfière Skies', arch: 'sky', secret: true, theme: 'fr_ciel',
    gimmick: 'Hot-air balloons rise while you stand in the basket and sink when you leave; burners roar; a trade wind blows east',
    hint: 'Stand in a basket to rise. A burner\'s hot air lifts you too',
    postcard: 'Up in a balloon basket the whole country looks like a patchwork quilt. ♥ C',
    enemies: [['frPigeon', 2], ['frMacaron', 2]],
    mapCell: [0, 2], mapFrom: 2,
    exits: { main: { to: null }, secret: { to: 'flight:vn', hint: 'One balloon\'s streamers all point east, into the trade wind...' } },
    areas: [
      { id: 'ciel', gen: 'islands', W: 220, H: 30,
        script: [
          ['gearStand', { item: 'plane' }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['balloonHop', { rise: 5, drift: 3 }],
          ['enemies', { kind: 'frMacaron', n: 1, len: 8 }],
          ['burner', { h: 8 }],
          'gap',
          ['nacelle', { to: 'nacelle@in', back: 'nacelleBack' }],
          ['step', { h: -4 }],
          'cp',
          ['balloonHop', { rise: 6, drift: 4 }],
          ['balloonHop', { rise: 4, drift: 4 }],
          ['itemBlock', { item: 'lsd', y: 5 }],
          ['step', { h: -6 }],
          ['tetherBalloon', { to: 'alize@in', rise: 9, look: 'frCloudDoor' }],
          ['burner', { h: 9 }],
          ['postcard', { kind: 'risky', dy: -9, dx: -4 }],
          ['enemies', { kind: 'frMacaron', n: 1, len: 8 }],
          ['balloonHop', { rise: 5, drift: 3 }],
          ['postcard', { kind: 'must', dy: -4 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'nacelle', gen: 'room', role: 'secret', stamp: 'nacelle' },
      { id: 'alize', gen: 'islands', role: 'secret', W: 60, H: 24,
        script: [
          ['flat', { n: 5 }],
          ['tradeWind', { w: 14 }],
          ['enemies', { kind: 'frPigeon', n: 1, len: 6 }],
          ['tradeWind', { w: 12 }],
          ['gate', { exit: 'secret' }]
        ] }
    ] }
];

Tour.amend('fr', {
  stamps, skins,
  map: { fort: 'chateau', start: [0, 0] },
  houses: [{ id: 'fr-brocante', kind: 'stand', name: 'La Brocante', keeper: 'hedgehog', stock: ['plane', 'hat', 'magnet', 'globe', 'oneup', 'sundial'], mapCell: [2, 2], mapFrom: 3 }],
  levels
});
for (const k in P) Tour.pieces['fr.' + k] = P[k];
})();
