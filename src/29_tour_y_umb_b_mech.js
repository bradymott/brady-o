/* ============================================================
   THE UMBRELLA REPAIR DISTRICT: the repair work that plays (31-2 to 31-5, and the boss's lead-in). Each is the game's
   physics plus one new thing, and the level checker is told what a player can do with it (locks opened by a key spot
   Brady must reach, or one-way edges between real standing spots):
   31-2 DRIPS    a leak drips steadily from the eaves. Stand under it and each drop lands on Brady's head and stays
                 there (two small drops merge into one big one). Stamp (land from a jump) on the coral plate at the dry
                 end of a gutter: everything he carries runs along it into a leaky cistern; a full cistern floats its
                 sluice shutter up out of the way. The last cistern has a grate: only one BIG drop gets in, so let two
                 merge before stamping.
   31-3 HOOKS    closed umbrellas ride a wire past a fixed hook at the edge of a gap. Stand on the hook's mark and hold
                 THROW: it catches a passing handle, and the next nests in it, and the next, a chain growing over the
                 gap. Keep holding until the last handle nests in the ring on the far side (it lights up): let go any
                 time after that and the chain is rigid, a bridge. Let go early and it slips. On the last hook the
                 sister handle comes the same way round: it rides on, turns the corner at the far pulley and comes back
                 to nest (a longer hold).
   31-4 PANELS   a dented canopy panel overhead lets the rain through in a solid sheet across the way. Jump into it from
                 underneath and the dent pops out: the rain runs off the sides. The last three panels hang in a row
                 and popping one pops its left neighbour back in: start from the far end. All three out opens the
                 arcade's shutter.
   31-5 SHAKE    a puddled canopy laid flat as a floor, its far end a deep scallop. Walking along it herds the loose
                 water ahead of Brady's feet into the scallop (water left outside it rolls back to the dip). Stamp on
                 the dry end and the canopy flings the scallop's water up into the counterweight cup above: enough in
                 one go and the cup sinks, lifting the gate. The last cup is high: three puddles must leave together.
   31-6 RUNNER   (the lead-in) an inside-out umbrella jammed in a repair collar across the way. Stand at its runner,
                 hold THROW and walk back: the runner slides home along the shaft and the canopy snaps the right way
                 out and folds. The boss is beaten the same way.
   ============================================================ */
(function () {
const UK = Tour.umbKit, INK = UK.INK, UA = UK.UmbArt;
const onCheck = (flag, fn) => { const run0 = Validator.run; Validator.run = function (level, opts) { level.areas.forEach((a, ai) => { if (a[flag]) return; const r = fn.call(this, a, ai, level); if (r !== false) a[flag] = true; }); return run0.call(this, level, opts); }; };
const nearMark = (p, tx, fy, wide) => p && !p.dead && p.onGround && p.groundTy === fy && Math.abs(p.cx - (tx * TS + TS / 2)) < TS * (wide || 0.8);
// a lock spawn turned into a given entity type: returns the spawn
const lockAs = (B, x, y0, y1, id, type, props) => { B.lock(x, y0, y1, id, type); const s = B.spawns[B.spawns.length - 1]; s.type = type; Object.assign(s, props || {}); return s; };
const lockTiles = s => { const tx = Math.floor(s.x / TS), ty1 = Math.floor((s.y - 1) / TS), L = []; for (let k = 0; k < (s.h || 1); k++) L.push([tx, ty1 - k]); return L; };
// a gate made of locked tiles (rows y0..y1 at column x): opens when its id is in the keys
class UmbLockBase extends Ent {
  constructor(g, s, h) { super(g, s, TS, h * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.id = s.id; this.open = false; this.tiles = []; const tx = Math.floor(s.x / TS), ty1 = Math.floor((s.y - 1) / TS); for (let k = 0; k < h; k++) this.tiles.push([tx, ty1 - k]); this.tx = tx; this.ty1 = ty1; this.openT = 0; }
  release() { if (this.open) return; this.open = true; for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY); Sound.play('door', { vol: 0.6 }); }
  update(dt) { this.t += dt; if (this.open) this.openT = Math.min(1, this.openT + dt * 1.5); else if (UK.keys(this.g).has(this.id)) this.release(); }
  touchPlayer() {}
}

/* ======================= 31-2 DRIPS: the leak, the gutter, the cistern and its sluice ======================= */
// the water Brady carries: p.umbWater (units: 1 = a small drop, 2 = a big one)
const water = p => p.umbWater || 0;
TourHooks.on('areaLoaded', play => { if (play.player) play.player.umbWater = 0; });
// a leak in the eaves: { tx, top (the eave's row), floor (the row he stands on + 1) }; a drop every 0.9 s
class UmbDrip extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.top = s.top * TS; this.floorY = s.floor * TS; this.y = this.top; this.drops = []; this.ph = s.phase || 0; this.back = true; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (Math.floor((this.t + this.ph) / 0.9) !== Math.floor((this.t + this.ph - dt) / 0.9)) this.drops.push({ y: this.top + 8, v: 0 });
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i]; d.v += 14 * TS * dt; d.y += d.v * dt;
      // it lands on Brady's head (he carries it), or splashes on the floor
      if (p && !p.dead && Math.abs(p.cx - this.cx) < TS * 0.6 && d.y >= p.y && d.y < p.y + 20 && water(p) < 3) {
        this.drops.splice(i, 1); p.umbWater = water(p) + 1; TourKit.sfx('plip', 'select', { vol: 0.3, pitch: 1.6 + water(p) * 0.2 });
        if (water(p) === 2) UK.say(g, p.cx, p.y - 30, 'TWO MERGE: ONE BIG DROP!', UA.GOLD_L);
        continue;
      }
      if (d.y >= this.floorY) { this.drops.splice(i, 1); g.burst(this.cx, this.floorY - 2, 3, '#8ac8f4', 'spark'); }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    ctx.save();
    // a length of leaky eaves gutter on a bracket (the drip comes from its crack)
    ctx.fillStyle = '#7a8aa8'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.cx - 30, this.top - 8); ctx.lineTo(this.cx + 30, this.top - 8); ctx.lineTo(this.cx + 26, this.top + 4); ctx.lineTo(this.cx - 26, this.top + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a6a8a'; ctx.fillRect(this.cx - 34, this.top - 40, 6, 36); ctx.strokeRect(this.cx - 34, this.top - 40, 6, 36);
    // the crack in the eave and a beard of moss
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.cx - 8, this.top + 2); ctx.lineTo(this.cx - 2, this.top + 8); ctx.lineTo(this.cx + 3, this.top + 3); ctx.lineTo(this.cx + 9, this.top + 9); ctx.stroke();
    for (const d of this.drops) UA.drop(ctx, this.cx, d.y, 4);
    // the spot under it, a faint wet ring on the floor
    ctx.fillStyle = 'rgba(140,200,250,0.35)'; ctx.beginPath(); ctx.ellipse(this.cx, this.floorY - 1, 16, 4, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
// what Brady carries, drawn over his head (a small drop, a big drop, a big and a small)
TourHooks.on('afterEntities', (play, ctx) => {
  const p = play.player; if (!p || p.dead || !water(p)) return;
  const x = p.cx, y = p.y - 10, w = water(p), t = play.t;
  if (w >= 2) UA.drop(ctx, x, y - 4 + Math.sin(t * 5) * 1.5, 8.5, '#6ab4f0');
  if (w % 2 === 1) UA.drop(ctx, w >= 2 ? x + 14 : x, y + (w >= 2 ? 2 : 0) + Math.sin(t * 6) * 1.5, 4.5);
});
{ const hurt0 = Player.prototype.hurt; Player.prototype.hurt = function () { const r = hurt0.apply(this, arguments); if (this.umbWater) this.umbWater = 0; return r; }; }
// the gutter: the coral stamp plate at its dry end (padX, on the floor row fy), the cistern at the other end, the
// sluice shutter (a lock) beyond it. { id, need, big (only a 2-unit drop gets through the grate) }
class UmbGutter extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.back = true; this.padX = s.padX; this.cisX = s.cisX; this.fy = s.fy; this.id = s.id; this.need = s.need || 2; this.big = !!s.big;
    this.x = Math.min(s.padX, s.cisX) * TS; this.w = (Math.abs(s.cisX - s.padX) + 1) * TS; this.y = (s.fy - 1) * TS; this.lvl = 0; this.runs = []; this.full = false; this.wasG = true; this.lastVy = 0; this.msgT = 0;
  }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    const g = this.g, p = g.player;
    if (!this.full && UK.keys(g).has(this.id)) { this.full = true; this.lvl = this.need; }
    // a stamp: landing on the plate from a jump
    if (p && !p.dead) {
      const landed = p.onGround && !this.wasG && this.lastVy > 3 * TS && p.groundTy === this.fy && Math.abs(p.cx - (this.padX * TS + TS / 2)) < TS * 1.3;
      this.wasG = p.onGround; this.lastVy = p.vy;
      if (landed && !this.full) {
        const w = water(p);
        TourKit.sfx('clank', 'bump', { vol: 0.45, pitch: 1.2 }); g.shake(2);
        if (!w) { if (this.msgT <= 0) { this.msgT = 2; UK.say(g, p.cx, p.y - 30, 'NOTHING TO SEND! STAND UNDER THE DRIP FIRST', UA.CHALK); } }
        else { p.umbWater = 0; this.runs.push({ u: 0, w }); }
      }
    }
    for (let i = this.runs.length - 1; i >= 0; i--) {
      const r = this.runs[i]; r.u += dt * 1.4;
      if (r.u >= 1) {
        this.runs.splice(i, 1);
        if (this.big && r.w < 2) { if (this.msgT <= 0) { this.msgT = 2.2; } UK.say(g, this.cisX * TS + 16, this.y - 70, 'TOO SMALL: IT SLIPS THROUGH THE GRATE! (LET TWO MERGE)', UA.CHALK); TourKit.sfx('plip', 'select', { vol: 0.3, pitch: 0.7 }); continue; }
        this.lvl = Math.min(this.need, this.lvl + (this.big ? 1 : r.w)); TourKit.sfx('gloop', 'pick', { vol: 0.4, pitch: 0.8 + this.lvl * 0.15 });
        if (this.lvl >= this.need && !this.full) { this.full = true; UK.keys(g).add(this.id); UK.say(g, this.cisX * TS + 16, this.y - 70, 'FULL! EVERY DROP ACCOUNTED FOR', UA.GOLD_L); g.burst(this.cisX * TS + 16, this.y - 30, 14, '#8ac8f4', 'confetti'); }
        else if (!this.full) UK.say(g, this.cisX * TS + 16, this.y - 70, this.lvl + ' / ' + this.need, '#ffffff');
      }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t, p = this.g.player, fy = this.fy * TS, px = this.padX * TS + TS / 2, cx = this.cisX * TS + TS / 2, dir = Math.sign(cx - px) || 1;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the gutter: a half-pipe at shin height along the floor from the plate to the cistern
    const gy = fy - 16;
    ctx.fillStyle = '#8a98b0'; ctx.fillRect(Math.min(px, cx), gy, Math.abs(cx - px), 8); ctx.strokeRect(Math.min(px, cx), gy, Math.abs(cx - px), 8);
    ctx.fillStyle = '#5a6a8a'; for (let x = Math.min(px, cx) + 20; x < Math.max(px, cx) - 10; x += 48) ctx.fillRect(x, gy + 8, 4, 8);
    // the water running along it
    for (const r of this.runs) { const x = lerp(px, cx, r.u); UA.drop(ctx, x, gy - 2, r.w >= 2 ? 7 : 4, r.w >= 2 ? '#6ab4f0' : null); }
    // the coral plate (the dry end): it pulses while Brady carries water
    const can = p && water(p) > 0 && !this.full;
    UA.ring(ctx, px, fy, t, can, 18);
    ctx.fillStyle = UA.CORAL; rr(ctx, px - 14, fy - 6, 28, 6, 2); ctx.fill(); ctx.stroke();
    if (can && Math.abs(p.cx - px) < 3 * TS) { const k = 0.5 + 0.5 * Math.sin(t * 7); UA.pill(ctx, px, fy - 3.4 * TS, 'JUMP ON THE PLATE!', UA.GOLD_L, 0.7 + 0.3 * k); }
    // the cistern: a riveted tank on legs, a level window, a leak; a grate on top when only big drops get in
    const tx = cx - 22, ty = fy - 3 * TS, tw = 44, th = 2.4 * TS;
    ctx.fillStyle = UA.NAVY; ctx.fillRect(tx, ty, tw, th); ctx.strokeRect(tx, ty, tw, th);
    const k = clamp(this.lvl / this.need, 0, 1);
    ctx.fillStyle = '#8ac8f4'; ctx.fillRect(tx + 6, ty + th - 6 - (th - 12) * k, tw - 12, (th - 12) * k);
    ctx.strokeStyle = UA.CHALK; ctx.lineWidth = 1.2; for (let q = 1; q < this.need; q++) { const yy = ty + th - 6 - (th - 12) * q / this.need; ctx.beginPath(); ctx.moveTo(tx + 4, yy); ctx.lineTo(tx + 10, yy); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(tx + 6, ty + 6, tw - 12, th - 12);
    if (this.big) { ctx.strokeStyle = '#c0c8d8'; ctx.lineWidth = 2; for (let x = tx + 6; x < tx + tw - 4; x += 7) { ctx.beginPath(); ctx.moveTo(x, ty - 4); ctx.lineTo(x, ty + 2); ctx.stroke(); } ctx.strokeStyle = INK; ctx.strokeRect(tx + 2, ty - 5, tw - 4, 7); }
    ctx.fillStyle = UA.CORAL; for (const [dx, dy] of [[4, 4], [tw - 4, 4], [4, th - 4], [tw - 4, th - 4]]) { ctx.beginPath(); ctx.arc(tx + dx, ty + dy, 2.2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#5a6a8a'; ctx.fillRect(tx + 4, ty + th, 5, fy - ty - th); ctx.fillRect(tx + tw - 9, ty + th, 5, fy - ty - th);
    // the leak (it's a leaky cistern: a slow drip from its seam)
    if (!this.full && this.lvl > 0) { const d = (t * 0.8) % 1; UA.drop(ctx, tx + tw - 2, ty + th + d * (fy - ty - th - 4), 2.5); }
    ctx.restore();
  }
}
// the sluice shutter: a wooden float in a frame; it floats up when its cistern is full
class UmbSluice extends UmbLockBase {
  constructor(g, s) { super(g, s, s.h || 3); }
  draw(ctx) {
    const x = this.cx, top = this.y, h = this.h, rise = this.openT * (h + 10);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#5a6a8a'; ctx.fillRect(x - 18, top - 10, 5, h + 10); ctx.fillRect(x + 13, top - 10, 5, h + 10); ctx.fillRect(x - 18, top - 14, 36, 6);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 20, top - 200, 40, h + 200); ctx.clip();
    ctx.fillStyle = '#9a6a3a'; ctx.fillRect(x - 13, top - rise, 26, h); ctx.strokeRect(x - 13, top - rise, 26, h);
    ctx.fillStyle = '#7a4a22'; for (let y = top - rise + 10; y < top - rise + h; y += 16) ctx.fillRect(x - 13, y, 26, 3);
    ctx.restore();
    ctx.restore();
  }
}
Object.assign(ENTITY_TYPES, { umbDrip: UmbDrip, umbGutter: UmbGutter, umbSluice: UmbSluice });
Object.assign(Tour.pieces, {
  // a drip: the letter is the spot under it (the floor row is the letter's row + 1); { top (rows up to the eave) }
  'umb.drip'(st, o) { const B = st.B, x = st.x, y = st.gy - 1; B.spawn('umbDrip', x, y, { top: y - (o.top || 6), floor: y + 1, phase: o.phase || 0 }); return st.x; },
  // a gutter: the letter is the plate (on the floor row's standing spot); { len (columns to the cistern, + right),
  // need, big, gate (columns from the cistern to the sluice), h (the sluice's height), id }
  'umb.gutter'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1, len = o.len || 5, id = 'umb:' + (o.id || 'cis' + x), cisX = x + len, gx = cisX + (o.gate || 2), h = o.h || 4;
    B.spawn('umbGutter', x, y, { padX: x, cisX, fy: y + 1, id, need: o.need || 2, big: !!o.big });
    lockAs(B, gx, y - h + 1, y, id, 'umbSluice', { h });
    B.vkey(id, [[x, y]], 'any');
    return st.x;
  }
});

/* ======================= 31-3 HOOKS: a chain of handles across a gap ======================= */
// spawn { tx (the mark: the near edge's last floor tile), fy (that floor's row), span (tiles to the far bank), dir,
// corner (the sister turns the corner), wireY }
const HOOK = { arrive: 0.75, cornerT: 2.4, link: 2 };
class UmbHook extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.back = true; this.tx = s.tx; this.fy = s.fy; this.span = s.span; this.dir = s.dir || 1; this.corner = !!s.corner; this.wireY = (s.wireY || s.fy - 5) * TS;
    this.x = s.tx * TS; this.y = (s.fy - 1) * TS; this.n = 0; this.hold = false; this.rigid = false; this.ht = 0; this.slip = 0; this.msgT = 0; this.cells = [];
    for (let k = 1; k <= s.span; k++) this.cells.push([s.tx + this.dir * k, s.fy]);
    this.need = Math.ceil(s.span / HOOK.link);
  }
  // the chain's reach in tiles from the hook
  reach() { return Math.min(this.span, this.n * HOOK.link); }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt; if (this.slip > 0) this.slip -= dt;
    const g = this.g, p = g.player, I = (p && p.inp) || {};
    if (this.rigid) return;
    if (UK.keys(g).has('umb:hook' + this.tx)) { this.n = this.need; this.makeRigid(); return; }
    const on = nearMark(p, this.tx, this.fy, 0.9);
    if (!this.hold) {
      // the full chain stays rigid when he lets go; a short one slips
      if (on && I.action && this.slip <= 0) { this.hold = true; this.ht = 0; this.n = 0; TourKit.sfx('grip', 'select', { vol: 0.35, pitch: 1.1 }); }
      return;
    }
    if (!I.action || !on) {
      if (this.n >= this.need) { this.makeRigid(); return; }
      this.hold = false; if (this.n > 0) { this.slip = 0.6; TourKit.sfx('clatter', 'bump', { vol: 0.4, pitch: 0.7 }); UK.say(g, this.cx + this.dir * TS * 2, this.y - 50, 'TOO SOON! IT SLIPPED', UA.CHALK); } this.n = 0; return;
    }
    this.ht += dt;
    // handle after handle arrives and nests; on a corner hook, the sister rides round the far pulley first
    const t0 = HOOK.arrive, extra = this.corner ? HOOK.cornerT : 0;
    let n = 0; if (this.ht >= t0) n = 1; if (this.ht >= t0 + extra + HOOK.arrive) n = 1 + Math.floor((this.ht - t0 - extra) / HOOK.arrive);
    n = Math.min(this.need, n);
    if (this.corner && n === 1 && this.msgT <= 0 && this.ht > t0 + 0.2) { this.msgT = 3; UK.say(g, this.cx + this.dir * TS * 3, this.y - 50, 'SAME WAY ROUND! HOLD ON: IT TURNS THE CORNER', UA.GOLD_L); }
    if (n > this.n) { this.n = n; TourKit.sfx('click', 'select', { vol: 0.35, pitch: 1 + n * 0.12 }); if (n >= this.need) { UK.say(g, this.cx + this.dir * this.span * TS / 2, this.y - 50, 'NESTED! LET GO WHEN YOU LIKE', UA.GOLD_L); g.burst(this.cx + this.dir * this.span * TS, this.y, 10, UA.GOLD, 'confetti'); } }
  }
  makeRigid() {
    if (this.rigid) return; this.rigid = true; this.hold = false; this.n = this.need;
    for (const [x, y] of this.cells) this.g.setTile(x, y, T.SEMI);
    UK.keys(this.g).add('umb:hook' + this.tx);
    Sound.play('door', { vol: 0.5 }); UK.say(this.g, this.cx + this.dir * this.span * TS / 2, this.y - 40, 'RIGID! A BRIDGE OF HANDLES', '#ffffff');
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, p = g.player, t = this.t, hx = this.tx * TS + TS / 2 + this.dir * TS * 0.5, fy = this.fy * TS, wy = this.wireY, far = hx + this.dir * this.span * TS;
    ctx.save(); ctx.lineCap = 'round';
    // the wire overhead and the umbrellas riding it (handles down), from the near side across and on
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx - this.dir * 3 * TS, wy); ctx.lineTo(far + this.dir * 2 * TS, wy); ctx.stroke();
    // the far pulley (the corner the sister turns) on a corner hook
    if (this.corner) { ctx.fillStyle = '#9aa4b8'; ctx.beginPath(); ctx.arc(far + this.dir * 2 * TS, wy + 10, 10, 0, TAU); ctx.fill(); ctx.stroke(); }
    if (!this.rigid) for (let k = 0; k < 4; k++) {
      const u = ((t * 0.5 + k / 4) % 1), x = lerp(hx - this.dir * 3 * TS, far + this.dir * 2 * TS, u);
      UA.furled(ctx, x, wy + 4, 40, [UA.NAVY_L, UA.CORAL, UA.GOLD_D, '#5a9a8a'][k], 0);
    }
    // the hook post at the edge, its hook, the far ring
    ctx.fillStyle = '#5a6a8a'; ctx.fillRect(hx - this.dir * 4 - 3, fy - 2.6 * TS, 6, 2.6 * TS); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(hx - this.dir * 4 - 3, fy - 2.6 * TS, 6, 2.6 * TS);
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(hx, fy - 4, 7, Math.PI, 0, this.dir < 0); ctx.stroke(); ctx.strokeStyle = '#c0c8d8'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(hx, fy - 4, 7, Math.PI, 0, this.dir < 0); ctx.stroke();
    const lit = this.n >= this.need || this.rigid;
    ctx.strokeStyle = lit ? UA.GOLD_L : INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(far, fy - 4, 8, 0, TAU); ctx.stroke();
    if (lit && !this.rigid) { const k = 0.5 + 0.5 * Math.sin(t * 10); ctx.strokeStyle = `rgba(255,216,74,${0.4 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(far, fy - 4, 14 + k * 4, 0, TAU); ctx.stroke(); }
    // the chain: closed umbrellas lying handle-in-handle along the edge row
    const L = this.reach() * TS, nn = this.rigid ? this.need : this.n;
    for (let k = 0; k < nn; k++) {
      const x0 = hx + this.dir * k * HOOK.link * TS, sag = this.rigid ? 0 : Math.sin(t * 4 + k) * 1.5;
      ctx.save(); ctx.translate(x0, fy - 4 + sag); ctx.rotate(this.dir > 0 ? -Math.PI / 2 : Math.PI / 2); UA.furled(ctx, 0, 0, HOOK.link * TS + 4, [UA.NAVY_L, UA.CORAL, UA.GOLD_D, '#5a9a8a'][k % 4], 0); ctx.restore();
    }
    // on a corner hook, while he holds the first handle: the sister rides out to the pulley and back round
    if (this.corner && this.hold && this.n === 1) {
      const u = clamp((this.ht - HOOK.arrive) / HOOK.cornerT, 0, 1), sx = u < 0.5 ? lerp(hx, far + this.dir * 2 * TS, u * 2) : lerp(far + this.dir * 2 * TS, hx + this.dir * HOOK.link * TS, (u - 0.5) * 2);
      ctx.save(); ctx.translate(sx, u < 0.5 ? wy + 4 : fy - 30); ctx.rotate(u < 0.5 ? 0 : (this.dir > 0 ? Math.PI : -Math.PI) * Math.min(1, (u - 0.5) * 4)); UA.furled(ctx, 0, 0, 40, UA.CORAL, 0); ctx.restore();
    }
    // the mark: where he stands to hold the hook
    if (!this.rigid) {
      const on = nearMark(p, this.tx, this.fy, 0.9);
      UA.ring(ctx, this.tx * TS + TS / 2, fy, t, on, 16);
      if (on && !this.hold) { const k = 0.5 + 0.5 * Math.sin(t * 7); UA.pill(ctx, this.tx * TS + TS / 2, fy - 3.6 * TS, 'HOLD THROW', UA.GOLD_L, 0.7 + 0.3 * k); }
      if (this.hold) { UA.pill(ctx, this.tx * TS + TS / 2, fy - 3.6 * TS, this.n >= this.need ? 'NESTED! LET GO' : 'KEEP HOLDING... ' + this.n + ' / ' + this.need, this.n >= this.need ? UA.GOLD_L : '#ffffff'); }
    }
    ctx.restore();
  }
}
ENTITY_TYPES.umbHook = UmbHook;
// the piece: the letter is the mark (the near bank's last floor tile's standing spot); { span, dir, corner, wire }
Tour.pieces['umb.hook'] = function (st, o) {
  const B = st.B, x = st.x, y = st.gy - 1, dir = o.dir || 1, span = o.span || 6;
  for (let k = 1; k <= span; k++) B.set(x + dir * k, y + 1, T.EMPTY);
  B.spawn('umbHook', x, y, { tx: x, fy: y + 1, span, dir, corner: !!o.corner, wireY: y + 1 - (o.wire || 5) });
  return st.x;
};
// the checker: from the mark, the bridge's cells one after another, and back
onCheck('umbHookEdges', function (a) {
  const L = (a.spawns || []).filter(s => s.type === 'umbHook'); if (!L.length) return;
  a.edges = a.edges || [];
  for (const s of L) {
    let prev = [s.tx, s.fy];
    for (let k = 1; k <= s.span; k++) { const c = [s.tx + s.dir * k, s.fy]; a.edges.push({ from: [prev[0], prev[1] - 1], to: c }, { from: [c[0], c[1] - 1], to: prev }); prev = c; }
    a.edges.push({ from: [prev[0], prev[1] - 1], to: [s.tx + s.dir * (s.span + 1), s.fy] });
  }
});

/* ======================= 31-4 PANELS: dents in the canopy overhead ======================= */
// spawn { tx0, w (the panel's tiles on row py), py, curtain (the column the rain falls in), fy (the floor row), id,
// group, gi (index in the group) }; the rain sheet is a lock (column curtain, rows py + 1 .. fy - 1)
class UmbPanel extends Ent {
  constructor(g, s) {
    super(g, s, s.w * TS, TS); this.tx0 = s.tx0; this.x = s.tx0 * TS; this.y = s.py * TS; this.py = s.py; this.fy = s.fy; this.cur = s.curtain; this.id = s.id; this.group = s.group || null; this.gi = s.gi || 0;
    this.dent = true; this.popT = 0; this.lastVy = 0; this.cool = 0; this.walled = !s.group;
  }
  update(dt) {
    this.t += dt; if (this.popT > 0) this.popT -= dt; if (this.cool > 0) this.cool -= dt;
    const g = this.g, p = g.player;
    if (this.walled && this.dent && UK.keys(g).has(this.id)) this.pop(true);
    if (p && !p.dead) {
      // a head-bump from underneath: he was rising, now he's stopped against the panel's underside
      const under = p.cx > this.x + 4 && p.cx < this.x + this.w - 4 && Math.abs(p.y - (this.y + TS)) < 8;
      if (under && this.lastVy < -1 * TS && p.vy >= 0 && this.cool <= 0) { this.cool = 0.35; if (this.dent) this.pop(); else { TourKit.sfx('bonk', 'bump', { vol: 0.3, pitch: 1.4 }); } }
      this.lastVy = p.vy;
    }
  }
  pop(quiet) {
    const g = this.g; this.dent = false; this.popT = 0.4;
    if (!quiet) { TourKit.sfx('pop', 'kick', { vol: 0.5, pitch: 1.5 }); g.burst(this.cx, this.y + TS, 10, UA.GOLD, 'confetti'); UK.say(g, this.cx, this.y - 20, 'POP!', '#ffffff'); }
    if (this.walled) { UK.keys(g).add(this.id); for (let y = this.py + 1; y < this.fy; y++) g.setTile(this.cur, y, T.EMPTY); }
    // in a row of three: this one pops its left neighbour back in
    if (this.group) {
      const L = g.entities.filter(e => e instanceof UmbPanel && e.group === this.group), nb = L.find(e => e.gi === this.gi - 1);
      if (nb && !nb.dent) { nb.dent = true; nb.popT = 0.4; UK.say(g, nb.cx, nb.y - 20, 'BOINK! IT POPPED BACK IN', UA.CHALK); }
      if (L.every(e => !e.dent)) { UK.keys(g).add('umb:' + this.group); UK.say(g, this.cx, this.y - 44, 'ALL THREE OUT! THE SHUTTER\'S UP', UA.GOLD_L); }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, t = this.t, p = this.g.player;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the panel: a marigold canopy wedge under the ceiling; a dent sags down in its middle (rain pours through it);
    // popped, it bulges up and the rain runs off its sides
    const sag = this.dent ? 14 : -6, k = this.popT > 0 ? Math.sin(this.popT * 30) * 4 : 0;
    ctx.fillStyle = UA.GOLD; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.quadraticCurveTo(x + w / 2, y + 4 + sag + k, x + w, y + 4); ctx.lineTo(x + w, y + TS); ctx.quadraticCurveTo(x + w / 2, y + TS + sag + k, x, y + TS); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = UA.NAVY; ctx.lineWidth = 2; for (let q = 1; q < w / TS; q++) { ctx.beginPath(); ctx.moveTo(x + q * TS, y + 4); ctx.lineTo(x + q * TS, y + TS + sag * Math.sin(q / (w / TS) * Math.PI)); ctx.stroke(); }
    if (this.dent) {
      ctx.fillStyle = 'rgba(31,42,86,0.35)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + TS + sag - 6, w * 0.28, 6, 0, 0, TAU); ctx.fill();
      // pulse under it: bump me
      const near = p && Math.abs(p.cx - this.cx) < w / 2 + TS && p.y > y && p.y < this.fy * TS;
      if (near) UA.ring(ctx, this.cx, y + TS + sag + 4, t, true, w * 0.32);
    } else {
      ctx.strokeStyle = 'rgba(140,200,250,0.8)'; ctx.lineWidth = 2; for (const s of [-1, 1]) { const ex = s < 0 ? x - 2 : x + w + 2; for (let q = 0; q < 3; q++) { const yy = y + TS + ((t * 200 + q * 30) % 90); UA.dash(ctx, ex, yy, 10); } }
    }
    // the rain sheet through the dent (a solid wall of water while it is dented)
    if (this.dent && this.cur != null) {
      const cx = this.cur * TS + TS / 2, top = y + TS + sag - 4, bot = this.fy * TS;
      ctx.fillStyle = 'rgba(120,180,240,0.55)'; ctx.fillRect(cx - 14, top, 28, bot - top);
      ctx.strokeStyle = 'rgba(240,248,255,0.9)'; ctx.lineWidth = 2; for (let q = 0; q < 5; q++) { const xx = cx - 11 + q * 5.5; for (let yy = top + ((t * 420 + q * 37) % 40) - 40; yy < bot; yy += 40) { ctx.beginPath(); ctx.moveTo(xx, Math.max(top, yy)); ctx.lineTo(xx, Math.min(bot, yy + 22)); ctx.stroke(); } }
      ctx.fillStyle = 'rgba(240,248,255,0.8)'; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(cx - 15 + q * 10, bot - 3 - Math.abs(Math.sin(t * 9 + q)) * 5, 3, 0, TAU); ctx.fill(); }
    } else if (this.dent && this.group) {
      // a group panel's rain only splashes into the gutter below (no wall)
      const cx = this.cx, top = y + TS + sag - 4, bot = top + 2.2 * TS;
      ctx.strokeStyle = 'rgba(140,200,250,0.85)'; ctx.lineWidth = 2; for (let q = 0; q < 4; q++) { const xx = cx - 8 + q * 5; for (let yy = top + ((t * 380 + q * 31) % 30) - 30; yy < bot; yy += 30) { ctx.beginPath(); ctx.moveTo(xx, Math.max(top, yy)); ctx.lineTo(xx, Math.min(bot, yy + 16)); ctx.stroke(); } }
    }
    ctx.restore();
  }
}
// the arcade's shutter (opens when all three of its row are popped)
class UmbShutter extends UmbLockBase {
  constructor(g, s) { super(g, s, s.h || 4); }
  draw(ctx) {
    const x = this.cx, top = this.y, h = this.h, up = this.openT * h;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = UA.NAVY_D; ctx.fillRect(x - 18, top - 14, 36, 12); ctx.strokeRect(x - 18, top - 14, 36, 12);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 18, top - 2, 36, h + 4); ctx.clip();
    ctx.fillStyle = '#9aa4b8'; ctx.fillRect(x - 15, top - up, 30, h); ctx.strokeRect(x - 15, top - up, 30, h);
    ctx.strokeStyle = '#6a7488'; ctx.lineWidth = 1.5; for (let y = top - up + 6; y < top - up + h; y += 7) { ctx.beginPath(); ctx.moveTo(x - 15, y); ctx.lineTo(x + 15, y); ctx.stroke(); }
    ctx.restore(); ctx.restore();
  }
}
Object.assign(ENTITY_TYPES, { umbPanel: UmbPanel, umbShutter: UmbShutter });
Object.assign(Tour.pieces, {
  // a dented panel: the letter is the panel's left tile (on the ceiling row: HARD); { w, curtain (columns from the
  // left end to the rain sheet), floor (rows down to the floor's top), id }. The bump spots: under its left part
  'umb.panel'(st, o) {
    const B = st.B, x = st.x, py = st.gy - 1, w = o.w || 5, fy = py + (o.floor || 5), cur = x + (o.curtain != null ? o.curtain : w - 1), id = 'umb:' + (o.id || 'panel' + x);
    for (let k = 0; k < w; k++) B.set(x + k, py, T.HARD);
    B.lock(cur, py + 1, fy - 1, id, 'umbRain');
    const s = B.spawns[B.spawns.length - 1]; s.type = 'umbPanelRain';
    B.spawn('umbPanel', x, py, { tx0: x, w, py, curtain: cur, fy, id });
    const v = []; for (let k = 0; k < Math.max(1, cur - x); k++) v.push([x + k, fy - 1]);
    B.vkey(id, v, 'any');
    return st.x;
  },
  // a row of three panels (w each, side by side) over a safe floor, the shutter `gate` columns past the row
  'umb.panelRow'(st, o) {
    const B = st.B, x = st.x, py = st.gy - 1, w = o.w || 4, fy = py + (o.floor || 5), id = o.id || 'row' + x, gx = x + 3 * w + (o.gate || 2), h = o.h || 4;
    for (let i = 0; i < 3; i++) { for (let k = 0; k < w; k++) B.set(x + i * w + k, py, T.HARD); B.spawn('umbPanel', x + i * w, py, { tx0: x + i * w, w, py, curtain: null, fy, id: 'umb:' + id + i, group: id, gi: i }); }
    lockAs(B, gx, fy - h, fy - 1, 'umb:' + id, 'umbShutter', { h });
    const v = []; for (let k = 0; k < 3 * w; k++) v.push([x + k, fy - 1]);
    B.vkey('umb:' + id, v, 'any');
    return st.x;
  }
});
// the rain sheet itself is drawn by its panel; the lock entity is only its tiles
class UmbPanelRain extends UmbLockBase { constructor(g, s) { super(g, s, s.h || 1); } update(dt) { this.t += dt; if (!this.open && UK.keys(this.g).has(this.id)) this.release(); } release() { if (this.open) return; this.open = true; for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY); } draw() {} }
ENTITY_TYPES.umbPanelRain = UmbPanelRain;

/* ======================= 31-5 SHAKE: herding puddles on a canopy floor ======================= */
// spawn { tx0, tx1 (the canopy's tiles on its row fy), wet (+1: the scallop is at the right end), n (puddles), need,
// cupH (rows up to the cup), id, gate (columns from the scallop end to the gate), h }
class UmbShake extends Ent {
  constructor(g, s) {
    super(g, s, (s.tx1 - s.tx0 + 1) * TS, TS); this.back = true; this.tx0 = s.tx0; this.tx1 = s.tx1; this.fy = s.fy; this.x = s.tx0 * TS; this.y = (s.fy - 1) * TS; this.wet = s.wet || 1;
    this.id = s.id; this.need = s.need || 1; this.cupH = s.cupH || 4; this.done = false; this.flung = null; this.wasG = true; this.lastVy = 0; this.msgT = 0;
    const L = this.x + 1.6 * TS, R = this.x + this.w - 1.6 * TS; this.pud = []; for (let k = 0; k < (s.n || 1); k++) this.pud.push({ x: lerp(L, R, (k + 0.5) / (s.n || 1)) + (k % 2 ? 6 : -6), vx: 0 });
  }
  scoopX() { return this.wet > 0 ? this.x + this.w - 0.8 * TS : this.x + 0.8 * TS; }
  inScoop(q) { return Math.abs(q.x - this.scoopX()) < 0.9 * TS; }
  dryX() { return this.wet > 0 ? this.x + 0.8 * TS : this.x + this.w - 0.8 * TS; }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    const g = this.g, p = g.player;
    if (!this.done && UK.keys(g).has(this.id)) this.done = true;
    if (this.flung) {
      this.flung.u += dt / 1.1;
      if (this.flung.u >= 1) {
        const f = this.flung; this.flung = null;
        if (f.n >= this.need) { this.done = true; UK.keys(g).add(this.id); Sound.play('door', { vol: 0.6 }); UK.say(g, this.scoopX(), this.y - this.cupH * TS - 30, 'IN THE CUP! DOWN IT GOES', UA.GOLD_L); }
        else { UK.say(g, this.scoopX(), this.y - this.cupH * TS - 30, this.need > 1 ? 'NOT HIGH ENOUGH: ' + this.need + ' MUST LEAVE TOGETHER!' : 'MISSED!', UA.CHALK); for (let k = 0; k < f.n; k++) this.pud.push({ x: lerp(this.x + 1.5 * TS, this.x + this.w - 1.5 * TS, Math.random()), vx: 0 }); }
      }
    }
    if (!p || p.dead) return;
    const onIt = p.onGround && p.groundTy === this.fy && p.cx > this.x && p.cx < this.x + this.w;
    // herd: water just ahead of his feet, the way he walks, slides on in front of him (water in the scallop stays put)
    if (onIt && Math.abs(p.vx) > 10) {
      const d = Math.sign(p.vx);
      for (const q of this.pud) { if (this.inScoop(q)) continue; const ahead = (q.x - p.cx) * d; if (ahead > -4 && ahead < 22) q.x = p.cx + d * 22; }
    }
    // water outside the scallop rolls back toward the dip in the middle; the scallop holds what's in it
    const mid = this.x + this.w / 2;
    for (const q of this.pud) { q.x = clamp(q.x, this.x + 0.5 * TS, this.x + this.w - 0.5 * TS); if (!this.inScoop(q)) q.x = approach(q.x, mid, 0.7 * TS * dt); }
    // a stamp on the dry end flings the scallop's water up at the cup
    const onEnd = p.onGround && p.groundTy === this.fy && p.cx > this.x - 0.7 * TS && p.cx < this.x + this.w + 0.7 * TS;
    const landed = onEnd && !this.wasG && this.lastVy > 3 * TS && (this.wet > 0 ? p.cx < this.x + 2.4 * TS : p.cx > this.x + this.w - 2.4 * TS);
    this.wasG = onIt || p.onGround; this.lastVy = p.vy;
    if (landed && !this.done && !this.flung) {
      const go = this.pud.filter(q => this.inScoop(q)); this.pud = this.pud.filter(q => !this.inScoop(q));
      g.shake(3); TourKit.sfx('fling', 'spring', { vol: 0.5, pitch: 0.9 });
      if (go.length) this.flung = { u: 0, n: go.length };
      else if (this.msgT <= 0) { this.msgT = 2; UK.say(g, p.cx, p.y - 30, 'THE SCALLOP\'S EMPTY: HERD THE WATER INTO IT FIRST', UA.CHALK); }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, w = this.w, fy = this.fy * TS, t = this.t, p = this.g.player, sx = this.scoopX(), dx = this.dryX();
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the canopy laid flat: marigold wedges; the scallop end dips; the dry end has a coral stamp patch
    // (its tiles are hidden: the canopy is the floor) the wedges laid out flat, shaded underneath, ink-blue ribs, the
    // scalloped hem along the bottom with coral ferrules
    ctx.fillStyle = UA.GOLD_D; ctx.fillRect(x, fy + 6, w, TS - 6);
    for (let q = 0; q < w; q += TS) { ctx.fillStyle = (q / TS) % 2 ? UA.GOLD : UA.GOLD_L; ctx.beginPath(); ctx.moveTo(x + q, fy - 2); ctx.lineTo(x + q + TS, fy - 2); ctx.lineTo(x + q + TS, fy + TS - 8); ctx.quadraticCurveTo(x + q + TS / 2, fy + TS - 1, x + q, fy + TS - 8); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x, fy - 2, w, TS - 6);
    ctx.strokeStyle = UA.NAVY; ctx.lineWidth = 2.4; for (let q = TS; q < w; q += TS) { ctx.beginPath(); ctx.moveTo(x + q, fy - 1); ctx.lineTo(x + q, fy + TS - 8); ctx.stroke(); }
    ctx.fillStyle = UA.CORAL; for (let q = 0; q <= w; q += TS) { ctx.beginPath(); ctx.arc(x + q, fy + TS - 7, 3, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(31,42,86,0.4)'; ctx.beginPath(); ctx.ellipse(sx, fy + 1, 0.9 * TS, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = UA.CORAL; ctx.strokeStyle = INK; rr(ctx, dx - 14, fy - 5, 28, 5, 2); ctx.fill(); ctx.stroke();
    // the puddles
    for (const q of this.pud) { ctx.fillStyle = this.inScoop(q) ? 'rgba(90,160,240,0.85)' : 'rgba(130,190,250,0.8)'; ctx.beginPath(); ctx.ellipse(q.x, fy - 3, 12, 4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(26,24,48,0.6)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(q.x - 5, fy - 5, 5, 1.5); }
    const inN = this.pud.filter(q => this.inScoop(q)).length;
    // the counterweight cup above the scallop on its chain (it sinks when filled)
    const cy = fy - this.cupH * TS + (this.done ? TS * 1.2 : 0);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, cy - 30); ctx.lineTo(sx, cy - 120); ctx.stroke();
    ctx.fillStyle = '#c0c8d8'; ctx.beginPath(); ctx.moveTo(sx - 20, cy - 26); ctx.lineTo(sx + 20, cy - 26); ctx.lineTo(sx + 14, cy); ctx.lineTo(sx - 14, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (this.done) { ctx.fillStyle = '#6ab4f0'; ctx.fillRect(sx - 15, cy - 18, 30, 14); }
    if (!this.done) { ctx.fillStyle = INK; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(20,16,36,0.84)'; rr(ctx, sx - 22, cy - 50, 44, 16, 8); ctx.fill(); ctx.fillStyle = inN >= this.need ? UA.GOLD_L : '#ffffff'; ctx.fillText(inN + ' / ' + this.need, sx, cy - 38); }
    // the fling in the air
    if (this.flung) { const u = this.flung.u, y = lerp(fy - 10, cy - 10, Math.sin(u * Math.PI / 2)) - Math.sin(u * Math.PI) * 30; for (let k = 0; k < this.flung.n; k++) UA.drop(ctx, sx + (k - (this.flung.n - 1) / 2) * 10, y, 5); }
    // the dry end pulses when the scallop holds enough
    if (!this.done && inN >= this.need) { UA.ring(ctx, dx, fy, t, true, 18); if (p && Math.abs(p.cx - dx) < 4 * TS) { const k = 0.5 + 0.5 * Math.sin(t * 7); UA.pill(ctx, dx, fy - 3.4 * TS, 'JUMP ON THE DRY END!', UA.GOLD_L, 0.7 + 0.3 * k); } }
    ctx.restore();
  }
}
// the gate the cup lifts (a riveted gate on a counterweight chain)
class UmbCupGate extends UmbLockBase {
  constructor(g, s) { super(g, s, s.h || 4); }
  draw(ctx) {
    const x = this.cx, top = this.y, h = this.h, up = this.openT * (h - 8);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, top - 40); ctx.lineTo(x, top - up); ctx.stroke();
    ctx.fillStyle = UA.NAVY; ctx.fillRect(x - 13, top - up, 26, h); ctx.strokeRect(x - 13, top - up, 26, h);
    ctx.fillStyle = UA.CORAL; for (let y = top - up + 8; y < top - up + h - 4; y += 18) { ctx.beginPath(); ctx.arc(x - 7, y, 2.2, 0, TAU); ctx.arc(x + 7, y, 2.2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
Object.assign(ENTITY_TYPES, { umbShake: UmbShake, umbCupGate: UmbCupGate });
// the piece: the letter is the canopy's left end on its floor row's standing spot; { w, wet (+1 / -1), n, need, cup,
// gate (columns past the end), h, id }. The canopy's tiles are floor (HARD).
Tour.pieces['umb.shake'] = function (st, o) {
  const B = st.B, x = st.x, y = st.gy - 1, w = o.w || 8, tx1 = x + w - 1, wet = o.wet || 1, id = 'umb:' + (o.id || 'cup' + x), h = o.h || 4;
  for (let k = x; k <= tx1; k++) { B.set(k, y + 1, T.HARD); B.setHide(k, y + 1, 1); }
  B.spawn('umbShake', x, y, { tx0: x, tx1, fy: y + 1, wet, n: o.n || 1, need: o.need || 1, cupH: o.cup || 4, id });
  const gx = wet > 0 ? tx1 + (o.gate || 2) : x - (o.gate || 2);
  lockAs(B, gx, y - h + 1, y, id, 'umbCupGate', { h });
  B.vkey(id, [[wet > 0 ? x : tx1, y]], 'any');
  return st.x;
};

/* ======================= 31-6 RUNNER: the inside-out umbrella in a repair collar (the lead-in) ======================= */
// a lock spawn (the canopy across the way, h rows) turned into this: { id, side (-1: Brady comes from the left, the
// runner's mark is on his side), pull (tiles to walk back) }
class UmbJam extends Ent {
  constructor(g, s) {
    super(g, s, TS, (s.h || 4) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.id = s.id; this.side = s.side || -1; this.pull = s.pull || 3;
    this.tiles = []; const tx = Math.floor(s.x / TS), ty1 = Math.floor((s.y - 1) / TS); for (let k = 0; k < (s.h || 4); k++) this.tiles.push([tx, ty1 - k]); this.tx = tx; this.fy = ty1 + 1;
    this.open = false; this.hold = false; this.pos = 0; this.openT = 0; this.msgT = 0;
  }
  markX() { return this.tx + this.side * 2; }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt; const g = this.g, p = g.player, I = (p && p.inp) || {};
    if (this.open) { this.openT = Math.min(1, this.openT + dt * 1.4); return; }
    if (UK.keys(g).has(this.id)) { this.release(); return; }
    if (!p || p.dead) { this.hold = false; return; }
    if (!this.hold) {
      this.pos = Math.max(0, this.pos - dt * 3);
      if (I.action && nearMark(p, this.markX(), this.fy, 0.9)) { this.hold = true; this.x0 = p.cx; TourKit.sfx('grip', 'select', { vol: 0.35, pitch: 1.0 }); }
      return;
    }
    if (!I.action || !p.onGround) { this.hold = false; return; }
    // walking back (away from the collar) slides the runner home along the shaft
    this.pos = clamp((p.cx - this.x0) * this.side / (this.pull * TS), 0, 1);
    if (this.pos >= 1) { UK.keys(g).add(this.id); this.release(); }
  }
  release() {
    if (this.open) return; this.open = true; this.hold = false; this.pos = 1;
    for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY);
    Sound.play('door', { vol: 0.6 }); TourKit.sfx('snap', 'kick', { vol: 0.5, pitch: 1.2 }); UK.say(this.g, this.cx, this.y - 20, 'SNAP! THE RIGHT WAY OUT', '#ffffff');
  }
  touchPlayer(p) {}
  draw(ctx) {
    const g = this.g, p = g.player, t = this.t, x = this.cx, fy = this.fy * TS, h = this.h, mx = this.markX() * TS + TS / 2;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the repair collar: an iron ring on a post at the floor
    ctx.fillStyle = '#5a6a8a'; ctx.fillRect(x - 4, fy - 1.4 * TS, 8, 1.4 * TS); ctx.strokeRect(x - 4, fy - 1.4 * TS, 8, 1.4 * TS);
    // the umbrella: jammed inside out (a bowl across the way) until the runner is home, then folded and tipped aside
    const shaftY = fy - 1.2 * TS;
    if (!this.open) {
      UA.umbrella(ctx, x, fy - h + 10, h * 0.5, { inside: true, len: 0, c1: UA.GOLD, c2: UA.GOLD_L, n: 6 });
      // the shaft through the collar out toward Brady, the coral runner on it, the notch it must reach
      const sx1 = mx + this.side * this.pull * TS * 0.3;
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, fy - h + 14); ctx.lineTo(x, shaftY); ctx.lineTo(sx1, shaftY); ctx.stroke();
      ctx.strokeStyle = '#a0a8c0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, fy - h + 14); ctx.lineTo(x, shaftY); ctx.lineTo(sx1, shaftY); ctx.stroke();
      const rx = lerp(x + this.side * 10, sx1, this.pos);
      ctx.fillStyle = UA.CORAL; rr(ctx, rx - 9, shaftY - 7, 18, 14, 4); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.strokeStyle = UA.GOLD_L; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx1, shaftY - 10); ctx.lineTo(sx1, shaftY + 10); ctx.stroke();
      const on = nearMark(p, this.markX(), this.fy, 0.9);
      UA.ring(ctx, mx, fy, t, on || this.hold, 16);
      if (on && !this.hold) { const k = 0.5 + 0.5 * Math.sin(t * 7); UA.pill(ctx, mx, fy - 3.4 * TS, 'HOLD THROW, WALK BACK', UA.GOLD_L, 0.7 + 0.3 * k); }
      if (this.hold && p) { ctx.strokeStyle = UA.CORAL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, shaftY); ctx.lineTo(p.cx, p.y + 26); ctx.stroke(); }
      ctx.fillStyle = '#7a8498'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, shaftY, 9, 14, 0, 0, TAU); ctx.stroke();
    } else {
      ctx.save(); ctx.translate(x + this.side * -14 * this.openT, fy - 6); ctx.rotate(-this.side * 1.3 * this.openT); UA.furled(ctx, 0, -h + 10, h - 12, UA.GOLD_D, 0); ctx.restore();
    }
    ctx.restore();
  }
}
ENTITY_TYPES.umbJam = UmbJam;
Tour.pieces['umb.jam'] = function (st, o) {
  const B = st.B, x = st.x, y = st.gy - 1, h = o.h || 4, id = 'umb:' + (o.id || 'jam' + x), side = o.side || -1;
  lockAs(B, x, y - h + 1, y, id, 'umbJam', { side, pull: o.pull || 3 });
  B.vkey(id, [[x + side * 2, y]], 'any');
  return st.x;
};

Object.assign(TourLandscape.ARCH_LABEL, { dripstamp: 'DRIPS', hookchain: 'HOOKS', panelpop: 'PANELS', puddleherd: 'PUDDLES' });
Object.assign(UK, { HOOK, water });
})();
