/* ============================================================
   The Netherlands (world 8): the levels in the v2 format
   (LEVEL_OVERHAUL.md §2 "World 8", §3.2 graph). Loads after
   29_tour_nl.js (the look, the cast, the boss) and adds, with
   Tour.amend: the stamps, the country looks for library objects,
   the set pieces of the overhaul, the Souvenir Stand De Winkel,
   the map graph and all six levels. 8-4 keeps the hidden exit to
   Antarctica (the skate hut's fake back wall).
   ============================================================ */
(() => {
const C = Tour.countries.nl;
if (!C) return;
const K = TourKit;
const TULIP = ['#e8322a', '#ffd23a', '#ff6ab8', '#ff8a1a', '#b84aff', '#ffffff'];

// rows for a stamp: walls left and right, ground from the floor row down, a ceiling unless opts.open;
// marks = [[x, y, 'text'], ...] written into the rows
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

/* ---------------- pieces ---------------- */
// 8-1's water: the polder canals' level is one valve group (group 1) between LOW and HIGH (rows below the quay line)
const POLDER = { low: 23, high: 18 };   // four rows of sky over the old polder (the dikes of the drawbridge, 8-1's Pupo obstacle)
const P = {
  // a polder canal: a channel dug into the quay, too deep to climb out of at low water; a valve wheel on its bed
  // floods it again (so it is never a trap). At high water Brady swims across. { w, door, back, gold, valve: true }
  canal(st, o) {
    const B = st.B, x = st.x, w = o.w || 7, bed = st.gy + 4;
    st.floor(x, x + 1);
    for (let xx = x + 2; xx <= x + 1 + w; xx++) { B.clearCol(xx, 0, B.H - 1); B.fill(xx, bed, xx, B.H - 1, T.GROUND); }
    B.decorAt('nlCanalWall', x + 2, bed, 0);
    st.coins(x + 3, x + w, bed - 2);
    if (o.valve !== false) { const vx = x + 2 + Math.floor(w / 2); B.switchAt(1, vx, bed - 1); B.spawn('toggleSwitch', vx, bed - 1, { g: 1, kind: 'valve' }); }
    if (o.door) { const dx = x + w; B.spawn('portal', dx, bed - 1, { kind: 'door', look: 'nlPumpDoor', targetRef: o.door }); if (o.back) B.anchor(o.back, dx - 2, bed - 1); }
    if (o.gold) st.gold(x + 3, bed - 2, o.gold);
    st.floor(x + 2 + w, x + 4 + w);
    return x + 5 + w;
  },
  // the valve on the quay that sets the polder's water level (group 1)
  pump(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 4);
    B.toggle(1, [], [], { kind: 'water', low: POLDER.low, high: POLDER.high });
    B.switchAt(1, x + 2, st.gy - 1); B.spawn('toggleSwitch', x + 2, st.gy - 1, { g: 1, kind: 'valve' });
    B.decorAt('nlPumpHouse', x + 2, st.gy, 0);
    B.spawn('sign', x + 4, st.gy - 1, { text: 'TURN THE VALVE (THROW) TO FILL OR EMPTY THE CANALS' });
    return x + 5;
  },
  // a headline enemy with a sign the first time it appears: { kind, text, n }
  meet(st, o) {
    const x = st.x, n = o.len || 10; st.floor(x, x + n - 1);
    st.sign(x + 1, o.text);
    for (let k = 0; k < (o.n || 1); k++) st.enemy(o.kind, x + 4 + k * 3, st.gy);
    st.coins(x + 3, x + n - 2, st.gy - 3);
    return x + n;
  },
  /* ---- 8-2 the auction ---- */
  // trolley belts carrying tulip crates: { n, dir }
  trolleys(st, o) {
    const B = st.B, x = st.x, n = o.n || 2; let xx = x;
    st.floor(xx, xx + 1); xx += 2;
    for (let k = 0; k < n; k++) {
      const dir = (o.dir || 1) * (k % 2 ? -1 : 1), len = 6;
      st.floor(xx, xx + len - 1); for (let q = 0; q < len; q++) B.set(xx + q, st.gy, dir > 0 ? T.CONV_R : T.CONV_L);
      B.decorAt('nlTrolley', xx + 2, st.gy, k); B.decorAt('nlTrolley', xx + 4, st.gy, k + 3);
      st.coins(xx + 1, xx + len - 2, st.gy - 3);
      xx += len;
      if (k < n - 1) { st.pit(xx, xx + 1); xx += 2; }
    }
    st.floor(xx, xx + 1);
    return xx + 2;
  },
  // the auction clock: a giant clock face whose hand sweeps round over the floor: { len, speed, gold }
  clock(st, o) {
    const x = st.x, len = o.len || 3; st.floor(x, x + 10);
    st.B.spawn('sweeper', x + 5, st.gy - len - 1, { len, speed: o.speed || 1.1, look: 'nlAuctionClock' });
    st.B.fill(x + 5, st.gy - len - 1, x + 5, st.gy - 1, T.EMPTY);
    if (o.gold) st.gold(x + 8, st.gy - 4, o.gold);
    st.coins(x + 1, x + 3, st.gy - 2); st.coins(x + 7, x + 9, st.gy - 2);
    return x + 11;
  },
  // a stack of tulip crates to climb: { h }
  crates(st, o) {
    const B = st.B, x = st.x, h = o.h || 3; st.floor(x, x + 5);
    for (let k = 0; k < h; k++) B.prop('nlCrate', x + 1 + (k % 2), st.gy - 1 - k, 2, 1, 'body', { seed: k });
    st.coins(x + 1, x + 3, st.gy - h - 2);
    return x + 6;
  },
  // the cold room's door, with cold mist creeping out (a curtain look): { to, back }
  coldDoor(st, o) { return Tour.pieces.secretDoor(st, { to: o.to, look: 'curtain', skin: 'nlColdMist', back: o.back }); },
  /* ---- 8-3 the bike lane ---- */
  // the starting line: the gull on its cargo bike (the rival)
  startLine(st, o) {
    const x = st.x; st.floor(x, x + 9); st.B.decorAt('nlStartLine', x + 2, st.gy, 0);
    return Tour.pieces.rival(Object.assign(st, { x: x + 2 }), { speed: o.speed || 5.6, type: 'nlCargoGull', name: 'GULL' });
  },
  /* ---- 8-4 the frozen canals ---- */
  // a koek-en-zopie stall whose lantern relights Brady's light
  zopie(st, o) {
    const x = st.x; st.floor(x, x + 10); st.decor('nlStall', x + 5);
    st.x = x + 7; Tour.pieces.lantern(st, { kind: 'relight', look: 'nlStallLantern' }); st.x = x;
    st.semi(x + 2, x + 6, st.gy - 4); st.coins(x + 2, x + 6, st.gy - 6);
    if (o.gold) st.gold(x + 4, st.gy - 7, o.gold);
    return x + 11;
  },
  // a skating rink under the lamps with a snowman on it: { n, snowman }
  rink(st, o) { return Tour.pieces['nl.skate'](st, o); },
  /* ---- 8-6 the windmill row ---- */
  // a windmill whose sails turn the other way once the wind reverses: { gold, reverse, speed }
  mill(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = 11, cx = x + 4, cy = st.gy - 5, r = 3.5, sp = (o.speed || 0.8) * (o.reverse ? -1 : 1);
    st.pit(x, x + span - 1);
    st.B.prop('nlMill', cx + 1, cy + 1, 2, st.gy - cy - 1 + 3, 'none', {});
    for (let k = 0; k < 4; k++) st.spawn('mplat', cx, cy, { pw: 3, orbit: r * TS, speed: sp, phase: k * Math.PI / 2 / Math.abs(sp), skin: 'nlSail' });
    for (let a = 0; a < 24; a++) { const th = a / 24 * TAU, gx = Math.round(cx + Math.cos(th) * r), gy2 = Math.round(cy + 1 + Math.sin(th) * r); for (let q = 0; q <= 2; q++) st.B.ghosts.push([gx + q, gy2]); }
    st.coins(cx, cx + 2, cy - 5);
    if (o.gold) st.gold(cx + 1, cy - 6, o.gold);
    if (o.reverse) st.B.decorAt('nlWindSock', x + span, st.gy, 1);
    x += span; st.floor(x, x + 2); return x + 3;
  },
  // the last mill: a door into it (the molen room): { to, back }
  millDoor(st, o) {
    const x = st.x; st.floor(x, x + 7);
    st.B.prop('nlMill', x + 3, st.gy - 6, 2, 6, 'none', {});
    st.B.spawn('portal', x + 4, st.gy - 1, { kind: 'door', look: 'nlMillDoor', targetRef: o.to });
    if (o.back) st.B.anchor(o.back, x + 7, st.gy - 1);
    return x + 8;
  }
};

/* ---------------- Pupo in the Netherlands (docs/design/PUPO.md §4.2, §4.3) ---------------- */
const NLINK = '#1c1426', WHITE = '#f4f0e6', SEA_WIND = -330;   // the sea wind and the sluice current, px/s (faster than Brady runs or Pupo swims)
const PP = {
  // a Nap Box on its own bit of quay
  napQuay(st, o) { const x = st.x; st.floor(x, x + 2); st.B.set(x + 1, st.gy - 1, T.QBLOCK); st.B.item(x + 1, st.gy - 1, 'pupo'); st.B.spawn('napBox', x + 1, st.gy - 1, {}); return x + 3; },
  /* 8-1: the first houseboat, moored in a short canal: its deck is a stretch of quay with Pupo's Nap Box on it (a
     cabin with flower pots behind, the hull down in the canal) */
  houseboat(st, o) {
    const B = st.B, x = st.x, gy = st.gy, w = 7, bed = gy + 4;
    st.floor(x, x + 1);
    for (let xx = x + 2; xx < x + 2 + w; xx++) { B.clearCol(xx, 0, B.H - 1); B.fill(xx, bed, xx, B.H - 1, T.GROUND); B.set(xx, gy, T.HARD); B.setHide(xx, gy, 1); }
    B.prop('nlHouseboat', x + 2, gy - 3, w, 6, 'none', {});
    B.set(x + 4, gy - 1, T.QBLOCK); B.item(x + 4, gy - 1, 'pupo'); B.spawn('napBox', x + 4, gy - 1, {});
    st.floor(x + 2 + w, x + 3 + w);
    return x + 4 + w;
  },
  /* 8-1's Pupo obstacle, The Drawbridge Chain: the big canal runs between two dikes, and its drawbridge is stuck up.
     The sea wind howls down the canal (a headwind over it, from the top of the sky to just over the deck) and the
     sluice current races through it (in the water, or along the dry bed at low water): no jump, sock, bean puff, glide
     or swim gets across, and the far dike is too high to climb out of the canal. The pull chain hangs from the white
     gantry out over the water, a wooden clog on the end for a counterweight: Pupo pulls it (Action) and both leaves
     come down (toggle group g: one-way decks at dike level); the two herons on the far dike are not pleased. Pulling it
     again lifts it. Steps on the near side of the canal: whoever falls in is carried back to them by the current, and
     climbs out. The wind leaves a band just over the deck, so walking across is calm. { w: one leaf's length, g } */
  pupoBridge(st, o) {
    const B = st.B, x = st.x, gy = st.gy, L = o.w || 6, g = o.g || 3, d = gy - 4, c0 = x + 9, c1 = c0 + 2 * L - 1, w = c1 - c0 + 1, bed = gy + 4, beam = d - 4;
    // up the near dike: two steps, then the dike top
    st.floor(x, x + 1); B.ground(x + 2, x + 2, gy - 2); B.ground(x + 3, c0 - 1, d);
    st.sign(x + 5, 'THE DRAWBRIDGE IS STUCK UP AND THE SEA WIND HOWLS DOWN THE CANAL: NO JUMPING IT! PUPO CAN PULL THE CHAIN (ACTION)', d);
    for (let xx = c0; xx <= c1; xx++) { B.clearCol(xx, 0, B.H - 1); B.fill(xx, bed, xx, B.H - 1, T.GROUND); }
    // the way out of the canal, on the near side: steps up to the dike
    B.fill(c0, d + 2, c0, bed - 1, T.GROUND); B.fill(c0 + 1, bed - 3, c0 + 1, bed - 1, T.GROUND);
    // the deck (both leaves down): one-way floors at dike level, there only while group g is on
    const leafA = [c0, d, c0 + L - 1, d, T.SEMI], leafB = [c0 + L, d, c1, d, T.SEMI];
    B.toggle(g, [], [leafA, leafB], { kind: 'bridge' });
    for (let xx = c0; xx <= c1; xx++) B.setHide(xx, d, 1);   // the leaves are drawn by their gates, never as tiles
    B.spawn('toggleGate', leafA[0], leafA[1], { g, rect: leafA, state: 'B', look: 'nlDrawbridge', hinge: -1 });
    B.spawn('toggleGate', leafB[0], leafB[1], { g, rect: leafB, state: 'B', look: 'nlDrawbridge', hinge: 1 });
    // the gantry over the canal and the chain hanging from it, three and a half tiles out over the water
    B.prop('nlBridgeFrame', c0 - 1, beam - 1, w + 2, d - beam + 1, 'none', {});
    B.spawn('pupoHandle', c0 + 3, d - 2, { g, look: 'nlBridgeChain', beamY: (beam - 1) * TS + 16, say: '...SORRY... BIRDS.', camBox: [x + 3, c1 + 7, d - 3, gy + 4, d - 6] });
    // the wind over the canal (up to 34 px over the deck) and the current in it (from the deck down)
    const z1 = B.zone(c0, 0, w, d, SEA_WIND, 0, 0, 'wind'); z1.h = d * TS - 34;
    B.zone(c0 + 1, d, w - 1, B.H - d, SEA_WIND, 0, 0, 'wind');
    B.spawn('nlCanalWind', c0, B.H - 1, { w, top: beam, gy: d });
    st.coins(c0 + 2, c1 - 2, d - 2);
    // the far dike (two herons standing on it, by the bridge end), then down again to the polder
    const f0 = c1 + 1, f1 = c1 + 7;
    B.ground(f0, f1, d); B.ground(f1 + 1, f1 + 1, gy - 2);
    B.spawn('nlHeron', f0 + 2, d - 1, { k: 0, g }); B.spawn('nlHeron', f0 + 4, d - 1, { k: 1, g });
    st.x = f1 + 2; st.floor(st.x, st.x + 1);
    return st.x + 2;
  },
  /* 8-6's Pupo bonus (a helper level): the first mill of the row has its brake on, one sail hanging straight down in
     front of it to the dike. The sail's lattice is too slick for Brady, but Pupo climbs it (Action) to the mill's stage
     (the gallery round its middle, seven rows up: far out of Brady's jump) and jumps through the ring of coins over it.
     Pupo's Nap Box waits at the foot of the mill. { h: the stage's height (rows) } */
  latticeMill(st, o) {
    const B = st.B, x = st.x, gy = st.gy, h = o.h || 7, sx = x + 8, top = gy - h;
    st.floor(x, x + 20);
    B.set(x + 2, gy - 1, T.QBLOCK); B.item(x + 2, gy - 1, 'pupo'); B.spawn('napBox', x + 2, gy - 1, {});
    B.prop('nlLatticeMill', sx - 2, top - 6, 7, h + 6, 'none', { stage: [(sx + 1) * TS, top * TS, 4 * TS], hub: [(sx + 0.5) * TS, (top - 3) * TS] });
    B.spawn('pupoClimb', sx, gy - 1, { h, side: 1, look: 'nlSailLattice', slick: 'THE SAIL IS SLIPPERY! (PUPO CAN CLIMB IT)', cam: 3.5 });
    // the stage: four tiles beside the sail's top, drawn by the mill
    for (let q = 1; q <= 4; q++) { B.set(sx + q, top, T.HARD); B.setHide(sx + q, top, 1); }
    // the ring of coins over the stage (a ring of eight round a gap, three rows over it)
    const cx = sx + 3, cy = top - 2;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) B.pickAt(cx + dx, cy + dy);
    st.sign(x + 5, 'THE OLD MILL HAS ITS BRAKE ON. PUPO CAN CLIMB ITS SAIL (ACTION) TO THE STAGE');
    // a stretch of dike before the next mill (its sails' top must not be a jump from the stage)
    st.decor('nlFlowerBox', x + 16); st.coins(x + 15, x + 19, gy - 3);
    return x + 21;
  }
};
for (const k in PP) Tour.pieces['nl.' + k] = PP[k];

// 8-1: a grey heron on the drawbridge gantry. When the bridge moves (toggle group g) it squawks, flaps up and settles
// again, glaring (they are friends, never enemies)
class NlHeron extends Ent {
  constructor(g, s) { super(g, s, 26, 40); this.x = s.x - 13 + (s.dx || 0); this.y = s.y - 40; this.hy = this.y; this.gi = s.g; this.k = s.k || 0; this.back = true; this.friendly = true; this.fly = 0; this.glare = 0; this.dir = this.k ? -1 : 1; }
  onToggle(gi) {
    if (gi !== this.gi) return;
    this.fly = 1.6; this.glare = 5;
    if (this.k === 0) this.g.parts.text(this.cx, this.hy - 14, 'KRAAK!', '#ffffff');
    else this.g.parts.text(this.cx + 8, this.hy - 4, 'KRAAK!!', '#ffffff');
  }
  update(dt) {
    this.t += dt;
    if (this.fly > 0) { this.fly -= dt; const u = 1 - this.fly / 1.6; this.y = this.hy - Math.sin(u * Math.PI) * 46; }
    else this.y = this.hy;
    if (this.glare > 0) this.glare -= dt;
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, d = this.dir, fl = this.fly > 0, flap = fl ? Math.sin(this.t * 22) : 0, bob = fl ? 0 : Math.sin(this.t * 0.9 + this.k) * 0.8;
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // legs (tucked up in flight)
    if (!fl) { ctx.strokeStyle = NLINK; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(-3, -14); ctx.lineTo(-3, 0); ctx.moveTo(3, -14); ctx.lineTo(4, 0); ctx.stroke(); ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1.4; ctx.stroke(); }
    // body: a grey teardrop, a darker wing
    ctx.fillStyle = NLINK; ctx.beginPath(); ctx.ellipse(0, -20 + bob, 12.5, 8.5, -0.25, 0, TAU); ctx.fill();
    ctx.fillStyle = '#a8b0bc'; ctx.beginPath(); ctx.ellipse(0, -20 + bob, 11, 7, -0.25, 0, TAU); ctx.fill();
    ctx.fillStyle = NLINK; ctx.beginPath(); ctx.ellipse(-2, -21 + bob - flap * 8, 10, 5 + Math.abs(flap) * 3, -0.35 - flap * 0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a7484'; ctx.beginPath(); ctx.ellipse(-2, -21 + bob - flap * 8, 8.6, 3.8 + Math.abs(flap) * 3, -0.35 - flap * 0.6, 0, TAU); ctx.fill();
    // the long S neck, the head, a black crest, the dagger beak
    ctx.strokeStyle = NLINK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(7, -25 + bob); ctx.quadraticCurveTo(14, -30 + bob, 9, -35 + bob); ctx.quadraticCurveTo(5, -39 + bob, 9, -42 + bob); ctx.stroke();
    ctx.strokeStyle = '#eef0f4'; ctx.lineWidth = 3.6; ctx.stroke();
    ctx.fillStyle = NLINK; ctx.beginPath(); ctx.ellipse(10, -43 + bob, 4.8, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#eef0f4'; ctx.beginPath(); ctx.ellipse(10, -43 + bob, 3.5, 2.8, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = NLINK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(8, -45 + bob); ctx.lineTo(1, -47 + bob); ctx.stroke();
    ctx.fillStyle = NLINK; ctx.beginPath(); ctx.moveTo(13, -45 + bob); ctx.lineTo(25, -42.5 + bob); ctx.lineTo(13, -41 + bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8b030'; ctx.beginPath(); ctx.moveTo(13.6, -44 + bob); ctx.lineTo(22.5, -42.5 + bob); ctx.lineTo(13.6, -41.8 + bob); ctx.closePath(); ctx.fill();
    // the eye: round, or a flat cross glare after the bridge has moved
    ctx.fillStyle = NLINK; if (this.glare > 0) ctx.fillRect(9, -44.6 + bob, 4, 1.6); else { ctx.beginPath(); ctx.arc(11, -43.6 + bob, 1.1, 0, TAU); ctx.fill(); }
    ctx.restore(); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  }
}
// 8-1: the sea wind down the big canal (streaks racing back over the water) and the current under it (ripples). Cheap:
// lines from the clock, no allocation
class NlCanalWind extends Ent {
  constructor(g, s) { super(g, s, (s.w || 10) * TS, TS); this.x = s.x - TS / 2; this.top = (s.top || 0) * TS; this.gyY = (s.gy || 14) * TS; this.y = this.top; this.h = this.gyY + 3 * TS - this.top; this.back = true; this.friendly = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x0 = this.x, w = this.w, t = this.t, A = this.g.area, wy = A && A.waterTop != null ? A.waterTop : this.gyY + 4 * TS;
    ctx.lineCap = 'round';
    for (let k = 0; k < 9; k++) {
      const sp = 300 + (k * 41) % 140, len = 30 + (k % 3) * 14, u = (w + 80) - ((t * sp + k * 113) % (w + 120)), yy = this.top + 10 + ((k * 53) % (this.gyY - 44 - this.top - 10));
      ctx.strokeStyle = k % 3 ? 'rgba(255,255,255,0.55)' : 'rgba(220,240,255,0.75)'; ctx.lineWidth = k % 2 ? 2 : 3;
      ctx.beginPath(); ctx.moveTo(x0 + u, yy); ctx.lineTo(x0 + u + len, yy - 2); ctx.stroke();
    }
    // the current: white ripples racing back along the water (or along the dry bed)
    const ry = Math.min(wy, this.gyY + 4 * TS - 2) + 4;
    for (let k = 0; k < 7; k++) {
      const u = (w + 40) - ((t * (360 + k * 23) + k * 97) % (w + 60)), yy = ry + (k % 3) * 8;
      ctx.strokeStyle = k % 2 ? 'rgba(255,255,255,0.7)' : 'rgba(200,236,255,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 + u, yy); ctx.quadraticCurveTo(x0 + u + 8, yy - 4, x0 + u + 16, yy); ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
}
Object.assign(ENTITY_TYPES, { nlHeron: NlHeron, nlCanalWind: NlCanalWind });

// one drawbridge leaf (white timber, railings), hinged at (hx, hy), length L px, raised by angle a (0 = flat), pointing dir
function nlLeaf(ctx, hx, hy, L, a, dir) {
  ctx.save(); ctx.translate(hx, hy); ctx.scale(dir, 1); ctx.rotate(-a);
  ctx.fillStyle = NLINK; ctx.fillRect(-2, -3, L + 4, 15);
  ctx.fillStyle = '#9a6a3a'; ctx.fillRect(0, -1, L, 11); ctx.fillStyle = '#b8844a'; ctx.fillRect(0, -1, L, 3);
  ctx.fillStyle = '#7a4e28'; for (let q = 14; q < L - 4; q += 16) ctx.fillRect(q, 0, 2, 10);
  // the white railing
  ctx.fillStyle = NLINK; ctx.fillRect(0, -22, L, 5); for (let q = 2; q < L; q += 24) ctx.fillRect(q - 1, -22, 6, 21);
  ctx.fillStyle = WHITE; ctx.fillRect(1, -21, L - 2, 3); for (let q = 2; q < L; q += 24) ctx.fillRect(q, -21, 4, 19);
  ctx.restore();
}
const nlPupoSkins = {
  // 8-1: the drawbridge (a toggle gate look): two leaves hinged at the banks, standing up or lying down across the canal
  nlDrawbridge(ctx, e, t) {
    // the leaves swing over a second of game time after each pull (the deck tiles under them are invisible)
    const on = e.solid, gt = e.g.t;
    if (e.wasOn !== on) { e.k0 = e.wasOn == null ? (on ? 1 : 0) : e.kNow; e.wasOn = on; e.chT = gt; }
    const u = Math.min(1, (gt - e.chT) / 1.1), kk = e.kNow = e.k0 + ((on ? 1 : 0) - e.k0) * u, a = (1 - easeInOut(kk)) * 1.05, left = e.s.hinge < 0;
    nlLeaf(ctx, left ? e.x : e.x + e.w, e.y + 2, e.w, a, left ? 1 : -1);
  },
  // 8-1: the pull chain (a pupoHandle look): iron links from the gantry, a wooden clog for the counterweight, the ring
  nlBridgeChain(ctx, e, t) {
    const x = e.hx, y = e.hy + e.k * 10, top = e.s.beamY || y - 120, sw = Math.sin(t * 1.4) * 1.5;
    ctx.strokeStyle = NLINK; ctx.lineWidth = 3.6;
    for (let yy = top; yy < y - 18; yy += 9) { ctx.beginPath(); ctx.ellipse(x + sw * (yy - top) / (y - top), yy + 4, (yy / 9) % 2 < 1 ? 2.6 : 1.2, 4.6, 0, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1.6;
    for (let yy = top; yy < y - 18; yy += 9) { ctx.beginPath(); ctx.ellipse(x + sw * (yy - top) / (y - top), yy + 4, (yy / 9) % 2 < 1 ? 2.6 : 1.2, 4.6, 0, 0, TAU); ctx.stroke(); }
    // the clog: yellow, pointy toe up, hanging by its heel
    const cx = x + sw, cy = y - 10;
    ctx.fillStyle = NLINK; ctx.beginPath(); ctx.ellipse(cx, cy, 13, 7.5, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f0c030'; ctx.beginPath(); ctx.ellipse(cx, cy, 11.4, 6, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c88a18'; ctx.beginPath(); ctx.ellipse(cx - 4, cy - 1.5, 4.5, 2.6, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(cx + 5, cy - 1, 2, 0, TAU); ctx.fill();
    pupoRing(ctx, cx, y + 2, 4.5);
  },
  // 8-6: the slick lattice of a stopped sail (a pupoClimb look): the stock down the middle, the lattice rungs (grip lines)
  nlSailLattice(ctx, e, t) {
    const x = e.cx, y0 = e.top - 3 * TS, y1 = e.bottom - 4, w = 26;
    ctx.fillStyle = NLINK; ctx.fillRect(x - 4, y0, 8, y1 - y0 + 3);
    ctx.fillRect(x - w / 2 - 2, y0 + TS, w + 4, y1 - y0 - TS + 2);
    ctx.fillStyle = '#c8b898'; ctx.fillRect(x - w / 2, y0 + TS + 2, w, y1 - y0 - TS - 2);
    ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 2.5, y0, 5, y1 - y0);
    ctx.fillStyle = '#5a2a1a'; for (let yy = y0 + TS + 8; yy < y1 - 2; yy += 10) ctx.fillRect(x - w / 2, yy, w, 3);
    ctx.fillRect(x - w / 2, y0 + TS + 2, 3, y1 - y0 - TS - 2); ctx.fillRect(x + w / 2 - 3, y0 + TS + 2, 3, y1 - y0 - TS - 2);
  }
};
Object.assign(Decor, {
  // 8-1: the first houseboat: a green hull in the canal, a cabin with round windows and flower pots on the deck
  nlHouseboat(ctx, x, y, t, th, d) {
    const w = d.w, x0 = x - w / 2, deck = y - 3 * TS, bob = Math.sin(t * 1.3) * 1.2;
    ctx.fillStyle = NLINK; rr(ctx, x0 + 2, deck - 2 + bob, w - 4, 2.4 * TS, 8); ctx.fill();
    ctx.fillStyle = '#2a6a4a'; rr(ctx, x0 + 4, deck + bob, w - 8, 2.4 * TS - 4, 6); ctx.fill();
    ctx.fillStyle = '#f4f0e6'; ctx.fillRect(x0 + 4, deck + 6 + bob, w - 8, 4); ctx.fillStyle = '#e8322a'; ctx.fillRect(x0 + 4, deck + 12 + bob, w - 8, 3);
    // the cabin behind the deck walkway
    const cx0 = x0 + w * 0.42, cw = w * 0.5, ch = 2.1 * TS;
    ctx.fillStyle = NLINK; rr(ctx, cx0 - 2, deck - ch - 2, cw + 4, ch + 4, 6); ctx.fill();
    ctx.fillStyle = '#e8d8b0'; rr(ctx, cx0, deck - ch, cw, ch, 5); ctx.fill();
    ctx.fillStyle = '#2a6a4a'; ctx.fillRect(cx0 - 4, deck - ch - 6, cw + 8, 7);
    ctx.fillStyle = NLINK; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx0 + 18 + k * (cw - 36) / 2, deck - ch / 2 - 4, 7.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#9ad0f0'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx0 + 18 + k * (cw - 36) / 2, deck - ch / 2 - 4, 5.5, 0, TAU); ctx.fill(); }
    for (let k = 0; k < 4; k++) { const px = cx0 + 10 + k * (cw - 20) / 3; ctx.fillStyle = '#b8642a'; ctx.fillRect(px - 4, deck - ch - 14, 8, 8); ctx.fillStyle = TULIP[k % 5]; ctx.beginPath(); ctx.arc(px, deck - ch - 17, 4, 0, TAU); ctx.fill(); }
  },
  // 8-1: the drawbridge's white gantry: a post on each bank, the beam over the canal, two bolted braces
  nlBridgeFrame(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2 + TS / 2, x1 = x + d.w / 2 - TS / 2, top = y - d.h + 10;
    for (const px of [x0, x1]) { ctx.fillStyle = NLINK; ctx.fillRect(px - 8, top - 2, 16, y - top + 2); ctx.fillStyle = WHITE; ctx.fillRect(px - 6, top, 12, y - top); ctx.fillStyle = '#c8c0b0'; ctx.fillRect(px + 2, top, 4, y - top); }
    ctx.fillStyle = NLINK; ctx.fillRect(x0 - 12, top - 6, x1 - x0 + 24, 16); ctx.fillStyle = WHITE; ctx.fillRect(x0 - 10, top - 4, x1 - x0 + 20, 12);
    ctx.fillStyle = '#c8c0b0'; ctx.fillRect(x0 - 10, top + 4, x1 - x0 + 20, 4);
    ctx.strokeStyle = NLINK; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0 + 2, top + 40); ctx.lineTo(x0 + 34, top + 6); ctx.moveTo(x1 - 2, top + 40); ctx.lineTo(x1 - 34, top + 6); ctx.stroke();
    ctx.strokeStyle = WHITE; ctx.lineWidth = 3; ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#e8322a'; ctx.fillRect(x - 26, top - 4, 52, 12); ctx.fillStyle = WHITE; ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('BRUG', x, top + 5);
  },
  // 8-6: the old mill with its brake on: a tapering tower, the stage (gallery) round its middle, the cap, three sails
  // standing still (the fourth hangs down: the lattice the Pupo strip draws)
  nlLatticeMill(ctx, x, y, t, th, d) {
    const h = d.h, top = y - h, bw = 3 * TS, hx = d.hub[0], hy = d.hub[1], x0 = hx - bw / 2, capY = hy + 10;
    ctx.fillStyle = NLINK; ctx.beginPath(); ctx.moveTo(x0 - 12, y); ctx.lineTo(x0 + 6, capY); ctx.lineTo(x0 + bw - 6, capY); ctx.lineTo(x0 + bw + 12, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a5848'; ctx.beginPath(); ctx.moveTo(x0 - 9, y); ctx.lineTo(x0 + 8, capY + 2); ctx.lineTo(x0 + bw - 8, capY + 2); ctx.lineTo(x0 + bw + 9, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a6656'; for (let yy = capY + 20; yy < y - 6; yy += 22) { const k = (yy - capY) / (y - capY) * 10; ctx.fillRect(x0 + 8 - k, yy, bw - 16 + 2 * k, 4); }
    ctx.fillStyle = '#2a5a3a'; rr(ctx, hx - 30, y - 40, 22, 40, 10); ctx.fill(); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(hx - 20, y - 36, 2, 34);
    // the cap: a dark thatched hood
    ctx.fillStyle = NLINK; ctx.beginPath(); ctx.ellipse(hx, capY, bw / 2 + 4, 24, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.ellipse(hx, capY, bw / 2 + 1, 21, 0, Math.PI, 0); ctx.fill();
    // two still sails (up and to the left: the fourth, down, is the lattice the Pupo strip draws), the hub
    for (const a of [-Math.PI / 2, Math.PI]) {
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(a);
      ctx.fillStyle = NLINK; ctx.fillRect(0, -15, 3.2 * TS, 30); ctx.fillStyle = '#c8b898'; ctx.fillRect(TS * 0.6, -13, 2.6 * TS - 2, 26);
      ctx.fillStyle = '#5a2a1a'; for (let q = TS * 0.6 + 8; q < 3.2 * TS - 2; q += 10) ctx.fillRect(q, -13, 3, 26); ctx.fillRect(0, -2.5, 3.2 * TS, 5);
      ctx.restore();
    }
    // the brake: a red-and-white shutter board lashed across the stock (the mill is stopped)
    ctx.fillStyle = NLINK; ctx.fillRect(hx + 10, hy - 8, 30, 16); ctx.fillStyle = '#e8322a'; ctx.fillRect(hx + 12, hy - 6, 13, 12); ctx.fillStyle = WHITE; ctx.fillRect(hx + 25, hy - 6, 13, 12);
    ctx.fillStyle = NLINK; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#b8a070'; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, TAU); ctx.fill();
    // the stage: a wooden gallery on struts, with a white railing
    if (d.stage) {
      const [sx, sy, sw] = d.stage;
      ctx.fillStyle = NLINK; ctx.fillRect(sx - 4, sy - 2, sw + 8, 14);
      ctx.fillStyle = '#9a6a3a'; ctx.fillRect(sx - 2, sy, sw + 4, 10); ctx.fillStyle = '#b8844a'; ctx.fillRect(sx - 2, sy, sw + 4, 3);
      ctx.strokeStyle = NLINK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sx + sw - 6, sy + 10); ctx.lineTo(sx + sw - 34, y - 2); ctx.stroke(); ctx.strokeStyle = '#7a4e28'; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.fillStyle = NLINK; ctx.fillRect(sx + sw - 2, sy - 20, 5, 20); ctx.fillStyle = WHITE; ctx.fillRect(sx + sw - 1, sy - 19, 3, 18);
    }
  }
});

/* ---------------- country looks ---------------- */
const skins = {
  nlPumpDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 20, y - 60, 40, 60); ctx.fillStyle = '#5a2a1a'; ctx.beginPath(); ctx.moveTo(x - 24, y - 60); ctx.lineTo(x, y - 74); ctx.lineTo(x + 24, y - 60); ctx.fill(); ctx.fillStyle = '#2a4a3a'; rr(ctx, x - 12, y - 48, 24, 48, 10); ctx.fill(); ctx.fillStyle = '#e8e0d0'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('GEMAAL', x, y - 63); },
  // the cold-room door at the auction: frosted plastic strips, cold mist rolling out along the floor
  nlColdMist(ctx, e, t) {
    const x0 = e.x, y0 = e.y, w = e.w, h = e.h, a = 1 - (e.part || 0) * 0.6;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x0 - 6, y0 - 10, w + 12, 10);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? 'rgba(220,240,255,0.75)' : 'rgba(190,220,240,0.75)'; const sw = Math.sin(t * 2 + k) * 2 * (1 + (e.part || 0) * 4); ctx.beginPath(); ctx.moveTo(x0 + k * w / 6, y0); ctx.lineTo(x0 + (k + 1) * w / 6, y0); ctx.lineTo(x0 + (k + 1) * w / 6 + sw, y0 + h); ctx.lineTo(x0 + k * w / 6 + sw, y0 + h); ctx.fill(); }
    ctx.restore();
    for (let k = 0; k < 4; k++) { const ph = (t * 0.4 + k / 4) % 1; ctx.fillStyle = `rgba(235,248,255,${0.35 * (1 - ph)})`; ctx.beginPath(); ctx.ellipse(x0 + w / 2 + (k % 2 ? 1 : -1) * ph * 70, y0 + h - 6, 14 + ph * 22, 6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#3a6ad8'; ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('KOELCEL ❄', x0 + w / 2, y0 - 14);
  },
  // the auction clock (a sweeper look): a big white dial with numbered lights; the hand is the hazard
  nlAuctionClock(ctx, e, t) {
    const x = e.ox, y = e.oy, R = e.len + 14;
    ctx.fillStyle = '#2a3a5a'; ctx.beginPath(); ctx.arc(x, y, R + 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    for (let k = 0; k < 20; k++) { const a = k / 20 * TAU, on = ((e.a % TAU) + TAU) % TAU > a - 0.15 && ((e.a % TAU) + TAU) % TAU < a + 0.15; ctx.fillStyle = on ? '#ff4a3a' : '#c8c0b8'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * (R - 8), y + Math.sin(a) * (R - 8), 3, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#e8322a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(e.a) * e.len, y + Math.sin(e.a) * e.len); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#2a3a5a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a3a5a'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('VEILING', x, y - R + 22);
  },
  nlStallLantern(ctx, e, t) { const x = e.cx, y = e.y + e.h, lit = e.lit !== false; ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 2, y - 46, 4, 46); ctx.fillStyle = lit ? `rgba(255,${210 + Math.sin(t * 5) * 20},120,0.95)` : '#5a4a3a'; rr(ctx, x - 7, y - 60, 14, 16, 4); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 8, y - 62, 16, 3); },
  nlMillDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#2a5a3a'; rr(ctx, x - 13, y - 44, 26, 44, 12); ctx.fill(); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 1, y - 40, 2, 38); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + 7, y - 20, 2, 0, TAU); ctx.fill(); },
  nlHutDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#8a3a2a'; ctx.fillRect(x - 26, y - 56, 52, 56); ctx.fillStyle = '#f0f8ff'; ctx.beginPath(); ctx.moveTo(x - 32, y - 54); ctx.lineTo(x, y - 74); ctx.lineTo(x + 32, y - 54); ctx.fill(); ctx.fillStyle = '#3a2016'; rr(ctx, x - 11, y - 44, 22, 44, 4); ctx.fill(); ctx.fillStyle = '#ffd890'; ctx.fillRect(x + 14, y - 40, 8, 10); ctx.fillStyle = '#ffffff'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('SCHAATS', x, y - 60); },
  nlCellarHatch(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 28, y - 6, 56, 6); ctx.fillStyle = '#8a6a44'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 26 + k * 13.5, y - 5, 11, 4); ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 3, y - 6, 6, 2); },
  nlStairsDown(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#3a2a20'; rr(ctx, x - 16, y - 56, 32, 56, 4); ctx.fill(); for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#8a6a44' : '#a87a4a'; ctx.fillRect(x - 12 + k * 1.5, y - 52 + k * 10, 24 - k * 3, 8); } ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▼', x, y - 60); },
  nlStairsUp(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#5a4030'; rr(ctx, x - 16, y - 56, 32, 56, 4); ctx.fill(); for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#a87a4a' : '#8a6a44'; ctx.fillRect(x - 12, y - 52 + k * 10, 24, 8); } ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▲', x, y - 60); }
};

Object.assign(Decor, {
  nlCanalWall(ctx, x, y) { ctx.fillStyle = 'rgba(30,50,60,0.25)'; ctx.fillRect(x - 16, y - 4, 6, 4); },
  nlPumpHouse(ctx, x, y, t) {
    ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 60, y - 70, 50, 70); ctx.fillStyle = '#5a2a1a'; ctx.beginPath(); ctx.moveTo(x - 64, y - 70); ctx.lineTo(x - 35, y - 92); ctx.lineTo(x - 6, y - 70); ctx.fill();
    ctx.fillStyle = '#e8f0f8'; ctx.fillRect(x - 52, y - 58, 12, 16); ctx.fillRect(x - 32, y - 58, 12, 16);
    ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 14, y - 34, 18, 6); ctx.fillStyle = '#3a6a8a'; for (let k = 0; k < 3; k++) { const ph = (t * 1.2 + k / 3) % 1; ctx.beginPath(); ctx.arc(x + 6 + ph * 6, y - 28 + ph * 22, 2.5, 0, TAU); ctx.fill(); }
  },
  nlTrolley(ctx, x, y, t, th, d) {
    const sd = (d && d.seed) || 0;
    ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 14, y - 6, 28, 3); ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(x - 9, y - 2, 2.5, 0, TAU); ctx.arc(x + 9, y - 2, 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8a070'; ctx.fillRect(x - 12, y - 18, 24, 12); ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1; ctx.strokeRect(x - 12, y - 18, 24, 12);
    for (let k = 0; k < 5; k++) { ctx.strokeStyle = '#3a8a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 9 + k * 4.5, y - 18); ctx.lineTo(x - 9 + k * 4.5, y - 26); ctx.stroke(); ctx.fillStyle = TULIP[(k + sd) % 5]; ctx.beginPath(); ctx.ellipse(x - 9 + k * 4.5, y - 28, 2.2, 3.2, 0, 0, TAU); ctx.fill(); }
  },
  nlCrate(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2;
    ctx.fillStyle = '#c8a070'; ctx.fillRect(x0 + 2, y - h, w - 4, h); ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 2; ctx.strokeRect(x0 + 3, y - h + 1, w - 6, h - 2);
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(x0 + 4, y - h / 2 - 1, w - 8, 2);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = TULIP[(k + d.seed) % 5]; ctx.beginPath(); ctx.ellipse(x0 + 9 + k * (w - 18) / 5, y - h + 2, 3, 4, 0, 0, TAU); ctx.fill(); }
  },
  nlStartLine(ctx, x, y) { for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#1a1a22' : '#ffffff'; ctx.fillRect(x - 6 + (k % 2) * 6, y - 2 - Math.floor(k / 2) * 6 - 60, 6, 6); } ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 8, y - 80, 3, 80); ctx.fillRect(x + 12, y - 80, 3, 80); },
  nlWindSock(ctx, x, y, t) { ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 1, y - 48, 3, 48); for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x + 1 - k * 7, y - 48 + k * 0.6); ctx.lineTo(x + 1 - (k + 1) * 7, y - 47 + (k + 1) * 0.8 + Math.sin(t * 6 + k) * 1.2); ctx.lineTo(x + 1 - (k + 1) * 7, y - 38 - (k + 1) * 0.6 + Math.sin(t * 6 + k) * 1.2); ctx.lineTo(x + 1 - k * 7, y - 38); ctx.fill(); } },
  nlCheeseRack(ctx, x, y) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 24, y - 60, 4, 60); ctx.fillRect(x + 20, y - 60, 4, 60); for (let r = 0; r < 3; r++) { ctx.fillRect(x - 24, y - 20 - r * 20, 48, 3); for (let k = 0; k < 3; k++) { ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.ellipse(x - 13 + k * 13, y - 27 - r * 20, 6, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a4a2a'; } } },
  nlSkates(ctx, x, y) { for (const s of [-1, 1]) { ctx.fillStyle = '#3a2a2a'; rr(ctx, x + s * 8 - 6, y - 16, 12, 10, 3); ctx.fill(); ctx.fillStyle = '#c8d8e8'; ctx.fillRect(x + s * 8 - 8, y - 5, 16, 2); } }
});

/* ---------------- stamps ---------------- */
const stamps = {
  // 8-1 (s): inside the pumping station: the big pump wheel, coins, the way out to the souvenir stall
  gemaal: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [8, 10, 'p'],
      [10, 4, 'o.o.o.o'], [11, 6, '-----'], [13, 4, '*'],
      [20, 7, '?'], [26, 10, 'g']
    ]),
    legend: { p: ['decor', 'nlPumpHouse'] },
    items: ['oneup'],
    doors: [{ to: 'polder@gemaalBack', look: 'nlStairsUp' }],
    gold: { '*': 'hidden' }
  },
  // 8-2 (s): the auction's cold room: frost, crates of bulbs, the secret gate to the windmill row
  koelcel: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [7, 10, 'IIIIII'], [9, 7, '-----'], [11, 5, '*'], [8, 5, 'o.o'], [14, 5, 'o.o'],
      [18, 10, 'k.k'], [26, 10, 'g']
    ]),
    legend: { k: ['decor', 'nlTrolley'] },
    doors: [{ to: 'veiling@koelBack', look: 'nlStairsUp' }],
    gold: { '*': 'hidden' }
  },
  // 8-3 (s): under the drawbridge: the bridge-keeper's cellar
  brug: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [7, 4, 'o.o.o.o.o'], [8, 6, '-------'], [12, 4, '*'],
      [20, 7, '?'], [24, 10, 'q']
    ]),
    legend: { q: ['decor', 'nlBike'] },
    items: ['star'],
    doors: [{ to: 'fietspad@brugBack', look: 'nlStairsUp' }],
    gold: { '*': 'hidden' }
  },
  // 8-4 (s): the skate-hire hut on the ice; its back wall is thin (a fake wall): behind it the icy way to Antarctica
  hut: {
    floor: 11,
    rows: room(40, 14, 11, [
      [2, 10, '@.D'], [7, 10, 'k..k'],
      [9, 4, 'o.o.o.o'], [10, 6, '-----'], [12, 4, '*'],
      [18, 7, '?'],
      [27, 1, 'H'], [27, 2, 'H'], [27, 3, 'H'], [27, 4, 'H'], [27, 5, 'H'], [27, 6, 'H'], [27, 7, 'H'], [27, 8, 'F'], [27, 9, 'F'], [27, 10, 'F'],
      [33, 10, 'g'], [30, 10, 'n']
    ]),
    legend: { k: ['decor', 'nlSkates'], n: ['spawn', 'sign', { text: 'AN ICY WIND HOWLS THROUGH THE CRACK... A SECRET WAY TO THE FAR SOUTH!' }] },
    items: ['oneup'],
    doors: [{ to: 'ijs@hutBack', look: 'nlStairsUp' }],
    gold: { '*': 'hidden' }
  },
  // 8-5 (s): the cheese cellar under the scales: racks of wheels ripening
  kelder: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [8, 10, 'r'], [22, 10, 'r'],
      [11, 4, 'o.o.o'], [11, 6, '-----'], [13, 4, '*'],
      [17, 7, '?']
    ]),
    legend: { r: ['decor', 'nlCheeseRack'] },
    items: ['power'],
    doors: [{ to: 'kaasmarkt@kelderBack', look: 'nlStairsUp' }],
    gold: { '*': 'hidden' }
  },
  // 8-6 (s): inside the last windmill: the turning shaft, sacks of flour, a postcard on the cap beam
  molen: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [7, 8, '---'], [11, 6, '---'], [15, 4, '---'], [16, 2, '*'],
      [21, 7, '?'], [6, 3, 'o.o.o']
    ]),
    items: ['oneup'],
    doors: [{ to: 'molens@molenBack', look: 'nlMillDoor' }],
    gold: { '*': 'hidden' }
  },
  // the Souvenir Stand De Winkel (a goose's corner shop)
  stand: {
    floor: 10,
    rows: room(28, 12, 10, [[2, 9, '@'], [5, 9, 'k'], [8, 9, 'q'], [11, 9, '$'], [21, 9, 'k'], [24, 9, 'G']]),
    legend: { k: ['decor', 'nlFlowerBox'], q: ['decor', 'nlBike'] }
  }
};

/* ---------------- the levels ---------------- */
/* ---------- 8-2: the auction's cold store, a puzzle of three flower tokens ----------
   Six bays, 3 x 2 (26 x 14 each): the gallery, the clock floor and the loading dock upstairs; the tulip cold room,
   the bulb sorting belts and the daffodil chiller downstairs, joined by open aisles and one staircase. Three roller
   shutters (tulip red, daffodil yellow, hyacinth blue) open with their own flower token, and each token waits behind
   another shutter: daffodil (free, on the crates) -> the daffodil shutter hides the tulip -> the tulip shutter hides
   the hyacinth (and a star) -> the hyacinth shutter opens the loading dock. Each shutter has a window that shows
   what waits behind it. */
const flower = (col, mid) => (c, x, y) => {
  c.strokeStyle = '#2a7a3a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x, y); c.stroke();
  c.fillStyle = '#3a9a4a'; c.beginPath(); c.ellipse(x + 5, y + 7, 5, 2.4, -0.5, 0, TAU); c.fill();
  c.fillStyle = col; c.beginPath(); c.moveTo(x - 8, y - 2); c.lineTo(x - 8, y - 12); c.lineTo(x - 4, y - 8); c.lineTo(x, y - 14); c.lineTo(x + 4, y - 8); c.lineTo(x + 8, y - 12); c.lineTo(x + 8, y - 2); c.quadraticCurveTo(x, y + 4, x - 8, y - 2); c.closePath(); c.fill();
  if (mid) { c.fillStyle = mid; c.beginPath(); c.arc(x, y - 6, 3, 0, TAU); c.fill(); }
};
const hyacinth = (c, x, y) => {
  c.strokeStyle = '#2a7a3a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x, y + 2); c.stroke();
  for (let k = 0; k < 9; k++) { const r = k % 3, q = Math.floor(k / 3); c.fillStyle = k % 2 ? '#5a6ae8' : '#7a8aff'; c.beginPath(); c.arc(x - 5 + r * 5, y - 12 + q * 5, 3.2, 0, TAU); c.fill(); }
};
// a token: a round auction chip with the flower on it
const chip = (col, art) => (c, x, y, t) => { c.fillStyle = '#f4f0e8'; c.beginPath(); c.arc(x, y, 15, 0, TAU); c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 13, 0, TAU); c.stroke(); c.save(); c.translate(x, y + 2); c.scale(0.8, 0.8); art(c, 0, 0, t); c.restore(); };
if (typeof TourMaze !== 'undefined') TourMaze.addKeys({
  nlTulip: { name: 'TULIP TOKEN', toast: 'TULIP TOKEN! IT OPENS THE RED SHUTTER', col: '#e8322a', icon: chip('#e8322a', flower('#e8322a')) },
  nlDaffodil: { name: 'DAFFODIL TOKEN', toast: 'DAFFODIL TOKEN! IT OPENS THE YELLOW SHUTTER', col: '#ffd23a', icon: chip('#e8b21a', flower('#ffd23a', '#ff8a1a')) },
  nlHyacinth: { name: 'HYACINTH TOKEN', toast: 'HYACINTH TOKEN! IT OPENS THE BLUE SHUTTER', col: '#6a7aff', icon: chip('#5a6ae8', hyacinth) },
  // not a key: the loading dock's exit sign, seen through the blue shutter's window
  nlDock: { name: 'EXIT', col: '#3aa86a', icon: (c, x, y) => { c.fillStyle = '#2a9a5a'; c.fillRect(x - 14, y - 9, 28, 18); c.fillStyle = '#ffffff'; c.font = `bold 9px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.fillText('EXIT', x, y + 3); } }
});
const shutter = (id, col, icon, peek, need) => ['piece', TourMaze.lock('mazeShutter', { col, icon, peek, need }), { id }];
const VEIL = {
  R: shutter('tulip', '#d8322a', 'nlTulip', 'nlHyacinth', 'THE RED SHUTTER: IT NEEDS A TULIP TOKEN'),
  Y: shutter('daffodil', '#e8b21a', 'nlDaffodil', 'nlTulip', 'THE YELLOW SHUTTER: IT NEEDS A DAFFODIL TOKEN'),
  U: shutter('hyacinth', '#4a5ad8', 'nlHyacinth', 'nlDock', 'THE BLUE SHUTTER: IT NEEDS A HYACINTH TOKEN'),
  r: ['spawn', 'key', { id: 'tulip', look: 'nlTulip' }], d: ['spawn', 'key', { id: 'daffodil', look: 'nlDaffodil' }], u: ['spawn', 'key', { id: 'hyacinth', look: 'nlHyacinth' }],
  K: ['spawn', 'sweeper', { len: 3, speed: 1.1, look: 'nlAuctionClock' }],
  k: ['piece', 'crates', { h: 4 }], t: ['decor', 'nlTrolley'],
  e: ['enemy', 'nlBulb'], w: ['enemy', 'nlClog'], m: ['enemy', 'nlBee'],
  i: ['spawn', 'sign', { text: 'AUCTION BOARD. TODAY: TULIPS (RED), DAFFODILS (YELLOW), HYACINTHS (BLUE). EACH SHUTTER OPENS WITH ITS OWN FLOWER TOKEN. PEEK THROUGH A SHUTTER\'S WINDOW TO SEE WHAT IS BEHIND IT.' }]
};
const bay = (rows, extra) => { const e = Object.assign({}, extra || {}), legend = Object.assign({}, VEIL, e.legend || {}); delete e.legend; return Object.assign({ floor: 12, rows, legend }, e); };
const veiling = {
  // upstairs, left: the buyers' gallery (the start); the tulip shutter's little vault: the hyacinth token and a star
  gallery: bay([
    '##########################',
    '#######..................#',
    '#######..................#',
    '#######......o.o.o.......#',
    '#######..................#',
    '#######.....------.......#',
    '#######..................#',
    '#.....#..................#',
    '#..?..#...?..............#',
    '#.....#...................',
    '#.....#...................',
    '#.u...R.@.i..t............',
    '##########################',
    '##########################'
  ], { items: ['star', 'power'] }),
  // upstairs, middle: the auction clock (its hand sweeps the floor), the stairs down to the sorting belts, P1
  clock: bay([
    '##########################',
    '#........................#',
    '#........................#',
    '#....o.o.o.......*.......#',
    '#........................#',
    '#...-----.......-----....#',
    '#....m...................#',
    '#........................#',
    '#.---.......K...----.....#',
    '..........................',
    '..........................',
    '.....................1D...',
    '##########################',
    '##########################'
  ], { gold: { '*': 'must' }, legend: { 1: ['anchor', 'clockStairs'] }, doors: [{ to: 'veiling@beltStairs', look: 'nlStairsDown' }] }),
  // upstairs, right: the loading dock behind the hyacinth shutter, and the way out
  dock: bay([
    '##########################',
    '#...........#............#',
    '#...........#............#',
    '#..o.o.o....#...*........#',
    '#...........#............#',
    '#..-----....#..----......#',
    '#...........#............#',
    '#...........#............#',
    '#.......m...#.....---....#',
    '.........................#',
    '.........................#',
    '....w.......U........G...#',
    '##########################',
    '##########################'
  ], { gold: { '*': 'high' } }),
  // downstairs, left: the tulip cold room: the daffodil token on top of the crates, the cold-mist door (secret)
  coldroom: bay([
    '##########################',
    '#........................#',
    '#........................#',
    '#........................#',
    '#.........o.o.o..........#',
    '#........................#',
    '#........................#',
    '#...................d....#',
    '#.....h..................#',
    '#.........................',
    '#.........................',
    '#..D9.....e.......k.......',
    '##########################',
    '##########################'
  ], { hidden: ['oneup'], legend: { 9: ['anchor', 'koelBack'] }, doors: [{ to: 'koelcel@in', look: 'nlColdMist' }] }),
  // downstairs, middle: the bulb sorting belts and the stairs up
  belts: bay([
    '##########################',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#..............*.........#',
    '#........................#',
    '#........................#',
    '#.........?..----........#',
    '..........................',
    '..........................',
    '....D2.......e............',
    '#######>>>>>>###<<<<<<####',
    '##########################'
  ], { items: ['beans'], gold: { '*': 'risky' }, legend: { 2: ['anchor', 'beltStairs'] }, doors: [{ to: 'veiling@clockStairs', look: 'nlStairsUp' }] }),
  // downstairs, right: the daffodil chiller: the yellow shutter, the tulip token behind it
  chiller: bay([
    '##########################',
    '#.............#..........#',
    '#.............#..........#',
    '#.............#..........#',
    '#..o.o.o......#...o.o.o..#',
    '#..-----......#..........#',
    '#.............#..........#',
    '#.............#..........#',
    '#.............#..........#',
    '.........................#',
    '.........................#',
    '.....w........Y.....r....#',
    '##########################',
    '##########################'
  ])
};

const levels = [
  // 8-1 SWITCH: the polder's water level
  { n: 1, name: 'Polder Pumps', mapLabel: 'Polder', arch: 'switch', theme: 'nl_polder', pupo: 'level',   // the Netherlands' Pupo level: The Drawbridge Chain
    gimmick: 'A valve wheel fills and empties the polder canals: swim across at high water, walk the canal bed at low water',
    hint: 'Turn a valve (THROW) to flood or drain the canals. Every canal bed has a valve, so you can always get out',
    postcard: 'Half of this country is below the sea, and the pumps keep it dry. Very clever pumps. ♥ C',
    enemies: [['nlBulb', 2], ['nlClog', 2], ['nlHerring', 2]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '8-2' }, secret: { to: 'house:nl-winkel', hint: 'At low water, a door shows on a canal bed...' } },
    areas: [
      { id: 'polder', gen: 'strip', W: 220, H: 24, GY: 18, gyMax: 18, waterLine: POLDER.low,
        script: [
          ['itemBlock', { item: 'sig', y: 4 }],
          'pump',
          // Pupo (PUPO.md §4.2): his Nap Box on the first houseboat; he rides the canals with Brady
          ['houseboat', {}],
          ['canal', { w: 7 }],
          ['meet', { kind: 'nlBulb', text: 'TULIP BULBS BURROW UNDER YOUR FEET. STEP OFF WHEN THE MOUND WIGGLES', len: 12 }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['canal', { w: 9, door: 'gemaal@in', back: 'gemaalBack' }],
          ['enemies', { kind: 'nlClog', n: 2, len: 10 }],
          // the hooks and the must postcard come before the drawbridge (one postcard at most behind a Pupo obstacle)
          ['hooks', { n: 2 }],
          ['postcard', { kind: 'must', dy: -6 }],
          'cp',
          // the backup Nap Box at the valve checkpoint (the near side of the drawbridge), then The Drawbridge Chain
          ['napQuay', {}],
          ['pupoBridge', { w: 6, g: 3 }],
          ['itemBlock', { item: 'fins', y: 4 }],
          ['racks', { n: 2 }],
          ['toggle', { g: 2, kind: 'valve', wall: 4 }],
          ['canal', { w: 8, gold: 'risky' }],
          ['enemies', { kind: 'nlBulb', n: 2, len: 12 }],
          ['canal', { w: 6 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'gemaal', gen: 'room', role: 'secret', stamp: 'gemaal', room: 'grotto',
        grotto: { title: 'THE FLOODED PUMP HOUSE', rule: 'THE OLD PUMP HOUSE LEAKS. SWIM UNDER THE PIPES, CLIMB OUT AT THE BACK', half: true } }
    ] },
  // 8-2 FACTORY: the flower auction
  { n: 2, name: 'Flower Auction', mapLabel: 'Auction', arch: 'vault', theme: 'nl_veiling',
    gimmick: 'The auction\'s cold store: three roller shutters, three flower tokens, and every token is locked behind another shutter. Work out the order',
    hint: 'Peek through a shutter\'s window to see what is behind it. The daffodil token is free: start there',
    postcard: 'A flower auction with a clock that counts DOWN. Whoever presses first buys the tulips. ♥ C',
    enemies: [['nlBee', 2], ['nlBulb', 2], ['nlClog', 2]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '8-3' }, secret: { to: '8-6', hint: 'Cold mist creeps out of a door at the auction...' } },
    areas: [
      { id: 'veiling', gen: 'maze', cells: [3, 2], cell: [26, 14],
        script: [[veiling.gallery, veiling.clock, veiling.dock], [veiling.coldroom, veiling.belts, veiling.chiller]] },
      { id: 'koelcel', gen: 'room', role: 'secret', stamp: 'koelcel', room: 'pick',
        pick: { title: 'THE FLORIST\'S CHOICE', rule: 'THREE BOXES IN THE COLD ROOM, EACH WITH A PRIZE. TAKE ONE. THE OTHERS WILT' } }
    ] },
  // 8-3 RACE: the bike lane, against a gull on a cargo bike
  { n: 3, name: 'Bike Lane Rush', mapLabel: 'Bike Lane', arch: 'race', theme: 'nl_rush',
    gimmick: 'Race a herring gull on a cargo bike down the bike lane: drawbridges rise and fall, ride the tram roofs',
    hint: 'Beat the gull to the finish for a prize. Wait for the drawbridges to come down',
    postcard: 'A gull on a cargo bike rang its bell at me and then stole my chips. Classic gull. ♥ C',
    enemies: [['nlGull', 2], ['nlStroop', 2]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '8-4' } },
    areas: [
      { id: 'fietspad', gen: 'strip', W: 195, H: 18,
        script: [
          ['itemBlock', { item: 'sig', y: 4 }],
          ['startLine', { speed: 5.6 }],
          ['itemBlock', { item: 'power', y: 4 }],
          'hop',
          'drawbridge',
          ['tram', { gold: true }],
          ['door', { to: 'brug@in', perch: 0, look: 'nlStairsUp', back: 'brugBack' }],
          'drawbridge',
          'cp',
          ['itemBlock', { item: 'star', y: 4 }],   // a star for the gull stretch (Brady: mix up the power-ups)
          'hop',
          ['drawbridge', { fast: true }],
          ['postcard', { kind: 'risky', dy: -5, dx: -4 }],
          'tram',
          ['enemies', { kind: 'nlGull', n: 2, len: 10 }],
          'hop',
          ['racks', { n: 1 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'brug', gen: 'room', role: 'secret', stamp: 'brug', room: 'gauntlet',
        gauntlet: { title: 'THE BIKE BRIDGE', rule: 'THE BIKE LANE UNDER THE BRIDGE: RIDE IT OUT TO THE END', beats: ['mover', 'conveyor', 'fallers'] } }
    ] },
  // 8-4 LAMP: the frozen canals at night; the skate hut's thin back wall hides the way to Antarctica
  { n: 4, name: 'Frozen Canals', mapLabel: 'Ice Canals', arch: 'lamp', theme: 'nl_frozen',
    gimmick: 'Skate the frozen canals by lantern light: thin ice cracks, the light fades, the hot-chocolate stalls relight it',
    hint: 'Your light fades: touch a stall\'s lantern to relight it. Thin ice cracks, keep moving!',
    postcard: 'The canals froze! Everyone is skating and drinking hot chocolate. Me too. ♥ C',
    enemies: [['nlSnowman', 2], ['nlHerring', 1]],
    mapCell: [2, 1], mapFrom: [2, 5],
    exits: { main: { to: '8-5' }, secret: { to: 'land:aq', sign: 'An icy wind howls through the crack... a secret way to the far south!', hint: 'An icy wind howls through the wall of a skate hut...' } },
    areas: [
      { id: 'ijs', gen: 'strip', W: 191, H: 18, lamp: { r0: 170, r1: 70, decay: 25 },
        script: [
          ['gearStand', { item: 'hat' }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['rink', { n: 12 }],
          'thin',
          ['zopie', { gold: 'must' }],
          ['rink', { n: 10, snowman: true }],
          ['door', { to: 'hut@in', perch: 0, look: 'nlHutDoor', back: 'hutBack' }],
          'cp',
          'thin',
          ['itemBlock', { item: 'globe', y: 4 }],
          ['rink', { n: 14, snowman: true }],
          ['zopie', {}],
          'thin', 'thin',
          ['postcard', { kind: 'risky', dy: -4, dx: -10 }],
          ['rink', { n: 8 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'hut', gen: 'room', role: 'secret', stamp: 'hut', room: 'closing',
        closing: { title: 'THE KOEK STALL: CLOSING TIME', rule: 'THE SKATERS\' SNACK STALL IS CLOSING: GRAB WHAT YOU CAN, TOP SHELF FIRST', keeper: 'herring', word: 'GESLOTEN!' } }
    ] },
  // 8-5 LAIR: the cheese market and the weigh house
  { n: 5, name: 'The Weigh House', mapLabel: 'The Waag', arch: 'lair', theme: 'nl_waag', boss: 'nl_cheese',
    gimmick: 'Cheese sledges on the market ramps, the weighing scales, the cheese chute, then the Cheese King\'s hall',
    hint: 'Run into the Cheese King\'s wheels to kick them back at him! (The bike bell stops a rolling wheel.)',
    postcard: 'The windmill is unfolded and turning again! Piwi fled to Bali. Bring sunscreen. ♥ C',
    enemies: [['nlCheese', 2], ['nlClog', 2]],
    mapCell: [1, 2], mapFrom: 3,
    exits: { main: { to: 'country:next' } },
    areas: [
      { id: 'kaasmarkt', gen: 'strip', W: 84, H: 18,
        script: [
          ['itemBlock', { item: 'sig', y: 4 }],
          ['chute', { gold: true }],
          'sledges',
          ['trapdoor', { to: 'kelder@in', back: 'kelderBack', look: 'nlCellarHatch' }],
          'scales',
          'cp',
          ['itemBlock', { item: 'power', y: 4 }],
          ['chute', { period: 2.1 }],
          ['enemies', { kind: 'nlClog', n: 2, len: 8 }],
          ['postcard', { kind: 'risky', dy: -6 }],
          ['door', { to: 'waag', perch: 0, look: 'nlStairsUp' }]
        ] },
      { id: 'kelder', gen: 'room', role: 'secret', stamp: 'kelder', room: 'ambush',
        ambush: { title: 'THE CHEESE CELLAR', rule: 'THE CHEESES HAVE COME ALIVE AND THE CELLAR DOOR IS STUCK: STOMP THEM ALL', critters: ['nlClog', 'nlHerring'] } },
      { id: 'waag', gen: 'arena', role: 'arena', layout: 'waag', arenaW: 30, H: 18, roof: false }
    ] },
  // 8-6 SWING (secret): windmill sails and tulip blooms; the wind turns round
  { n: 6, name: 'Windmill Row', mapLabel: 'Windmills', arch: 'swing', secret: true, theme: 'nl_molens', pupo: 'helper',   // Pupo's Nap Box at the foot of the first mill, the sail-lattice climb to its coin ring
    gimmick: 'Ride the windmill sails round, bounce on the tulip blooms; then the wind turns and every sail spins the other way',
    hint: 'Hop onto a sail at the top of its turn. The windsock shows which way the wind blows',
    postcard: 'A whole row of windmills, all turning together. Then the wind changed. They did not mind. ♥ C',
    enemies: [['nlBee', 2], ['nlGull', 1]],
    mapCell: [1, 1], mapFrom: 1,
    exits: { main: { to: 'node:8-4' } },
    areas: [
      { id: 'molens', gen: 'islands', W: 200, H: 24,
        script: [
          ['gearStand', { item: 'wand' }],
          ['itemBlock', { item: 'power', y: 4 }],
          // Pupo (a helper here, PUPO.md §4.3): the old mill with its brake on, his Nap Box at its foot; his bonus is the
          // ring of coins over its stage, up the slippery sail
          ['latticeMill', {}],
          ['mill', { gold: 'high' }],
          ['tulips', { n: 3 }],
          ['mill', {}],
          ['enemies', { kind: 'nlBee', n: 1, len: 8 }],
          'cp',
          ['itemBlock', { item: 'lsd', y: 5 }],   // moved up from the end (Brady: star / acid too often came at the end, where they are no use)
          ['mill', { reverse: true }],
          ['tulips', { n: 4 }],
          ['enemies', { kind: 'nlBee', n: 1, len: 8 }],
          ['mill', { reverse: true, speed: 1.0, gold: 'risky' }],
          ['mill', { reverse: true }],
          ['millDoor', { to: 'molen@in', back: 'molenBack' }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'molen', gen: 'room', role: 'secret', stamp: 'molen', room: 'climb',
        climb: { title: 'INSIDE THE WINDMILL', rule: 'UP THE WINDMILL\'S INSIDES TO THE CAP: THE PRIZE IS AT THE TOP', style: 'spikes' } }
    ] }
];

for (const k in P) Tour.pieces['nl.' + k] = P[k];
Tour.amend('nl', { skins: nlPupoSkins });
Tour.amend('nl', {
  stamps, skins,
  map: { fort: 'waag', start: [0, 0] },
  houses: [{ id: 'nl-winkel', mapLabel: 'Winkel', kind: 'stand', name: 'De Winkel', keeper: 'goose', stock: ['fins', 'kazoo', 'magnet', 'sundial', 'oneup', 'wand'], mapCell: [0, 1], mapFrom: 0 }],
  levels
});
})();
