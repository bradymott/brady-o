/* ============================================================
   WRONG SIDE OF THE WASH: 26-6 FITTED SHEET FOR ONE, and HER FITTED MAJESTY.
   The lead-in, the linen cupboard: loose fitted sheets hang across the way, pinned to the wall. A sheet's elastic
   corner draws taut and aims at Brady (the tell), then snaps straight ahead: jump it, and it hooks the bedpost
   behind him instead, pulling the sheet aside. The Sock Divorce room is off the cupboard, before the bed.
   The boss: a navy-checked fitted sheet with a winking face, floating over a huge bed with four bedposts. She is
   cloth: no stomping. Each hit is one of her corners tucked over a post.
   1 THE ARROW      one corner draws taut into an arrow at Brady (0.9 s), then snaps straight ahead along the bed. Jump
                    it in front of a free post: it snags the post. (Two corners.)
   2 THE DOUBLE SWEEP  two corners pucker into rings (1.0 s), then sweep the bed one after the other: the first, wide and
                    low-topped: DUCK under its top (DOWN); the second rolls along the mattress: JUMP through it. Each ring
                    that gets past him catches a post. (Two corners.)
   3 THE SHAKE      her last loose pocket balloons around a bedpost a few steps away (1.8 s); then she shakes the bed. Be inside the
                    pocket and in the air on the shake: the last corner is tucked. (Twice: the pocket comes untucked
                    once.) She lies perfectly flat... and complains of a wrinkle.
   ============================================================ */
(function () {
const WK = Tour.washKit, INK = WK.INK, WA = WK.WashArt;
// her words come up under her (she floats high: over her they would sit on the HUD)
const say = (g, b, text, col) => { if (b && b.y != null && b.boss) Tour.washKit.say(g, b.cx, b.y + b.h + 30, text, col || '#ffffff'); else TourKit.say(g, b, text, col); };

/* ---------------- the lead-in: a loose sheet across the way, its corner, the post behind ---------------- */
// spawn { id, x0 (the corner's anchor column, on the wall), post (the post's column), y (the floor row), side (1: it
// snaps to the right) } with the lock (B.lock: the hanging sheet's column) and the post as decor
class WashLooseSheet extends Ent {
  constructor(g, s) {
    super(g, s, TS, 4 * TS); this.id = s.id; this.dir = s.side || 1; this.postX = s.post * TS + TS / 2; this.floorY = (s.ty + 1) * TS; this.back = true;
    this.x = s.sx * TS; this.y = this.floorY - 5 * TS; this.w = TS; this.h = 5 * TS;
    this.tiles = s.tiles || []; this.state = 'wait'; this.st = 0; this.head = 0; this.open = false; this.cool = 0;
  }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player; if (this.cool > 0) this.cool -= dt;
    if (this.open) return;
    if (g.keys && g.keys.has(this.id)) { this.hook(); return; }
    const ly = this.floorY - 0.9 * TS, x0 = this.x + (this.dir > 0 ? TS : 0);
    if (this.state === 'wait') {
      // it aims when Brady stands on the bed between it and the post, on its line
      if (p && !p.dead && this.cool <= 0 && (p.cx - x0) * this.dir > 0 && (this.postX - p.cx) * this.dir > -TS && Math.abs(p.y + p.h - this.floorY) < 10) { this.state = 'aim'; this.st = 0; TourKit.sfx('stretch', 'select', { vol: 0.35, pitch: 0.5 }); }
      return;
    }
    this.st += dt;
    if (this.state === 'aim' && this.st >= 0.9) { this.state = 'snap'; this.st = 0; this.head = x0; TourKit.sfx('snap', 'kick', { vol: 0.5, pitch: 1.1 }); }
    if (this.state === 'snap') {
      this.head += this.dir * 15 * TS * dt;
      const box = { x: this.head - 12, y: ly - 10, w: 24, h: 20 };
      if (p && !p.dead && overlap(p, box)) { p.hurt({ x: box.x, w: box.w }); this.state = 'back'; this.st = 0; return; }
      if ((this.head - this.postX) * this.dir >= -8) { g.keys.add(this.id); this.hook(); return; }
    }
    if (this.state === 'back') { this.head -= this.dir * 12 * TS * dt; if ((this.head - x0) * this.dir <= 0) { this.state = 'wait'; this.cool = 0.8; } }
  }
  hook() {
    if (this.open) return; this.open = true; this.head = this.postX;
    for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY);
    Sound.play('door', { vol: 0.5 }); this.g.burst(this.postX, this.floorY - 2 * TS, 14, WA.CREAM, 'confetti'); Tour.washKit.say(this.g, this.postX, this.floorY - 3 * TS, 'TUCKED!', '#ffffff');
  }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t, ly = this.floorY - 0.9 * TS, x0 = this.x + (this.dir > 0 ? TS : 0), fy = this.floorY;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the sheet: hung across the way (open: pulled aside to the post)
    const sx = this.open ? this.postX - this.dir * 10 : this.x + TS / 2, sw = this.open ? 14 : 26;
    WA.gingham(ctx, sx - sw / 2, fy - 5 * TS, sw, 5 * TS, 6, 0.6, '#efe6d0'); ctx.strokeRect(sx - sw / 2, fy - 5 * TS, sw, 5 * TS);
    WA.peg(ctx, sx, fy - 5 * TS + 8, 0.8);
    // the elastic corner: slack, taut into an arrow (the tell), snapping, or hooked over the post
    ctx.strokeStyle = '#e8442e'; ctx.lineWidth = 3;
    if (this.open) { ctx.beginPath(); ctx.moveTo(sx, fy - 2 * TS); ctx.lineTo(this.postX, ly); ctx.stroke(); ctx.beginPath(); ctx.ellipse(this.postX, ly, 9, 6, 0, 0, TAU); ctx.stroke(); }
    else if (this.state === 'aim') {
      const k = Math.min(1, this.st / 0.9), back = x0 - this.dir * k * 20;
      ctx.beginPath(); ctx.moveTo(sx, fy - 2 * TS); ctx.lineTo(back, ly); ctx.stroke();
      ctx.fillStyle = '#e8442e'; ctx.beginPath(); ctx.moveTo(back + this.dir * 18, ly); ctx.lineTo(back, ly - 8); ctx.lineTo(back, ly + 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = `rgba(232,68,46,${0.3 + 0.4 * k})`; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(back, ly); ctx.lineTo(this.postX, ly); ctx.stroke(); ctx.setLineDash([]);
    } else if (this.state === 'snap' || this.state === 'back') { ctx.beginPath(); ctx.moveTo(sx, fy - 2 * TS); ctx.lineTo(this.head, ly); ctx.stroke(); ctx.beginPath(); ctx.ellipse(this.head, ly, 10, 7, 0, 0, TAU); ctx.stroke(); }
    else { const sw2 = Math.sin(t * 2) * 4; ctx.beginPath(); ctx.moveTo(sx, fy - 2 * TS); ctx.quadraticCurveTo(sx + this.dir * 14, fy - 1.2 * TS + sw2, sx + this.dir * 6, fy - 0.6 * TS); ctx.stroke(); }
    ctx.restore();
  }
}
ENTITY_TYPES.washLooseSheet = WashLooseSheet;
// the piece: the letter is the sheet's column on the floor row's standing spot; { post (columns along to the post),
// side, id }. The sheet is a lock across the way (four rows); the checker's key: the spot just before the post
Tour.pieces['wash.looseSheet'] = function (st, o) {
  const B = st.B, x = st.x, y = st.gy - 1, side = o.side || 1, post = x + side * (o.post || 6), id = 'wash:' + (o.id || 'sheet' + x);
  B.lock(x, y - 2, y, id, 'washSheet');
  const s = B.spawns[B.spawns.length - 1]; const tiles = []; for (let yy = y - 2; yy <= y; yy++) tiles.push([x, yy]);
  Object.assign(s, { type: 'washLooseSheet', sx: x, post, ty: y, side, tiles });
  B.decorAt('washPost', post, y + 1, 1);
  // the key: standing on the bed between the sheet and the post, on its line (a jump there and the corner hooks)
  const v = []; for (let k = 1; k < Math.abs(post - x); k++) v.push([x + side * k, y]);
  B.vkey(id, v, 'any');
  return st.x;
};

/* ---------------- the arena: the bed (the mattress is the floor), four bedposts ---------------- */
Tour.pieces['wash.arena_bed'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  B.decorAt('washBedHead', x0 + 1, GY, 1); B.decorAt('washBedHead', x0 + w - 2, GY, 2);
  // a step up to a low shelf at each end (the headboards' tops: somewhere to stand above a sweep)
  for (let q = 0; q < 3; q++) { B.set(x0 + 1 + q, GY - 3, T.SEMI); B.set(x0 + w - 4 + q, GY - 3, T.SEMI); }
};
const POSTS = w => [3, 8, w - 9, w - 4];
Object.assign(Decor, {
  // the bed's headboard (navy-check padded)
  washBedHead(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    WA.gingham(ctx, x - 40, y - 3 * TS - 10, 80, 3 * TS + 10, 8, 0.7, '#e8e2f2'); ctx.strokeRect(x - 40, y - 3 * TS - 10, 80, 3 * TS + 10);
    ctx.fillStyle = '#b8784a'; ctx.fillRect(x - 46, y - 3 * TS - 16, 92, 10); ctx.strokeRect(x - 46, y - 3 * TS - 16, 92, 10);
    ctx.restore();
  }
});

/* ---------------- HER FITTED MAJESTY ---------------- */
const NAMES = ['MIND THE CORNERS!', 'I AM FITTED, DARLING!', 'HOSPITAL CORNERS, PLEASE!', 'ONE SIZE FITS ME!'];
const brain = {
  phases: [4, 2],
  guardText: 'NOT ON THE SHEETS!',
  wake(b) {
    b.phase = 1; b.loops = []; b.tucked = []; b.homeY = b.floorY - 7.2 * TS; b.y = b.homeY;
    const x0 = b.arenaX0 / TS, w = (b.arenaX1 - b.arenaX0) / TS; b.posts = POSTS(w).map(k => ({ x: (x0 + k) * TS + TS / 2, hooked: false }));
    say(b.g, b, 'A VISITOR! AND I\'M NOT EVEN MADE!', '#ffffff');
  },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'THE DOUBLE SWEEP!'; g.bannerT = 2.2; say(g, b, 'TWO CORNERS LEFT. WATCH THIS!', '#ffffff'); }
    if (n === 3) { g.bannerText = 'THE SHAKE!'; g.bannerT = 2.2; say(g, b, 'MY POCKET! I\'LL SHAKE THE WHOLE BED!', '#ffffff'); }
    b.go('drift');
  },
  hurt(b) { say(b.g, b, pick(['TUCKED!', 'SO TIGHT!', 'MY ELASTIC!', 'HOW NEAT...']), '#ffd84a'); b.go('drift'); },
  touch(b, p) { return true; },   // she is cloth: touching her never hurts (her corners do)
  hit(b, kind) { if (kind === 'stomp' || kind === 'spin') return 'bounce'; if (kind === 'star') return false; return false; },
  lastHit(b) { b.flat = true; say(b.g, b, '...THERE\'S A WRINKLE.', '#ffffff'); return false; },
  free(b) { return b.posts.filter(q => !q.hooked); },
  // the corner sheet positions (for drawing the elastic)
  corner(b, k) { const s = k % 2 ? 1 : -1, up = k < 2; return { x: b.cx + s * b.w * 0.45, y: b.y + (up ? 8 : b.h - 6) }; },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, fy = b.floorY;
    b.guard = 'bounce';
    if (!b.posts) this.wake(b);
    // she hovers over the bed, drifting toward Brady's side a little
    const tx = clamp(p ? lerp((b.arenaX0 + b.arenaX1) / 2, p.cx, 0.25) : b.cx, b.arenaX0 + b.w, b.arenaX1 - b.w);
    b.x = approach(b.x, tx - b.w / 2, 1.6 * TS * dt); b.y = b.homeY + Math.sin(b.t * 1.7) * 6;
    if (b.act === 'walk' || b.act === 'idle') b.go('drift');
    if (b.act === 'drift') { if (b.at > (ph === 1 ? 1.4 : 1.6)) b.go(ph === 1 ? 'aim' : ph === 2 ? 'pucker' : 'balloon'); }
    else if (b.act === 'aim') {
      // phase 1's tell: one corner draws taut into an arrow at Brady's height, pointing his way
      if (b.first) { b.dir = p && p.cx < b.cx ? -1 : 1; b.ly = fy - 0.9 * TS; say(g, b, pick(NAMES), '#ffffff'); TourKit.sfx('stretch', 'select', { vol: 0.4, pitch: 0.5 }); }
      if (b.at >= 0.9) { b.go('snap'); b.head = b.cx + b.dir * b.w * 0.5; TourKit.sfx('snap', 'kick', { vol: 0.6 }); }
    } else if (b.act === 'snap') {
      b.head += b.dir * 15 * TS * dt;
      const box = { x: b.head - 12, y: b.ly - 10, w: 24, h: 20 };
      if (p && !p.dead && overlap(p, box)) { p.hurt({ x: box.x, w: box.w }); b.go('back'); return; }
      const post = this.free(b).filter(q => (q.x - b.cx) * b.dir > 0).sort((a, c) => Math.abs(a.x - b.cx) - Math.abs(c.x - b.cx))[0];
      if (post && (b.head - post.x) * b.dir >= -6) { this.tuck(b, post); return; }
      if (b.head < b.arenaX0 + 10 || b.head > b.arenaX1 - 10) b.go('back');
    } else if (b.act === 'back') { if (b.at > 0.5) b.go('drift'); }
    else if (b.act === 'pucker') {
      // phase 2's tell: two corners pucker into rings
      if (b.first) { b.dir = p && p.cx < b.cx ? -1 : 1; say(g, b, 'DUCK... AND JUMP!', '#ffffff'); }
      if (b.at >= 1.0) { b.go('sweep'); b.hoops = [{ x: b.cx + b.dir * 30, kind: 'wide', go: 0, done: false }, { x: b.cx + b.dir * 30, kind: 'low', go: 0.9, done: false }]; }
    } else if (b.act === 'sweep') {
      let busy = false;
      for (const r of b.hoops) {
        if (r.done) continue; busy = true;
        if (b.at < r.go) continue;
        r.x += b.dir * 5.5 * TS * dt;
        // the wide ring's top bar catches a standing Brady (duck under it); the low ring's rim catches him on the bed
        const hit = r.kind === 'wide' ? { x: r.x - 26, y: fy - 44, w: 52, h: 10 } : { x: r.x - 26, y: fy - 16, w: 52, h: 16 };
        if (p && !p.dead && !r.passed && overlap(p, hit)) { p.hurt({ x: hit.x, w: hit.w }); r.done = true; r.missed = true; continue; }
        if (p && (r.x - p.cx) * b.dir > 30) r.passed = true;
        const post = this.free(b).filter(q => (q.x - r.x) * b.dir >= -4 && (q.x - b.cx) * b.dir > 0).sort((a, c) => Math.abs(a.x - r.x) - Math.abs(c.x - r.x))[0];
        if (post && Math.abs(post.x - r.x) < 8) { r.done = true; this.tuck(b, post, true); }
        else if (r.x < b.arenaX0 + 10 || r.x > b.arenaX1 - 10) { r.done = true; r.missed = true; }
      }
      if (!busy && b.act === 'sweep') b.go('drift');
    } else if (b.act === 'balloon') {
      // phase 3's tell: her last pocket balloons around a bedpost (the one furthest from Brady)
      if (b.first) { const px = p ? p.cx : b.cx, L = b.posts.slice().sort((a, c) => Math.abs(a.x - px) - Math.abs(c.x - px)), q = L.find(q2 => Math.abs(q2.x - px) >= 3 * TS && Math.abs(q2.x - px) <= 9 * TS) || L[0]; b.pocket = q.x; say(g, b, 'INTO MY POCKET, THEN!', '#ffffff'); }
      if (b.at >= 1.8) { b.go('shake'); g.shake(10); TourKit.sfx('rumble', 'bump', { vol: 0.6, pitch: 0.5 }); }
    } else if (b.act === 'shake') {
      // the shake: on the bed outside the pocket it throws Brady off his feet (a hit); in the pocket and in the air:
      // the last corner is tucked
      const inside = p && Math.abs(p.cx - b.pocket) < 1.6 * TS;
      if (p && !p.dead && !b.shook) {
        if (inside && !p.onGround) { b.shook = true; this.tuck(b, b.posts.find(q => q.x === b.pocket) || b.posts[0], true, true); return; }
        if (b.at > 0.25 && p.onGround && !inside && Math.abs(p.y + p.h - fy) < 6) { b.shook = true; p.hurt({ x: p.x, w: p.w }); }
        if (b.at > 0.25 && p.onGround && inside) { p.vy = -9 * TS; p.onGround = false; }
      }
      if (b.at > 0.7) { b.shook = false; b.go('drift'); }
    } else b.go('drift');
  },
  tuck(b, post, keep, last) {
    post.hooked = true; b.tucked.push(post.x);
    b.g.burst(post.x, b.floorY - 2.4 * TS, 18, WA.CREAM, 'confetti');
    // a ring or the shake: the act plays on (the second ring is still coming); an arrow: she draws back
    const act = b.act;
    b.damage(1, { quiet: !!keep });
    Tour.washKit.say(b.g, post.x, b.floorY - 3 * TS, 'TUCKED!', '#ffd84a');
    if (keep && b.act === act) say(b.g, b, pick(['TUCKED!', 'SO TIGHT!', 'MY ELASTIC!']), '#ffd84a');
    if (b.act === 'snap') b.go('back');
  },
  draw(b, ctx, t) {
    const x = b.cx, y = b.y, w = b.w, h = b.h, flat = b.flat || b.state === 'dying';
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    const sway = Math.sin(t * 2) * 6, sh = flat ? 0.3 : 1;
    // the sheet: a billowing navy-check square, puckered at the free corners
    const path = () => { ctx.beginPath(); ctx.moveTo(x - w / 2, y + 6); ctx.quadraticCurveTo(x, y - 10 + sway, x + w / 2, y + 6); ctx.quadraticCurveTo(x + w / 2 + 10, y + h * sh / 2, x + w / 2 - 4, y + h * sh); ctx.quadraticCurveTo(x, y + h * sh + 14 - sway, x - w / 2 + 4, y + h * sh); ctx.quadraticCurveTo(x - w / 2 - 10, y + h * sh / 2, x - w / 2, y + 6); ctx.closePath(); };
    ctx.save(); path(); ctx.clip(); WA.gingham(ctx, x - w / 2 - 12, y - 14, w + 24, h + 30, 9, 0.55, '#f4f0e6'); ctx.restore();
    path(); ctx.stroke();
    // the face: a wink, a smug little smile
    const fy = y + h * sh * 0.45;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x - 16, fy, 4, flat ? 1 : 6, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 10, fy); ctx.quadraticCurveTo(x + 16, fy - 6, x + 22, fy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 12, fy + 14); ctx.quadraticCurveTo(x + 2, fy + 24, x + 16, fy + 12); ctx.stroke();
    ctx.fillStyle = '#ff9ab0'; ctx.beginPath(); ctx.arc(x - 26, fy + 10, 5, 0, TAU); ctx.arc(x + 30, fy + 10, 5, 0, TAU); ctx.fill();
    // the poppy pegs at the corners still free
    const tucked = b.tucked ? b.tucked.length : 0;
    for (let k = 0; k < 4; k++) { if (k < tucked) continue; const c = this.corner(b, k); ctx.fillStyle = '#e8442e'; for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + t; ctx.beginPath(); ctx.arc(c.x + Math.cos(a) * 6, c.y + Math.sin(a) * 6, 5, 0, TAU); ctx.fill(); } ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(c.x, c.y, 3.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
};
// her elastic, her rings, her pocket and the four bedposts (in the world, over the bed)
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'wash_majesty' || b.remove || !b.posts) return;
  const fy = b.floorY, t = play.t;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  // the posts (a hooked one shows the elastic from her to it)
  b.posts.forEach((q, k) => {
    // a free post (somewhere to tuck a corner) pulses gold
    if (!q.hooked) { const k2 = 0.5 + 0.5 * Math.sin(t * 5 + k); ctx.save(); ctx.fillStyle = `rgba(255,216,74,${0.18 + 0.22 * k2})`; ctx.beginPath(); ctx.ellipse(q.x, fy - 1.3 * TS, 24 + k2 * 6, 1.6 * TS + k2 * 6, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    Decor.washPost(ctx, q.x, fy, t);
    if (q.hooked) { const c = brain.corner(b, k); ctx.strokeStyle = '#e8442e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.quadraticCurveTo((c.x + q.x) / 2, (c.y + fy - 2.2 * TS) / 2 + 20, q.x, fy - 2.2 * TS); ctx.stroke(); ctx.beginPath(); ctx.ellipse(q.x, fy - 2.2 * TS, 10, 6, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; }
  });
  const c0 = { x: b.cx + (b.dir || 1) * b.w * 0.45, y: b.y + b.h - 6 };
  if (b.act === 'aim') {
    const k = Math.min(1, b.at / 0.9), sx = b.cx + b.dir * (b.w * 0.5 - k * 20);
    ctx.strokeStyle = '#e8442e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(sx, b.ly); ctx.stroke();
    ctx.fillStyle = '#e8442e'; ctx.beginPath(); ctx.moveTo(sx + b.dir * 20, b.ly); ctx.lineTo(sx, b.ly - 9); ctx.lineTo(sx, b.ly + 9); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = `rgba(232,68,46,${0.3 + 0.5 * k})`; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(sx, b.ly); ctx.lineTo(b.dir > 0 ? b.arenaX1 : b.arenaX0, b.ly); ctx.stroke(); ctx.setLineDash([]);
  }
  if (b.act === 'snap' || (b.act === 'back' && b.head != null)) {
    const hx = b.act === 'back' ? lerp(b.head, b.cx, Math.min(1, b.at * 2)) : b.head;
    ctx.strokeStyle = '#e8442e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(hx, b.ly); ctx.stroke(); ctx.beginPath(); ctx.ellipse(hx, b.ly, 11, 8, 0, 0, TAU); ctx.stroke();
  }
  if (b.act === 'pucker') { const k = Math.min(1, b.at); for (const s of [0, 1]) { ctx.strokeStyle = '#e8442e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.cx + b.dir * (30 + s * 30), b.y + b.h + 10, 8 + k * (s ? 10 : 22), 0, TAU); ctx.stroke(); } }
  if (b.act === 'sweep' && b.hoops) for (const r of b.hoops) {
    if (r.done || b.at < r.go) continue;
    ctx.strokeStyle = '#e8442e'; ctx.lineWidth = 4;
    if (r.kind === 'wide') { ctx.beginPath(); ctx.moveTo(r.x - 26, fy); ctx.lineTo(r.x - 26, fy - 40); ctx.lineTo(r.x + 26, fy - 40); ctx.lineTo(r.x + 26, fy); ctx.stroke(); WA.pill(ctx, r.x, fy - 58, 'DUCK', '#ffd84a'); }
    else { ctx.beginPath(); ctx.ellipse(r.x, fy - 26, 26, 26, 0, 0, TAU); ctx.stroke(); WA.pill(ctx, r.x, fy - 68, 'JUMP', '#ffd84a'); }
  }
  if ((b.act === 'balloon' || b.act === 'shake') && b.pocket != null) {
    const k = b.act === 'balloon' ? Math.min(1, b.at / 1.8) : 1, px = b.pocket;
    const pu = 0.5 + 0.5 * Math.sin(t * 8); ctx.fillStyle = `rgba(255,236,170,${0.3 + 0.2 * k + 0.15 * pu})`; ctx.strokeStyle = '#e8442e'; ctx.lineWidth = 3 + pu * 2;
    ctx.beginPath(); ctx.ellipse(px, fy - 1.6 * TS, (0.8 + 0.8 * k) * TS, (1 + 0.9 * k) * TS, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = WA.NAVY_L; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(px, fy - 1.6 * TS, (0.8 + 0.8 * k) * TS - 6, (1 + 0.9 * k) * TS - 6, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    if (b.act === 'shake') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; for (let q = 0; q < 6; q++) { const xx = b.arenaX0 + (q + 0.5) * (b.arenaX1 - b.arenaX0) / 6; ctx.beginPath(); ctx.moveTo(xx - 20, fy - 4 + Math.sin(t * 40 + q) * 4); ctx.lineTo(xx + 20, fy - 4 - Math.sin(t * 40 + q) * 4); ctx.stroke(); } }
  }
  ctx.restore();
});
const boss = { id: 'wash_majesty', name: 'Her Fitted Majesty', hp: 6, dims: [120, 76], floats: true, music: 'tour_wash_boss', country: 'wash', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.wash_majesty = [20, 20, 20, 20];
Tour.washKit.majesty = brain;
})();
