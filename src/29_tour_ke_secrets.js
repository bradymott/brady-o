/* ============================================================
   KENYA's secret rooms (SECRETS_BRIEF.md): six rooms, no two alike, each a little game, most of them found by
   curiosity rather than through a door, and most of them leaving by a different way than they came in.
   The land's one tell, the same everywhere: a little PUFF of dust (over the cool gully: mist) drifting up now and
   then where a hidden way is (KePuff in 29_tour_ke.js). Nowhere else.
     15-1 THE WEAVERS' SONG (keSimon, new to the game): up in the acacia crowns ABOVE the level, reached only from a
          wildebeest's back at the top of its leap over the tall thicket (a coin trail goes up off the leap). Walk
          into the weaver colony's hanging nest at the end of the canopy run. Inside: the weavers sing a tune on
          four nests; step on the woven mats in the same order. Prize: a 1UP. Out: a hole in the floor drops you
          back into the level past the river.
     15-2 THE MEERKAT BURROWS (doors, re-skinned): a ledge out of sight above the cliff that only the giraffe's
          head reaches if you keep holding UP past the obvious stop (a coin trail climbs on above). Inside: which
          burrow goes where? The hidden exit to 15-6 is in one of them. Out: the way you came, or the secret gate.
     15-3 FEATHER DASH (rush, re-skinned): ride the rising skein to the top of its route and hop off onto a reed
          ledge up out of sight; walk into the reed screen. Grab six flamingo feathers before the clock runs out.
          Out: a door that drops you back on the shore past the lake.
     15-4 DUNG BALL GOLF (keGolf, new to the game): one gully on the noon plain has cool mist puffing up out of it:
          drop in. Push the dung beetle's ball into the hole; jump into it to chip it over the rocks. Prize: a
          star. Out: a door up onto the plain on the far side of the gullies.
     15-5 THREE OSTRICH EGGS (shell, re-skinned): the one plain door, a termite mound by the lead-in. A secretary
          bird shuffles three eggs: stomp the one with the prize. Out: the way you came.
     15-6 BOP-A-MEERKAT (whack, re-skinned): a root-tangled plug at the end of a tunnel is a side burrow: walk into
          it. Bop eight meerkat pups as they pop up (they giggle). Out: a chute up onto the surface further along.
   ============================================================ */
(function () {
const C = Tour.countries.ke; if (!C) return;
const KK = Tour.keKit, INK = KK.INK;

/* ---------------- the rooms' own looks (no two rooms share a backdrop) ---------------- */
const roomPainters = {
  // inside the weaver colony: woven grass in a criss-cross, light through the weave
  keWeaveWall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = shade(L.color, 0.18); ctx.lineWidth = 3;
    for (let x = -H; x < BG_W; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke(); }
    ctx.strokeStyle = shade(L.color, -0.14); for (let x = 0; x < BG_W + H; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - H, H); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,240,170,0.25)'; for (let k = 0; k < 30; k++) { ctx.beginPath(); ctx.arc(rng() * BG_W, rng() * H, 2 + rng() * 3, 0, TAU); ctx.fill(); }
  },
  // a reed bed: tall stems, pink light from the lake
  keReedWall(ctx, L, rng, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffc8d8'); g.addColorStop(1, L.color); ctx.fillStyle = g; ctx.fillRect(0, 0, BG_W, H);
    for (let k = 0; k < 120; k++) { const x = rng() * BG_W, h = 120 + rng() * (H - 120); ctx.strokeStyle = k % 3 ? shade('#7a9a4a', -0.1 * (k % 2)) : '#5a7a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, H); ctx.quadraticCurveTo(x + 6, H - h / 2, x + rng() * 10 - 5, H - h); ctx.stroke(); if (k % 4 === 0) { ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x - 3, H - h - 10, 6, 18); } }
  },
  // a kopje cave: big rounded granite blocks, a seep of water down one wall
  keStoneWall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let y = 0; y < H; y += 46) for (let x = (y / 46) % 2 ? -30 : 0; x < BG_W; x += 64) { ctx.fillStyle = shade(L.color, (rng() - 0.5) * 0.18); rr(ctx, x + 3, y + 3, 58, 40, 14); ctx.fill(); }
    ctx.fillStyle = 'rgba(120,200,255,0.35)'; for (let k = 0; k < 3; k++) { const x = 100 + k * 340; ctx.fillRect(x, 0, 6, H); }
  },
  // inside a termite mound: clay with ventilation tunnels
  keMoundWall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = shade(L.color, -0.25); ctx.lineWidth = 10; ctx.lineCap = 'round';
    for (let k = 0; k < 9; k++) { let x = rng() * BG_W, y = H; ctx.beginPath(); ctx.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (rng() - 0.5) * 80; y -= 40 + rng() * 40; ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.fillStyle = shade(L.color, 0.12); for (let k = 0; k < 40; k++) { ctx.beginPath(); ctx.arc(rng() * BG_W, rng() * H, 2 + rng() * 2, 0, TAU); ctx.fill(); }
  }
};
Object.assign(BGPaint, roomPainters);
const roomTheme = (base, o) => Object.assign({}, THEMES.ke_den, base, o);
Object.assign(THEMES, {
  ke_weave: roomTheme({ ground: KK.groundOf('#d8b860', '#f0d890', '#a8803a', '#7a5a24', '#f0d080'), semi: KK.acaciaSemi('#c8a850', '#8a6a2a') }, {
    name: 'The Weaver Colony', sky: ['#a8803a', '#c8a050', '#e8c878'], horizonGlow: '#ffe8a0', layers: [{ kind: 'keWeaveWall', color: '#b8903e', base: 400, f: 0.12 }], fog: '#e8c878', darkness: 0.06, decor: [] }),
  ke_reeds: roomTheme({ ground: KK.groundOf('#e8d0c0', '#ffffff', '#a8786a', '#7a5048', '#f0d8c8'), semi: KK.acaciaSemi('#8aaa4a', '#5a7a2a') }, {
    name: 'The Reed Bed', sky: ['#e898b0', '#f0b8c8', '#ffd8e0'], horizonGlow: '#ffd8e0', layers: [{ kind: 'keReedWall', color: '#e898b0', base: 400, f: 0.14 }], fog: '#ffd8e0', darkness: 0, decor: [] }),
  ke_kopje: roomTheme({ ground: KK.groundOf('#8a9a8a', '#b8c8b8', '#6a6a6a', '#4a4a4a', '#a8b8a8'), semi: KK.rootSemi, hard: KK.kopjeHard }, {
    name: 'The Cool Kopje', sky: ['#2a3a48', '#3a4a58', '#4a5a68'], horizonGlow: '#8ac8e8', layers: [{ kind: 'keStoneWall', color: '#5a6470', base: 400, f: 0.12 }], fog: '#8ac8e8', darkness: 0.1, decor: [] }),
  ke_mound: roomTheme({ ground: KK.groundOf('#c8683a', '#e8885a', '#8a3a18', '#5a2008', '#e8885a'), semi: KK.rootSemi, brick: KK.clayBrick }, {
    name: 'Inside the Termite Mound', sky: ['#6a2a12', '#8a3a1a', '#a84a24'], horizonGlow: '#e8885a', layers: [{ kind: 'keMoundWall', color: '#a84a24', base: 400, f: 0.12 }], fog: '#e8885a', darkness: 0.12, decor: [] }),
  ke_sand: roomTheme({ ground: KK.groundOf('#e8c878', '#fff0b0', '#c8904a', '#a8703a', '#f0d890'), semi: KK.rootSemi }, {
    name: 'The Nursery Burrow', sky: ['#8a5a2a', '#a8703a', '#c8904a'], horizonGlow: '#ffe0a0', layers: [{ kind: 'keWarrenWall', color: '#a86a3a', base: 400, f: 0.15 }], fog: '#ffe0a0', darkness: 0.08, decor: ['kePups'] })
});

/* ---------------- walk-in ways (a portal with walkIn: walking into it is enough; no UP, no door shown) ---------------- */
{
  const P = Portal.prototype, t0 = P.touchPlayer, d0 = P.draw;
  P.touchPlayer = function (p) {
    if (!(this.s && this.s.walkIn)) return t0.call(this, p);
    this.near = true;
    if (p.dead || p.state !== 'play' || this.g.fade > 0) return;
    // a walk-in way takes Brady when he walks INTO it (on his feet, moving)
    if (p.onGround && Math.abs(p.vx) > 0.5 * TS) this.g.enterPortal(this);
  };
  P.draw = function (ctx) {
    if (!(this.s && this.s.walkIn)) return d0.call(this, ctx);
    DoorArt.draw(ctx, this.cx, this.y + this.h, this.s.look || 'keNestHole', this.t, false);
  };
}
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'keNestHole') {
      // the weaver colony's biggest nest, hanging low off the canopy: a woven ball with an entrance spout
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 74); ctx.lineTo(x, y - 60); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#d8b860'; ctx.beginPath(); ctx.ellipse(x, y - 34, 22, 28, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#a8883a'; ctx.lineWidth = 1.4; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x, y - 34, 22 - Math.abs(k) * 4, 28, 0, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#2a1a08'; ctx.beginPath(); ctx.ellipse(x, y - 8, 9, 8, 0, 0, TAU); ctx.fill();
      ctx.restore(); return;
    }
    if (look === 'keReedGap') {
      // a screen of tall reeds (they part a little in the breeze)
      ctx.save(); ctx.lineCap = 'round';
      for (let k = -3; k <= 3; k++) { const sw = Math.sin(t * 1.6 + k) * 2, h = 62 + (k * 7 + 21) % 14; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + k * 5, y); ctx.lineTo(x + k * 5 + sw, y - h); ctx.stroke(); ctx.strokeStyle = k % 2 ? '#8aaa4a' : '#6a8a3a'; ctx.lineWidth = 2.4; ctx.stroke(); if (k % 2 === 0) { ctx.fillStyle = '#7a4a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; rr(ctx, x + k * 5 + sw - 3, y - h - 4, 6, 14, 3); ctx.fill(); ctx.stroke(); } }
      ctx.restore(); return;
    }
    if (look === 'keRootWall') {
      // a curtain of roots over the plug's face
      ctx.save(); ctx.strokeStyle = '#c8905a'; ctx.lineWidth = 2.4;
      for (let k = 0; k < 7; k++) { const rx = x + 8 + k * 2.4, sw = Math.sin(t + k) * 1.5; ctx.beginPath(); ctx.moveTo(rx, y - 4 * TS); ctx.quadraticCurveTo(rx + 4 + sw, y - 2 * TS, rx - 2, y - 4); ctx.stroke(); }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the props the reused kinds dress up in ---------------- */
if (typeof TourRoomCritters !== 'undefined') {
  TourRoomCritters.LOOKS.meerkat = { body: '#c8a070', belly: '#f0dcc0', ear: 'round', nose: '#2a1a1a', mask: true };
  TourRoomCritters.LOOKS.secretary = { body: '#c8ccd4', belly: '#f4f4f0', ear: 'tufts', beak: '#e8783a' };
  TourRoomCritters.CUPS.egg = { body: '#f4ecd8', band: '#d8c8a0', w: 30, h: 32, round: true };
}
if (typeof TourMaze !== 'undefined') TourMaze.addKeys({ tokFeather: { name: 'FEATHER', col: '#ff8ab0', toast: 'FEATHER!', icon: (c, x, y) => { c.save(); c.rotate(-0.5); c.fillStyle = '#ff8ab0'; c.beginPath(); c.ellipse(x, y, 4, 11, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 10); c.lineTo(x, y + 12); c.stroke(); c.restore(); } } });

/* ================= keSimon: THE WEAVERS' SONG (a call-and-answer tune on four nests) =================
   Four woven mats on the floor, a nest hanging over each with a weaver in it. The weavers sing a tune: each note
   lights a nest (its own colour, shape and pitch). Then Brady steps on the mats in the same order. A wrong mat:
   the weavers squabble and sing it again. Four notes the first time; the prize cage opens on the right tune. */
const NOTE = [1.0, 1.26, 1.5, 1.78];
TourRooms.def('keSimon', {
  title: 'THE WEAVERS\' SONG', rule: 'LISTEN TO THE WEAVERS, THEN HOP ON THE MATS IN THE SAME ORDER', need: 'SING THE WEAVERS\' SONG FIRST!',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 30 + K.eastW(keep, o), g = K.room(W), Y = K.Y;
    const x0 = g.west(keep) + 2, x1 = K.east(g, keep, A, o);
    const span = x1 - x0 - 1, pads = [];
    for (let k = 0; k < 4; k++) pads.push(x0 + Math.round(span * (k + 0.5) / 4));
    g.data.pads = pads; g.data.len = o.len || 4;
    // a row of coins high over the mats (the room's own little bonus: hop for them between tunes)
    g.coins(pads[1], pads[2], 3);
    g.winSpot(A.id, pads[3], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.phase = 'ready'; R.seq = null; R.lit = -1; } },
  update(play, dt, A, R, kit) {
    const D = kit.data, p = play.player;
    if (R.won) { R.lit = -1; return; }
    R.pt = (R.pt || 0) + dt;
    if (R.phase === 'ready') { if (TourRoomKit.inside(play, A, R)) { R.phase = 'show'; R.pt = -0.6; if (!R.seq) { R.seq = []; while (R.seq.length < D.len) { const n = Math.floor(Math.random() * 4); if (n !== R.seq[R.seq.length - 1]) R.seq.push(n); } } R.step = 0; } return; }
    if (R.phase === 'show') {
      // one note every 0.75 s: lit for 0.55 s
      const k = Math.floor(R.pt / 0.75), f = R.pt - k * 0.75;
      R.lit = k >= 0 && k < R.seq.length && f < 0.55 ? R.seq[k] : -1;
      if (k >= 0 && k < R.seq.length && f < dt * 1.5 && R.noted !== k) { R.noted = k; Sound.play('select', { vol: 0.5, pitch: NOTE[R.seq[k]] }); }
      if (k >= R.seq.length) { R.phase = 'play'; R.step = 0; R.on = -1; R.lit = -1; R.noted = -1; play.toast('YOUR TURN: HOP ON THE MATS!'); R.wasGround = true; }
      return;
    }
    if (R.phase === 'play') {
      // which mat he stands on (on his feet, on the floor row)
      // a mat counts when Brady LANDS on it (a hop, like a drum): walking across the others does not play them
      const landed = p.onGround && !R.wasGround, on = landed && Math.floor((p.y + p.h - 1) / TS) === TourRoomKit.Y ? D.pads.findIndex(x => Math.abs(p.cx - (x * TS + TS / 2)) < 24) : -1;
      R.wasGround = p.onGround;
      if (on >= 0) {
        R.lit = on; R.litT = 0.4; Sound.play('select', { vol: 0.6, pitch: NOTE[on] });
        if (on === R.seq[R.step]) { R.step++; play.parts.text(D.pads[on] * TS + TS / 2, TourRoomKit.Y * TS - 20, '♪', '#ffe28a'); if (R.step >= R.seq.length) { TourRooms.win(play, A, R, { text: 'WHAT A SONG!', coins: 6 }); } }
        else { R.phase = 'oops'; R.pt = 0; TourRoomKit.raspberry(play, 'SQUAWK! WRONG NOTE'); }
      }
      if (R.litT > 0) { R.litT -= dt; if (R.litT <= 0) R.lit = -1; }
      return;
    }
    if (R.phase === 'oops') { R.lit = -1; if (R.pt > 1.4) { R.phase = 'show'; R.pt = -0.4; R.tries = (R.tries || 0) + 1; } }
  },
  draw(play, ctx, A, R, kit) {
    const D = kit.data, t = play.t, Y = TourRoomKit.Y;
    for (let k = 0; k < 4; k++) {
      const x = D.pads[k] * TS + TS / 2, fy = (Y + 1) * TS, lit = R.lit === k, S = TourRoomArt.SYMS[k];
      // the woven mat on the floor, with its symbol
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = lit ? S.col : '#c8a850'; ctx.beginPath(); ctx.ellipse(x, fy - 3, 22, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); TourRoomArt.sym(ctx, k, x, fy - 3, 4); ctx.restore();
      // the nest overhead on its string, the weaver singing out of it
      const ny = 6 * TS + Math.sin(t * 2 + k) * 2;
      ctx.save(); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 2 * TS); ctx.lineTo(x, ny - 18); ctx.stroke();
      if (lit) { ctx.fillStyle = 'rgba(255,240,150,0.5)'; ctx.beginPath(); ctx.arc(x, ny, 30, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#d8b860'; ctx.beginPath(); ctx.ellipse(x, ny, 16, 19, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd82a'; ctx.beginPath(); ctx.arc(x, ny + 14 + (lit ? 4 : 0), 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 2, ny + 13 + (lit ? 4 : 0), 1.6, 0, TAU); ctx.fill();
      if (lit) { ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(x + 6, ny + 14); ctx.lineTo(x + 13, ny + 12); ctx.lineTo(x + 6, ny + 18); ctx.closePath(); ctx.fill(); }
      TourRoomArt.sym(ctx, k, x, ny - 2, 5);
      ctx.restore();
    }
    if (!R.won && R.phase === 'play') TourRooms.counter(play, ctx, R.step || 0, (R.seq || []).length, (c, x, y) => { c.fillStyle = '#ffd82a'; c.beginPath(); c.arc(x, y, 10, 0, TAU); c.fill(); });
    if (!R.won && R.phase === 'show') TourRooms.hudText(play, ctx, 'LISTEN...', '#ffe28a', 14);
  }
});

/* ================= keGolf: DUNG BALL GOLF (push a dung ball into the hole) =================
   The dung beetle's ball sits at the left; the hole is at the right, past two low rocks. Walking into the ball
   rolls it; jumping just as he reaches it chips it up and over a rock. It never gets lost: off a wall it
   rolls back. In the hole: the beetle dances and the prize cage opens. */
class KeDungBall extends Ent {
  constructor(g, s) { super(g, s, 26, 26); this.hx = this.x; this.hy = this.y; this.spin = 0; this.vx = 0; this.vy = 0; this.back = true; this.isBall = true; this.chipT = 0; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player, A = g.area;
    if (this.sunk) { this.y = approach(this.y, this.sinkY, 60 * dt); return; }
    if (this.chipT > 0) this.chipT -= dt;
    // Brady pushes it on the ground, chips it in the air
    if (p && !p.dead && overlap(p, { x: this.x - 6, y: this.y - 4, w: this.w + 12, h: this.h + 4 })) {
      const d = p.cx < this.cx ? 1 : -1;
      // jumping as he reaches it (on the way up, feet still low) chips it high; walking into it rolls it
      if (!p.onGround && p.vy < 0 && this.chipT <= 0 && p.y + p.h > this.y - 2 && this.onGround) { this.vx = d * 6 * TS; this.vy = -14 * TS; this.chipT = 0.6; Sound.play('kick', { vol: 0.6 }); g.parts.text(this.cx, this.y - 10, 'CHIP!', '#ffe28a'); }
      else if (p.onGround && overlap(p, this)) { this.vx = d * Math.max(Math.abs(p.vx) * 1.2, 4 * TS); this.x = d > 0 ? Math.max(this.x, p.x + p.w) : Math.min(this.x, p.x - this.w); }
    }
    this.vy = Math.min(this.vy + PHYS.gDown * 0.6 * dt, 14 * TS);
    const vx0 = this.vx;
    moveBody(this, A, dt, { semis: true });
    if (this.hitWall) this.vx = -vx0 * 0.5;
    if (this.onGround) this.vx = approach(this.vx, 0, 3.5 * TS * dt);
    this.spin += this.vx * dt / 13;
    // in the hole?
    const H = A.roomKit && A.roomKit.data && A.roomKit.data.hole;
    if (H && this.onGround && Math.floor(this.cx / TS) >= H[0] && Math.floor(this.cx / TS) <= H[1] && Math.floor((this.y + this.h + 2) / TS) === H[2] + 1) { this.sunk = true; this.sinkY = this.y + 6; this.vx = 0; }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.cy; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#7a5a34'; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5a3e20'; ctx.lineWidth = 1.6; for (let k = 0; k < 3; k++) { const a = this.spin + k * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 2.6, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
}
ENTITY_TYPES.keDungBall = KeDungBall;
TourRooms.def('keGolf', {
  title: 'DUNG BALL GOLF', rule: 'ROLL THE BEETLE\'S BALL INTO THE HOLE. JUMP AS YOU REACH IT TO CHIP IT OVER A ROCK', need: 'SINK THE BALL FIRST!',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 34 + K.eastW(keep, o), g = K.room(W), Y = K.Y;
    const x0 = g.west(keep) + 1, x1 = K.east(g, keep, A, o);
    // the ball's tee, two low rocks, the hole (a dip one tile deep, two wide) near the right
    const hx = x1 - 4;
    g.put(hx, Y + 1, '.'); g.put(hx + 1, Y + 1, '.');
    g.put(x0 + 3, Y, g.L(['spawn', 'keDungBall', {}]));
    const r1 = x0 + Math.round((hx - x0) * 0.35), r2 = x0 + Math.round((hx - x0) * 0.7);
    g.put(r1, Y, 'H'); g.put(r2, Y, 'H'); g.put(r2 + 1, Y, 'H');
    g.data.hole = [hx, hx + 1, Y + 1];
    // a ledge with coins over the course
    g.hline(r1 + 2, r2 - 2, 6, '-'); g.coins(r1 + 2, r2 - 2, 5);
    g.winSpot(A.id, hx + 2, Y);
    g.dress(keep, [x0 + 1], Y);
    return g;
  },
  enter(play, A, R, kit) {
    if (R.won) return;
    // a fresh ball on the tee each visit
    const b = play.entities.find(e => e.isBall);
    if (b) { b.sunk = false; b.x = b.hx; b.y = b.hy; b.vx = b.vy = 0; }
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const b = play.entities.find(e => e.isBall);
    if (b && b.sunk) TourRooms.win(play, A, R, { text: 'HOLE IN ONE! (ISH)', coins: 6 });
  },
  draw(play, ctx, A, R, kit) {
    const H = kit.data.hole, x = (H[0] + 1) * TS, y = (H[2]) * TS, t = play.t;
    // the flag in the hole and the beetle waiting by it (it dances when the ball goes in)
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y - 54); ctx.stroke();
    ctx.fillStyle = '#ff5a3a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y - 54); ctx.lineTo(x + 22 + Math.sin(t * 6) * 3, y - 46); ctx.lineTo(x, y - 38); ctx.closePath(); ctx.fill(); ctx.stroke();
    const bx = x + 2.5 * TS, hop = R.won ? Math.abs(Math.sin(t * 8)) * 10 : 0;
    ctx.fillStyle = '#2a3a2a'; ctx.beginPath(); ctx.ellipse(bx, y - 8 - hop, 11, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6ac87a'; ctx.beginPath(); ctx.ellipse(bx - 3, y - 11 - hop, 4, 2, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bx - 8, y - 8 - hop, 2, 0, TAU); ctx.fill();
    ctx.restore();
  }
});
// the room counts for the hats test: the ball is a prop
try { if (window.BRADY_TOUR) window.BRADY_TOUR.keSecrets = { NOTE }; } catch (e) { /* not in a browser */ }
})();
