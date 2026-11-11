/* ============================================================
   Indonesia (world 9): the levels in the v2 format
   (LEVEL_OVERHAUL.md §2 "World 9", §3.2 graph). Loads after
   29_tour_id.js (the look, the cast, the surfboard, Boss Kera)
   and adds, with Tour.amend: the stamps, the country looks for
   library objects, the set pieces of the overhaul, the Souvenir
   Stand (a gecko's warung), the map graph and all seven levels.
   Bottle Mail #5 waits in 9-1's sea cave.
   ============================================================ */
(() => {
const C = Tour.countries.id;
if (!C) return;
const K = TourKit;
const KITE = ['#e8323a', '#ffd23a', '#2a6ad8', '#ffffff', '#2aa85a', '#ff7a2a'];

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
const SEA = st => st.GY + 1;
function seaCols(st, x0, x1) { const B = st.B, S = SEA(st); st.pit(x0, x1); B.fill(x0, S, x1, B.H - 1, T.LAVA); for (let x = x0; x <= x1; x++) B.ghosts.push([x, S - 1]); }

/* ---------------- pieces ---------------- */
const P = {
  /* ---- 9-1 the surf ---- */
  // a black lava-rock islet under the old pier: a sea cave opens in its side (the way to Bottle Mail #5); a crab of
  // foam keeps puffing out of the dark mouth (the tell). { to, back }
  pierCave(st, o) {
    const B = st.B, x = st.x, n = 16, S = SEA(st), py = S - 4;
    seaCols(st, x, x + n - 1);
    B.prop('idPier', x + 1, py, 8, S - py, 'top', {});
    st.coins(x + 2, x + 8, py - 2);
    // the islet: a rock with a flat top two rows above the swell, the cave door on it
    B.fill(x + 10, S - 2, x + 14, B.H - 1, T.HARD);
    B.prop('idSeaRock', x + 10, S - 2, 5, 3, 'none', {});
    B.spawn('portal', x + 12, S - 3, { kind: 'door', look: 'idSeaCave', targetRef: o.to });
    if (o.back) B.anchor(o.back, x + 13, S - 3);
    st.spawn('idUrchin', x + 14, S - 3, {});
    return x + n;
  },
  // a sandbar with a star block high over it (the big-set reward)
  starBar(st, o) {
    const x = st.x, n = 8; st.floor(x, x + n - 1); st.decor('idPalmS', x + 1); st.decor('idUmbrella', x + 6);
    st.block(x + 4, st.gy - 5, o.item || 'star'); st.coins(x + 2, x + 6, st.gy - 2);
    return x + n;
  },

  /* ---- 9-2 the kite festival (GLIDE) ---- */
  // a terraced island: rice paddies stepping up (or down) the hill; flooded steps catch the sky
  terraceIsle(st, o) {
    const B = st.B, n = o.n || 3, dir = o.down ? 1 : -1; let x = st.x;
    st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      st.gy = clamp(st.gy + dir * 2, st.gyMin, st.gyMax);
      const w = 6; B.fill(x, st.gy, x + w - 1, Math.min(B.H - 1, st.gy + 3 + (o.down ? k : n - k) * 2), T.GROUND);
      if (k % 2 === 0) { B.fill(x + 1, st.gy, x + w - 2, st.gy, T.WATER); for (let q = x + 1; q <= x + w - 2; q++) B.decorAt('idPaddyRice', q, st.gy + 1, q); }
      st.decor('idRiceTuft', x); st.decor('idRiceTuft', x + w - 1);
      st.coins(x + 1, x + w - 2, st.gy - 2);
      if (o.enemy && k === n - 1) st.enemy(o.enemy, x + 3, st.gy);
      x += w;
    }
    if (o.gold) st.gold(x - 3, st.gy - 5, o.gold);
    return x;
  },
  // a long drop across open sky from a launch ledge: a warm updraft column rises in the middle (a hop into it lifts
  // Brady without the plane; with the plane, one long glide through the coin rings). { w, drop, gold }
  glideGap(st, o) {
    const B = st.B, x = st.x, w = o.w || 12, drop = o.drop || 3;
    st.floor(x, x + 3); B.decorAt('idKiteFlag', x + 2, st.gy, x);
    st.pit(x + 4, x + 3 + w);
    const mid = x + 4 + Math.floor(w / 2) - 1, top = st.gy - 6;
    // a bamboo perch under the column (a solid fallback) and the column itself
    B.fill(mid, st.gy + drop - 1, mid + 1, st.gy + drop - 1, T.SEMI);
    B.zone(mid, top, 2, st.gy + drop - top - 1, 0, -(o.force || 95) * TS, 6.5 * TS, 'updraft', { pull: 3 });
    B.prop('idThermal', mid, st.gy + drop - 1, 2, 1, 'none', { h: (st.gy + drop - top) * TS });
    for (let k = 0; k < 3; k++) { const cx = x + 6 + k * Math.floor((w - 4) / 2), cy = st.gy - 3 + k; for (let a = 0; a < 8; a++) B.pickAt(Math.round(cx + Math.cos(a * TAU / 8) * 1.6), Math.round(cy + Math.sin(a * TAU / 8) * 1.6)); }
    if (o.gold) st.gold(mid + 1, top - 1, o.gold);
    st.gy = clamp(st.gy + drop, st.gyMin, st.gyMax);
    st.floor(x + 4 + w, x + 7 + w);
    return x + 8 + w;
  },
  // a parade of ducks paddling across a flooded gully in a line: their backs are a moving bridge
  duckRaft(st, o) {
    const x = st.x, span = o.span || 9; st.floor(x, x + 1);
    const x0 = x + 2; st.pit(x0, x0 + span - 1);
    st.spawn('mplat', x0 + 1, st.gy - 1, { pw: 4, ax: (span - 5) * TS, ay: 0, speed: 1.6, skin: 'idDuckLine' });
    for (let k = 0; k < span; k++) st.B.ghosts.push([x0 + k, st.gy]);
    st.coins(x0 + 2, x0 + span - 3, st.gy - 3);
    st.floor(x0 + span, x0 + span + 2);
    if (o.duck) st.enemy('idDuck', x0 + span + 1, st.gy);
    return x0 + span + 3;
  },
  // the rice barn on stilts (lumbung): its loft door is up the ladder; behind it, the way to the orangutans
  lumbung(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 9);
    B.prop('idLumbung', x + 2, st.gy - 6, 6, 6, 'none', {});
    B.fill(x + 2, st.gy - 4, x + 7, st.gy - 4, T.SEMI);
    st.semi(x, x + 1, st.gy - 2);
    B.spawn('portal', x + 5, st.gy - 5, { kind: 'door', look: 'idBarnDoor', targetRef: o.to });
    if (o.back) B.anchor(o.back, x + 8, st.gy - 1);
    st.coins(x + 2, x + 7, st.gy - 6);
    return x + 10;
  },
  // a kite relay in a strong crosswind: the gust pushes back across the gully (the leaves show it)
  windKites(st, o) {
    const x0 = st.x, n = o.n || 3, end = Tour.pieces['id.kites'](st, { n, look: 2 });
    st.B.spawn('idGust', x0 + 2, st.gy - 1, { w: end - x0 - 4, push: o.wind || 2.2 });
    if (o.gold) st.gold(x0 + 2 + Math.floor((end - x0) / 2), st.gy - 7, o.gold);
    return end;
  },

  /* ---- 9-3 Batur erupts (DOOM, downhill) ---- */
  // the summit at dawn: the sky starts to brighten, the crater rumbles, the lava breaks loose behind Brady
  summit(st, o) {
    const x = st.x; st.floor(x, x + 5); st.spawn('idSunrise', x, st.gy - 1, {}); st.decor('idTorch', x + 1);
    st.sign(x + 4, 'BATUR IS ERUPTING! RUN DOWNHILL: THE LAVA IS RIGHT BEHIND YOU. GLOWING RINGS = A LAVA BOMB LANDS THERE');
    return x + 6;
  },
  // steps down the mountainside: ash ledges lit by bamboo torches. { n }
  descend(st, o) {
    const n = o.n || 3; let x = st.x;
    for (let k = 0; k < n; k++) {
      const w = 4 + (k % 2); st.floor(x, x + w - 1);
      if (k % 2 === 0) st.decor('idTorch', x + 1); else st.decor('idLavaRock', x + 2);
      st.coins(x + 1, x + w - 2, st.gy - 2); x += w;
      st.gy = clamp(st.gy + 1 + (k % 2), st.gyMin, st.gyMax);
    }
    st.floor(x, x + 2); return x + 3;
  },
  // a basalt bluff: the trail drops off a cliff; tokay geckos run up its face and along the top
  bluff(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 6);
    st.semi(x + 2, x + 4, st.gy - 3); st.coins(x + 2, x + 4, st.gy - 5);
    if (o.gold) st.gold(x + 3, st.gy - 6, o.gold);
    st.gy = clamp(st.gy + 4, st.gyMin, st.gyMax);
    st.floor(x + 7, x + 15);
    st.enemy('idTokay', x + 12, st.gy, { dir: -1 });
    st.decor('idLavaRock', x + 14);
    return x + 16;
  },
  // the old sulfur-mine track: the trail drops down a step, and in the cliff face a tunnel mouth with rails runs into
  // the mountain (steam puffs out of it: the tell). { to, back }
  mineMouth(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 4);
    const top = st.gy; st.gy = clamp(st.gy + 4, st.gyMin, st.gyMax);
    st.floor(x + 5, x + 14);
    B.prop('idMineMouth', x + 3, st.gy - 4, 4, 4, 'none', {});
    B.decorAt('idMineRails', x + 5, st.gy, 0);
    B.spawn('portal', x + 5, st.gy - 1, { kind: 'door', look: 'idMineDoor', targetRef: o.to });
    B.spawn('idSteamPuff', x + 5, st.gy - 3, {});
    if (o.back) B.anchor(o.back, x + 8, st.gy - 1);
    st.coins(x + 7, x + 12, st.gy - 3);
    st.sign(x + 12, 'AN OLD MINE TRACK RUNS INTO THE MOUNTAIN...');
    return x + 15;
  },

  /* ---- 9-4 the night dive (LAMP in the water) ---- */
  // a sunken outrigger's hold: an air pocket inside (the door); its glowing mast shows the way. { to, back, gold }
  wreckDoor(st, o) {
    const x = st.x, F = st.floorY, B = st.B;
    B.fill(x + 1, F - 4, x + 12, F - 1, T.HARD); st.water(x + 2, F - 3, x + 11, F - 2); st.water(x + 4, F - 4, x + 6, F - 4);
    B.decorAt('idMast', x + 9, F - 4, 0);
    B.spawn('portal', x + 9, F - 2, { kind: 'door', look: 'idHatch', targetRef: o.to });
    if (o.back) B.anchor(o.back, x + 4, F - 2);
    st.coins(x + 3, x + 10, F - 6);
    st.spawn('idLionfish', x + 7, F - 8, {});
    return x + 13;
  },
  // a reef gate (P1 hangs in its middle gap)
  reefGate2(st, o) {
    const x = st.x, F = st.floorY;
    st.rock(x + 1, 2, x + 3, 6); st.rock(x + 1, 11, x + 3, F - 1); st.B.decorAt('idCoral', x + 2, 11, 0);
    st.rock(x + 7, 2, x + 9, 4); st.rock(x + 7, 9, x + 9, F - 1); st.B.decorAt('idAnemone', x + 8, 9, 1);
    st.coins(x + 4, x + 6, 9);
    if (o.gold) st.gold(x + 5, 7, o.gold);
    st.spawn('idGlowJelly', x + 5, 11, { range: 2 });
    return x + 11;
  },
  // an item block in a rock niche on the sea bed
  niche(st, o) {
    const x = st.x, F = st.floorY;
    st.rock(x, F - 3, x + 4, F - 1); st.water(x + 1, F - 3, x + 3, F - 2);
    st.block(x + 2, F - 6, o.item || 'power');
    return x + 5;
  },

  /* ---- 9-5 the monkey forest lead-in ---- */
  // the headline: a macaque that snatches power-ups, with a sign the first time
  meetMacaque(st, o) {
    const x = st.x, n = 12; st.floor(x, x + n - 1);
    st.sign(x + 1, 'MACAQUES SNATCH POWER-UPS! DODGE THE GRAB, THEN HIT IT WHILE IT RUNS TO GET YOURS BACK');
    st.decor('idBanana', x + n - 2);
    st.enemy('idMacaque', x + 8, st.gy);
    st.coins(x + 3, x + 9, st.gy - 3);
    return x + n;
  },
  // a durian tree that teaches the boss fight: land on its branch and a durian drops down the trunk onto what's below
  leadTree(st, o) {
    const B = st.B, x = st.x, n = 14; st.floor(x, x + n - 1);
    const tx = x + 7;
    for (let q = -2; q <= 2; q++) B.set(tx + q + 3, st.gy - 3, T.SEMI);
    B.spawn('idLeadTree', tx, st.gy - 1, { bx0: tx + 1, bx1: tx + 5, by: st.gy - 3 });
    st.enemy(o.enemy || 'idSate', tx, st.gy, { dir: 1 });
    st.sign(x + 1, 'LAND ON A DURIAN TREE\'S BRANCH: A DURIAN DROPS DOWN THE TRUNK');
    st.coins(tx + 1, tx + 5, st.gy - 5);
    if (o.gold) st.gold(tx + 3, st.gy - 7, o.gold);
    return x + n;
  },
  // a curtain of banyan roots hangs down the old garden wall: something rustles behind it. { to, back }
  rootCurtain(st, o) { return Tour.pieces.secretDoor(st, { to: o.to, look: 'curtain', skin: 'idRootCurtain', back: o.back, h: 4 }); },
  // a broken garden wall to climb over: crumbling top stones, a power-up block on the high course
  wallSteps(st, o) {
    const B = st.B, x = st.x, n = 4; st.floor(x, x + 13);
    for (let i = 0; i < n; i++) B.fill(x + 1 + i, st.gy - 1 - i, x + 1 + i, st.gy - 1, T.BRICK);
    for (let q = 0; q < 4; q++) B.set(x + 5 + q, st.gy - n, T.CRUMBLE);
    B.fill(x + 5, st.gy - n + 1, x + 8, st.gy - 1, T.BRICK);
    for (let i = 0; i < n; i++) B.fill(x + 9 + i, st.gy - n + i, x + 9 + i, st.gy - 1, T.BRICK);
    st.block(x + 7, st.gy - n - 4, o.item || 'power');
    st.coins(x + 5, x + 8, st.gy - n - 2);
    if (o.gold) st.gold(x + 6, st.gy - n - 6, o.gold);
    return x + 14;
  },
  // the gap in the garden wall that leads to the durian grove
  groveGate(st, o) {
    const x = st.x; st.floor(x, x + 7);
    st.B.prop('idWallGap', x + 1, st.gy - 6, 6, 6, 'none', {});
    st.B.spawn('portal', x + 4, st.gy - 1, { kind: 'door', look: 'idGroveDoor', targetRef: o.to });
    return x + 8;
  },

  /* ---- 9-6 the Borneo canopy (SWING) ---- */
  // lianas over the gaps between giant trees
  lianas(st, o) {
    const B = st.B, n = o.n || 2; let x = st.x;
    st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      st.pit(x, x + 6);
      const ax = x + 3, ay = st.gy - 6, len = 5, amp = 0.55;
      st.spawn('mplat', ax, ay, { pw: 3, swing: { len: len * TS, amp }, speed: 1.15 + st.d * 0.4, skin: 'idLiana', phase: k * 1.3 });
      for (let a = -10; a <= 10; a++) { const th = a / 10 * amp; const gx = Math.round(ax + Math.sin(th) * len), gy2 = Math.round(ay + 1 + Math.cos(th) * len); for (let q = -1; q <= 1; q++) B.ghosts.push([gx + q, gy2]); }
      B.decorAt('idLianaTop', ax, ay + 1, k);
      st.arc(ax - 2, ax + 2, ay + len - 2, 1);
      if (o.hornbill && k === 0) st.spawn('idHornbill', ax, ay - 1, {});
      x += 7;
      if (k < n - 1) { st.floor(x, x + 1); x += 2; }
    }
    st.floor(x, x + 2);
    if (o.gold) st.gold(x - 4, st.gy - 6, o.gold);
    return x + 3;
  },
  // an orangutan friend in the fork of a tree: sit in its hands (THROW) and it hurls Brady across the canopy
  orangutan(st, o) {
    const to = o.to || [14, -2];
    const end = Tour.pieces.catapult(st, { to, skin: 'idOrangutan' });
    if (o.gold) st.gold(end - 3, st.gy - 3, o.gold);
    return end;
  },
  // a giant rafflesia blooming on a mossy log island
  rafflesiaIsle(st, o) {
    const x = st.x, n = 12; st.floor(x, x + n - 1); st.decor('idFern', x + 1);
    st.enemy('idRafflesia', x + 7, st.gy);
    st.semi(x + 3, x + 6, st.gy - 4); st.coins(x + 3, x + 6, st.gy - 6);
    return x + n;
  },
  // a giant tree with a leaf nest high in its crown: steps of branches up to it. { to, back, gold }
  nestTree(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 12);
    B.prop('idGiantTree', x + 3, st.gy - 12, 6, 12, 'none', {});
    for (let k = 0; k < 3; k++) { const by = st.gy - 3 - k * 3, bx = x + 1 + (k % 2) * 6; for (let q = 0; q < 5; q++) B.set(bx + q, by, T.SEMI); st.coins(bx, bx + 4, by - 2); }
    B.fill(x + 4, st.gy - 12, x + 8, st.gy - 12, T.SEMI);
    B.spawn('portal', x + 6, st.gy - 13, { kind: 'door', look: 'idNest', targetRef: o.to });
    if (o.back) B.anchor(o.back, x + 11, st.gy - 1);
    st.enemy('idTokay', x + 10, st.gy);
    return x + 13;
  },

  /* ---- 9-7 the blue-fire rails (RAIL) ---- */
  // a vent in the track bed: a blue flame bursts up (tell: it hisses and flickers first). { n, gap }
  flames(st, o) {
    const n = o.n || 2, deck = st.deck || st.gy; let x = st.x;
    for (let k = 0; k < n; k++) { st.B.spawn('idBlueVent', x + 2, deck - 1, { phase: (o.phase || 0) + k * 1.1, period: o.period || 3.2 }); st.coins(x + 1, x + 3, deck - 4); x += o.gap || 7; }
    return x;
  },
  // an item block hanging over the track (bump it from the cart)
  railBlock(st, o) { const deck = st.deck || st.gy; st.block(st.x + 1, deck - 4, o.item || 'power'); st.coins(st.x, st.x + 2, deck - 6); return st.x + 3; },
  // the miners' depot: a door at the dead end of a siding (it leads to the end of the line). { to }
  depotDoor(st, o) {
    const deck = st.deck || st.gy, B = st.B;
    B.spawn('portal', st.x + 2, deck - 1, { kind: 'door', look: 'idDepotDoor', targetRef: o.to });
    B.anchor(o.back || 'depotBack', st.len + 4, (st.decks ? st.decks.lower : deck) - 1);
    st.coins(st.x, st.x + 1, deck - 3);
    return st.x + 4;
  },
  // a sulfur cask rolling along the lower deck
  sulfurCask(st, o) { const deck = st.deck || st.gy; st.B.spawn('idCask', st.x + 2, deck - 1, { dir: -1 }); return st.x + 4; }
};

/* ---------------- entities ---------------- */
// 9-5's lead-in durian tree: one branch; landing on it shakes the crown and a durian drops down the trunk
class IdLeadTree extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, 6 * TS); this.x = s.x - TS / 2 - TS; this.y = s.y - 6 * TS; this.bx0 = s.bx0 * TS; this.bx1 = (s.bx1 + 1) * TS; this.by = s.by * TS; this.crown = 2; this.regrow = 0; this.shake = 0; this.on = false; this.friendly = true; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    const on = !!(p && !p.dead && p.onGround && p.cx > this.bx0 - 4 && p.cx < this.bx1 + 4 && Math.abs(p.y + p.h - this.by) < 4);
    if (on && !this.on && this.crown > 0) { this.shake = 0.5; Sound.play('bump', { pitch: 1.3, vol: 0.5 }); }
    this.on = on;
    if (this.shake > 0) { this.shake -= dt; if (this.shake <= 0 && this.crown > 0) { this.crown--; this.regrow = 4; const d = new ENTITY_TYPES.idDurianProp(g, { x: this.cx, y: this.y + TS }); d.vy = 2 * TS; g.spawn(d); g.burst(this.cx, this.y + 20, 8, '#4a8a3a', 'debris'); } }
    if (this.crown < 2 && (this.regrow -= dt) <= 0) { this.crown++; this.regrow = 4; }
  }
  draw(ctx) {
    const x = this.cx, fy = this.y + this.h, sx = this.shake > 0 ? Math.sin(this.t * 55) * 3 : 0, cy = this.y + 30;
    ctx.fillStyle = '#6a4a32'; ctx.beginPath(); ctx.moveTo(x - 12, fy); ctx.lineTo(x - 6 + sx * 0.5, cy + 20); ctx.lineTo(x + 6 + sx * 0.5, cy + 20); ctx.lineTo(x + 12, fy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a4a32'; rr(ctx, this.bx0 - 6 + sx, this.by - 2, this.bx1 - this.bx0 + 8, 11, 5); ctx.fill();
    ctx.fillStyle = '#2e6a2e'; for (let lx = this.bx0 + 8; lx < this.bx1; lx += 22) { ctx.beginPath(); ctx.ellipse(lx + sx, this.by - 6, 12, 7, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#2e6a2e'; for (const [dx, dy, r] of [[0, 0, 32], [-28, 12, 22], [28, 10, 22], [-12, -20, 20], [14, -20, 20]]) { ctx.beginPath(); ctx.arc(x + dx + sx, cy + dy, r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#4a8a3a'; for (const [dx, dy, r] of [[-16, -6, 10], [12, -12, 9], [0, 10, 8]]) { ctx.beginPath(); ctx.arc(x + dx + sx, cy + dy, r, 0, TAU); ctx.fill(); }
    for (let k = 0; k < this.crown; k++) { const dx = k ? 8 : -8; ctx.fillStyle = '#9aa83a'; ctx.beginPath(); ctx.arc(x + dx + sx, cy + 28, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a7a1a'; for (let q = 0; q < 6; q++) { const a = q * TAU / 6; ctx.beginPath(); ctx.moveTo(x + dx + sx + Math.cos(a) * 7, cy + 28 + Math.sin(a) * 7); ctx.lineTo(x + dx + sx + Math.cos(a) * 11, cy + 28 + Math.sin(a) * 11); ctx.lineTo(x + dx + sx + Math.cos(a + 0.4) * 7, cy + 28 + Math.sin(a + 0.4) * 7); ctx.fill(); } }
  }
}
// a puff of white steam from the mine's tunnel mouth (the tell of the way in)
class IdSteamPuff extends Ent {
  constructor(g, s) { super(g, s, 20, 20); this.friendly = true; }
  update(dt) { this.t += dt; TourObj.puffs(this.g, this.cx + 6, this.y + 10, '#f0f0f0', 0.12); }
  draw() {}
}
// the crosswind over a gully: streaming leaves and petals show which way it blows
class IdGust extends Ent {
  constructor(g, s) { super(g, s, (s.w || 10) * TS, 9 * TS); this.x = s.x - TS / 2; this.y = s.y - 9 * TS; this.friendly = true; this.ghost = true; this.push = (s.push || 2.2) * TS; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    // the gust blows back against Brady in the air (a kite rider holds on to its frame)
    g.windForce = 0;
    if (p && !p.dead && !p.onGround && !(p.ride && p.ride.constructor && p.ride.constructor.name === 'IdKite') && overlap(p, this)) { p.pushX = (p.pushX || 0) - this.push; g.windForce = -this.push; }
    if (this.g.onScreen(this, 40) && Math.random() < 0.5) this.g.burst(this.x + this.w + 10, this.y + Math.random() * this.h, 1, Math.random() < 0.5 ? '#7ac84a' : '#ffd23a', 'leaf'); }
  draw(ctx) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let k = 0; k < 7; k++) { const y = this.y + 20 + k * 34, ph = ((this.t * 1.3 + k * 0.37) % 1), x = this.x + this.w - ph * this.w; ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 20, y - 6, x - 46, y); ctx.stroke(); }
    ctx.restore();
  }
}
// a blue-fire vent in the track bed: it hisses and flickers (0.6 s), then a tall blue flame bursts up for 0.9 s
class IdBlueVent extends Ent {
  constructor(g, s) { super(g, s, 26, 8); this.x = s.x - 13; this.y = s.y - 8; this.period = s.period || 3.2; this.ph = s.phase || 0; this.friendly = true; }
  get k() { return ((this.t + this.ph) % this.period) / this.period; }
  get burning() { return this.k > 0.62 && this.k < 0.9; }
  get telling() { return this.k > 0.45 && this.k <= 0.62; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (this.telling && Math.random() < 0.3) g.burst(this.cx + (Math.random() - 0.5) * 16, this.y, 1, '#6ac8ff', 'spark');
    if (this.burning && p && !p.dead && p.cx > this.x - 4 && p.cx < this.x + this.w + 4 && p.y + p.h > this.y - 3.2 * TS && p.y < this.y) p.hurt(this);
    if (this.burning && !this.was && g.onScreen(this, 60)) K.sfx('whoosh', 'fly', { vol: 0.35, pitch: 0.7 });
    this.was = this.burning;
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.fillStyle = '#3a3a44'; rr(ctx, x - 13, y - 6, 26, 6, 2); ctx.fill(); ctx.fillStyle = '#e8d040'; ctx.fillRect(x - 10, y - 7, 20, 2);
    if (this.telling) { ctx.fillStyle = `rgba(110,200,255,${0.4 + 0.4 * Math.sin(this.t * 40)})`; ctx.beginPath(); ctx.ellipse(x, y - 8, 10, 5, 0, 0, TAU); ctx.fill(); }
    if (this.burning) {
      const h = 3.2 * TS * Math.min(1, (this.k - 0.62) / 0.06);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) { const w = 14 - k * 4; ctx.fillStyle = ['rgba(60,120,255,0.55)', 'rgba(110,200,255,0.65)', 'rgba(230,250,255,0.8)'][k]; ctx.beginPath(); ctx.moveTo(x - w, y - 6); ctx.quadraticCurveTo(x - w * 0.6 + Math.sin(this.t * 30 + k) * 3, y - h * 0.6, x + Math.sin(this.t * 22) * 4, y - h * (1 - k * 0.15)); ctx.quadraticCurveTo(x + w * 0.6, y - h * 0.5, x + w, y - 6); ctx.fill(); }
      ctx.restore();
    }
  }
  get light() { return this.burning ? { r: 150, c: 'rgba(110,190,255,', x: this.cx, y: this.y - 40 } : this.telling ? { r: 50, c: 'rgba(110,190,255,', x: this.cx, y: this.y } : { r: 26, c: 'rgba(90,150,255,', x: this.cx, y: this.y }; }
}
// a sulfur cask rolling down the siding (a hazard: jump it or stomp it)
const caskArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y - 11); ctx.rotate((e.t || 0) * 6 * (e.dir || 1));
  ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#4a4a54'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke();
  ctx.fillStyle = '#e8d040'; ctx.beginPath(); ctx.arc(0, -4, 3, 0, TAU); ctx.fill();
  ctx.restore();
};
Object.assign(ENTITY_TYPES, { idLeadTree: IdLeadTree, idSteamPuff: IdSteamPuff, idGust: IdGust, idBlueVent: IdBlueVent });
ENTITY_TYPES.idCask = TourEnemy.make({ w: 22, h: 22, speed: 2.2, behavior: 'walk', art: caskArt, burst: '#e8d040' });
Tour.enemyInfo.idCask = { place: 'walk' };

/* ---------------- country looks (skins: doors, platforms, catapult, curtain) ---------------- */
const skins = {
  // the sea cave in the black rock under the pier: a dark mouth, foam at its lip
  idSeaCave(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#0a1420'; ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.quadraticCurveTo(x - 18, y - 44, x, y - 46); ctx.quadraticCurveTo(x + 18, y - 44, x + 18, y); ctx.fill(); ctx.fillStyle = 'rgba(230,255,255,0.75)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - 14 + k * 7, y - 2 + Math.sin(t * 4 + k) * 1.5, 3, 0, TAU); ctx.fill(); } },
  // the rice barn's loft door: a little woven-bamboo door under the thatch
  idBarnDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#8a6a3a'; rr(ctx, x - 13, y - 40, 26, 40, 3); ctx.fill(); ctx.strokeStyle = '#c8a05a'; ctx.lineWidth = 1.5; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 11, y - 36 + k * 8); ctx.lineTo(x + 11, y - 32 + k * 8); ctx.stroke(); } ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.arc(x + 7, y - 20, 2, 0, TAU); ctx.fill(); },
  // the hatch of the sunken outrigger's hold, its rim crusted with glowing anemones
  idHatch(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#2a2030'; rr(ctx, x - 15, y - 40, 30, 40, 6); ctx.fill(); ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3; rr(ctx, x - 15, y - 40, 30, 40, 6); ctx.stroke(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(${k % 2 ? '255,120,220' : '120,255,220'},${0.5 + 0.3 * Math.sin(t * 2 + k)})`; ctx.beginPath(); ctx.arc(x - 14 + k * 5.6, y - 41, 2.4, 0, TAU); ctx.fill(); } ctx.restore(); },
  // the gap in the old garden wall into the durian grove: leaves frame it, light spills through
  idGroveDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = 'rgba(255,250,200,0.55)'; rr(ctx, x - 16, y - 56, 32, 56, 14); ctx.fill(); ctx.fillStyle = '#3a7a3a'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x - 18 + k * 7, y - 58 + Math.sin(k * 2) * 3, 7, 4, k, 0, TAU); ctx.fill(); } ctx.fillStyle = '#fff6c0'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('DURIAN GROVE ▶', x, y - 66); },
  // a leafy orangutan nest high in the crown
  idNest(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#5a7a2a'; ctx.beginPath(); ctx.ellipse(x, y - 8, 26, 12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a5a1a'; ctx.beginPath(); ctx.ellipse(x, y - 12, 18, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7aa83a'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.ellipse(x - 24 + k * 7, y - 16 + Math.sin(t + k) * 1.5, 6, 3, k * 0.7, 0, TAU); ctx.fill(); } ctx.fillStyle = '#1a1208'; rr(ctx, x - 10, y - 40, 20, 26, 8); ctx.fill(); },
  // the tunnel mouth into the old mine: a timber frame over a dark hole, a lamp hanging inside
  idMineDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#140c0a'; rr(ctx, x - 16, y - 50, 32, 50, 10); ctx.fill(); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 20, y - 54, 6, 54); ctx.fillRect(x + 14, y - 54, 6, 54); ctx.fillRect(x - 22, y - 58, 44, 6); ctx.fillStyle = `rgba(255,220,140,${0.6 + 0.3 * Math.sin(t * 4)})`; ctx.beginPath(); ctx.arc(x + 6, y - 38, 3, 0, TAU); ctx.fill(); },
  // the miners' depot door at the end of the siding: planks and a hanging lamp
  idDepotDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#5a4030'; ctx.fillRect(x - 18, y - 54, 36, 54); ctx.fillStyle = '#3a2418'; rr(ctx, x - 12, y - 46, 24, 46, 3); ctx.fill(); ctx.fillStyle = `rgba(110,200,255,${0.7 + 0.3 * Math.sin(t * 5)})`; ctx.beginPath(); ctx.arc(x + 14, y - 46, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8d040'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('DEPOT', x, y - 58); },
  // the orangutan friend: sits in the fork of a tree with open hands; throws Brady on THROW
  idOrangutan(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, k = e.k || 0;
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - 6, y - 4, 12, 8);
    ctx.save(); ctx.translate(x - 8, y - 6);
    ctx.fillStyle = '#c8642a'; ctx.beginPath(); ctx.ellipse(-12, -18, 16, 18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d8844a'; ctx.beginPath(); ctx.ellipse(-12, -40, 13, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.ellipse(-8, -38, 8, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-11, -41, 1.6, 0, TAU); ctx.arc(-5, -41, 1.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-8, -36, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    // the long arms reach out: hands cupped under the seat, flung up on a launch
    ctx.strokeStyle = '#b8541a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; const a = -0.3 - k * 1.6;
    ctx.beginPath(); ctx.moveTo(-4, -26); ctx.lineTo(-4 + Math.cos(a) * 30, -26 + Math.sin(a) * 30 + 14); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.restore();
    TourObj.plank(ctx, e.x, e.y + 6, e.w, 9, ['#c8a05a', '#8a6a3a', '#5a4020', '#e8c890']);
    if (!e.told) { ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('SIT, THEN THROW!', x, y - 62 + Math.sin(t * 4) * 2); }
  },
  // the curtain of banyan aerial roots in front of the hidden hollow
  idRootCurtain(ctx, e, t) {
    const x0 = e.x, y0 = e.y, w = e.w, h = e.h, a = 1 - (e.part || 0) * 0.65;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#4a5a3a'; ctx.fillRect(x0 - 8, y0 - 12, w + 16, 14);
    for (let k = 0; k < 11; k++) { const x = x0 + 2 + k * (w - 4) / 10, sw = Math.sin(t * 1.4 + k) * 2 * (1 + (e.part || 0) * 4); ctx.strokeStyle = k % 2 ? '#7a6450' : '#68543e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sw, y0 + h * 0.5, x + sw * 1.5, y0 + h - (k % 3) * 4); ctx.stroke(); }
    ctx.fillStyle = '#4a8a3a'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x0 + k * w / 5, y0 + 6 + (k % 2) * 10, 8, 4, k, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (Math.random() < 0.05) e.g && e.g.burst(x0 + Math.random() * w, y0 + h * 0.5, 1, '#9ad86a', 'leaf');
  }
};

/* ---------------- moving-platform looks ---------------- */
Object.assign(PlatformArt, {
  // ducks paddling in a line, a plank across their backs (the moving bridge)
  idDuckLine(ctx, e, t) {
    const x0 = e.x, y = e.y, w = e.w;
    for (let k = 0; k < 4; k++) { const dx = x0 + 14 + k * (w - 28) / 3, bob = Math.sin(t * 6 + k) * 1.5; ctx.fillStyle = '#f4f0e4'; ctx.beginPath(); ctx.ellipse(dx, y + 14 + bob, 13, 8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(dx + 9, y + 4 + bob, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffa81a'; ctx.beginPath(); ctx.moveTo(dx + 14, y + 4 + bob); ctx.lineTo(dx + 21, y + 6 + bob); ctx.lineTo(dx + 14, y + 7 + bob); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(dx + 11, y + 2 + bob, 1.3, 0, TAU); ctx.fill(); }
    TourObj.plank(ctx, x0 + 2, y - 2, w - 4, 8, ['#c8a05a', '#8a6a3a', '#5a4020', '#e8c890']);
  },
  // a liana loop to hang from
  idLiana(ctx, e, t) { const ax = e.ancX != null ? e.ancX : e.cx, ay = e.ancY != null ? e.ancY : e.y - 5 * TS; ctx.strokeStyle = '#4a6a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(e.cx, e.y); ctx.stroke(); ctx.fillStyle = '#3e7a36'; for (let k = 1; k < 5; k++) { const lx = ax + (e.cx - ax) * k / 5, ly = ay + (e.y - ay) * k / 5; ctx.beginPath(); ctx.ellipse(lx + 5, ly, 6, 2.5, 0.5, 0, TAU); ctx.fill(); } TourObj.plank(ctx, e.x + 4, e.y - 2, e.w - 8, 8, ['#8a6a3a', '#6a4a2a', '#3a2a1a', '#a8885a']); }
});

/* ---------------- decor ---------------- */
Object.assign(Decor, {
  // a black lava-rock islet in the surf
  idSeaRock(ctx, x, y, t, th, d) { const w = d.w, h = d.h; ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2 + 6, y - h + 4); ctx.quadraticCurveTo(x, y - h - 6, x + w / 2 - 6, y - h + 2); ctx.lineTo(x + w / 2, y); ctx.fill(); ctx.fillStyle = '#4a4a54'; ctx.fillRect(x - w / 2 + 8, y - h + 2, w - 16, 4); ctx.fillStyle = 'rgba(230,255,255,0.7)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x - w / 2 + 6 + k * (w - 12) / 5, y - 2 + Math.sin(t * 3 + k) * 2, 4, 0, TAU); ctx.fill(); } },
  // a little festival flag on the launch ledge (it shows the wind)
  idKiteFlag(ctx, x, y, t) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 1, y - 60, 3, 60); ctx.fillStyle = KITE[0]; ctx.beginPath(); ctx.moveTo(x + 2, y - 60); ctx.quadraticCurveTo(x + 18, y - 58 + Math.sin(t * 6) * 3, x + 30, y - 52); ctx.lineTo(x + 2, y - 46); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 2, y - 54, 20, 3); },
  // a warm updraft over the terraces: shimmering air and seeds drifting up
  idThermal(ctx, x, y, t, th, d) { const h = d.h || 200; ctx.save(); for (let k = 0; k < 9; k++) { const ph = (t * 0.7 + k / 9) % 1, yy = y - ph * h; ctx.fillStyle = `rgba(255,250,220,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.ellipse(x + Math.sin(k * 2 + t * 2) * 10, yy, 3, 1.5, t + k, 0, TAU); ctx.fill(); } ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 18, y); for (let yy = 0; yy < h; yy += 20) ctx.lineTo(x + s * (18 + Math.sin(t * 3 + yy * 0.05) * 4), y - yy); ctx.stroke(); } ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 18, y - 4, 36, 4); ctx.restore(); },
  // the rice barn on stilts: a thatched saddle roof over a little loft
  idLumbung(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, top = y - h;
    ctx.fillStyle = '#6a4a2a'; for (const s of [-1, 1]) ctx.fillRect(x + s * (w / 2 - 16) - 3, y - h * 0.45, 6, h * 0.45);
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - w / 2 + 8, y - h * 0.48, w - 16, 6);
    ctx.fillStyle = '#a87a4a'; ctx.fillRect(x - w / 2 + 18, top + h * 0.28, w - 36, h * 0.22);
    ctx.fillStyle = '#c8a05a'; ctx.beginPath(); ctx.moveTo(x - w / 2, top + h * 0.34); ctx.quadraticCurveTo(x - w / 2 + 20, top - 6, x, top - 10); ctx.quadraticCurveTo(x + w / 2 - 20, top - 6, x + w / 2, top + h * 0.34); ctx.lineTo(x + w / 2 - 14, top + h * 0.3); ctx.lineTo(x - w / 2 + 14, top + h * 0.3); ctx.fill();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1; for (let k = 0; k < 12; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 10 + k * (w - 20) / 11, top + h * 0.3); ctx.lineTo(x - w / 2 + 16 + k * (w - 32) / 11, top); ctx.stroke(); }
  },
  // the old sulfur-mine track running into the mountain
  idMineRails(ctx, x, y) { ctx.fillStyle = '#5a4030'; for (let k = 0; k < 8; k++) ctx.fillRect(x - 10 + k * 16, y - 4, 10, 4); ctx.fillStyle = '#7a7a84'; ctx.fillRect(x - 12, y - 6, 140, 2); ctx.fillStyle = '#5a5a64'; rr(ctx, x + 6, y - 26, 40, 18, 4); ctx.fill(); ctx.fillStyle = '#e8d040'; ctx.beginPath(); ctx.ellipse(x + 26, y - 26, 18, 6, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#2a2a30'; for (const wx of [14, 38]) { ctx.beginPath(); ctx.arc(x + wx, y - 6, 4, 0, TAU); ctx.fill(); } },
  // the sign over the old tunnel mouth: a plank with the mine's name, a lantern on a hook, sulfur crusted on the rock
  idMineMouth(ctx, x, y, t, th, d) { const h = d.h; ctx.fillStyle = '#e8d040'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - 30 + k * 14, y - h - 2 + (k % 2) * 4, 5, 0, TAU); ctx.fill(); } TourObj.plank(ctx, x - 26, y - h - 18, 52, 12); ctx.fillStyle = '#3a2410'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('TAMBANG', x, y - h - 9); },
  // the gap in the old garden wall (mossy blocks, roots spilling over)
  idWallGap(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h;
    for (const s of [-1, 1]) { const x0 = x + s * w * 0.32 - 22; for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) { ctx.fillStyle = (r + c) % 2 ? '#959a86' : '#a4a894'; rr(ctx, x0 + c * 22 + (r % 2) * 4, y - (r + 1) * 30, 20, 28, 3); ctx.fill(); } ctx.fillStyle = '#7aa860'; ctx.beginPath(); ctx.ellipse(x0 + 22, y - h - 2, 26, 9, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#7a6450'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - w * 0.45 + k * 6, y - h); ctx.quadraticCurveTo(x - w * 0.5 + k * 4, y - h * 0.5, x - w * 0.42 + k * 7, y - 10); ctx.stroke(); }
  },
  // a giant dipterocarp tree with buttress roots (9-6)
  idGiantTree(ctx, x, y, t, th, d) { const h = d.h; ctx.fillStyle = '#a89878'; ctx.fillRect(x - 18, y - h, 36, h); ctx.beginPath(); ctx.moveTo(x - 18, y - 60); ctx.quadraticCurveTo(x - 24, y - 10, x - 56, y); ctx.lineTo(x + 56, y); ctx.quadraticCurveTo(x + 24, y - 10, x + 18, y - 60); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,40,0.35)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 12 + k * 8, y - h); ctx.lineTo(x - 13 + k * 8, y - 20); ctx.stroke(); } ctx.fillStyle = '#3e7a36'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x - 60 + k * 24, y - h - 8 + (k % 2) * 10, 28, 0, TAU); ctx.fill(); } },
  // where a liana hangs from: a knot of leaves on a high bough
  idLianaTop(ctx, x, y, t) { ctx.fillStyle = '#5a4a32'; rr(ctx, x - 40, y - 8, 80, 10, 5); ctx.fill(); ctx.fillStyle = '#3e7a36'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x - 32 + k * 16, y - 10, 13, 7, 0, 0, TAU); ctx.fill(); } },
  // heaps of yellow sulfur blocks (9-7)
  idSulfurPile(ctx, x, y) { for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#e8d040' : '#c8b030'; rr(ctx, x - 16 + (k % 3) * 10, y - 10 - Math.floor(k / 3) * 9, 12, 9, 2); ctx.fill(); } },
  // the gecko who keeps the warung, perched on the counter post
  idWarungGecko(ctx, x, y, t) { ctx.fillStyle = '#7a9ac8'; ctx.beginPath(); ctx.ellipse(x, y - 12, 9, 11, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 2, y - 27, 9, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff8a3a'; for (const [dx, dy] of [[-4, -16], [3, -10], [-2, -6]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.8, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffd23a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + 2 + s * 5, y - 30, 3.4, 0, TAU); ctx.fill(); } ctx.fillStyle = '#1a1020'; for (const s of [-1, 1]) ctx.fillRect(x + 2 + s * 5 - 0.7, y - 32.5, 1.4, 5); ctx.strokeStyle = '#7a9ac8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 6, y - 4); ctx.quadraticCurveTo(x - 20, y - 2, x - 22, y - 12 + Math.sin(t * 3) * 3); ctx.stroke(); },
  // sacks of rice in the barn
  idRiceSacks(ctx, x, y) { for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#e8dcc0' : '#d8c8a0'; rr(ctx, x - 22 + k * 15, y - 18 - (k === 1 ? 8 : 0), 16, 18, 5); ctx.fill(); ctx.fillStyle = '#a88a5a'; ctx.fillRect(x - 20 + k * 15, y - 16 - (k === 1 ? 8 : 0), 12, 2); } },
  // mine crates and a parked cart in the tunnel (9-3's tambang)
  idMineCart(ctx, x, y) { ctx.fillStyle = '#5a5a64'; rr(ctx, x - 22, y - 24, 44, 18, 4); ctx.fill(); ctx.fillStyle = '#e8d040'; ctx.beginPath(); ctx.ellipse(x, y - 24, 20, 7, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#2a2a30'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 13, y - 5, 5, 0, TAU); ctx.fill(); } },
  // the shells, net and oars in the sea cave
  idNet(ctx, x, y) { ctx.strokeStyle = 'rgba(220,210,180,0.7)'; ctx.lineWidth = 1; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x - 20 + k * 8, y - 30); ctx.lineTo(x - 24 + k * 8, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 24, y - 30 + k * 6); ctx.lineTo(x + 24, y - 30 + k * 6); ctx.stroke(); } ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + 18, y - 40, 4, 40); },
  // a garden wall behind the grove: plain mossy blocks, arched openings, roots (no carvings, no statues)
  idGardenWall(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2;
    ctx.fillStyle = 'rgba(149,154,134,0.55)'; ctx.fillRect(x0, y - h, w, h);
    ctx.strokeStyle = 'rgba(80,86,72,0.45)'; ctx.lineWidth = 1;
    for (let yy = y - h + 26; yy < y; yy += 26) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy); ctx.stroke(); for (let xx = x0 + ((yy / 26) % 2) * 24; xx < x0 + w; xx += 48) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy - 26); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(62,74,60,0.6)'; for (let k = 0; k < 3; k++) { const ax = x0 + w * (0.2 + k * 0.3); ctx.beginPath(); ctx.moveTo(ax - 22, y); ctx.lineTo(ax - 22, y - 70); ctx.arc(ax, y - 70, 22, Math.PI, TAU); ctx.lineTo(ax + 22, y); ctx.fill(); }
    ctx.fillStyle = 'rgba(122,168,96,0.7)'; for (let xx = x0; xx < x0 + w; xx += 30) { ctx.beginPath(); ctx.ellipse(xx + 15, y - h, 20, 8, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(122,100,80,0.6)'; ctx.lineWidth = 2; for (let k = 0; k < 9; k++) { const rx = x0 + 30 + k * (w - 60) / 8; ctx.beginPath(); ctx.moveTo(rx, y - h); ctx.quadraticCurveTo(rx + Math.sin(k) * 14, y - h * 0.5, rx + Math.sin(k * 2) * 8, y - h * 0.25 - (k % 3) * 20); ctx.stroke(); }
  }
});

/* ---------------- stamps ---------------- */
const stamps = {
  // 9-1 (s): the sea cave under the pier: a tidal pool, a fishing net, Bottle Mail #5 on a ledge, P2
  gua: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [6, 10, 'n'],
      [9, 11, 'WWWWWWWW'], [9, 12, 'WWWWWWWW'],
      [10, 7, '----'], [11, 5, '*'], [9, 4, 'o.o.o.o'],
      [20, 8, '-----'], [22, 4, '?'], [20, 6, 'o...o'],
      [24, 10, 'q'], [27, 10, 'k']
    ]),
    legend: { n: ['decor', 'idNet'], k: ['decor', 'idShells'], q: ['piece', 'bottle', { n: 5 }] },
    items: ['star'],
    doors: [{ to: 'ombak@guaBack', look: 'idSeaCave' }],
    gold: { '*': 'hidden' }
  },
  // 9-2 (s): inside the rice barn: sacks of rice, a ladder of beams, P2, and the back door to the Borneo canopy
  lumbung: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [6, 10, 'r'], [12, 10, 'r'],
      [8, 8, '---'], [12, 6, '---'], [16, 4, '---'], [17, 2, '*'], [6, 4, 'o.o'],
      [21, 7, '?'], [26, 10, 'g'], [23, 10, 'n']
    ]),
    legend: { r: ['decor', 'idRiceSacks'], n: ['spawn', 'sign', { text: 'THE BARN\'S BACK DOOR OPENS ONTO A FAR-OFF RAINFOREST... A SECRET LEVEL!' }] },
    items: ['oneup'],
    doors: [{ to: 'sawah@lumbungBack', look: 'idBarnDoor' }],
    gold: { '*': 'hidden' }
  },
  // 9-3 (s): the old sulfur mine inside the mountain: a parked cart, P2, and the track on toward a blue glow
  tambang: {
    floor: 11,
    rows: room(32, 14, 11, [
      [2, 10, '@.D'], [8, 10, 'm'],
      [11, 7, '-----'], [13, 5, '*'], [10, 4, 'o.o.o.o'],
      [19, 7, '?'], [24, 8, '---'], [28, 10, 'g'], [25, 10, 'n']
    ]),
    legend: { m: ['decor', 'idMineCart'], n: ['spawn', 'sign', { text: 'THE OLD TRACK RUNS ON TO A CRATER GLOWING BLUE... A SECRET LEVEL!' }] },
    items: ['oneup'],
    doors: [{ to: 'gunung@tambangBack', look: 'tourDoor' }],
    gold: { '*': 'hidden' }
  },
  // 9-4 (s): the air pocket in the sunken outrigger's hold: dry planks, P2, a gangway up to a gecko's warung
  kapal: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [8, 8, '----'], [10, 6, '*'], [7, 5, 'o.o.o'],
      [16, 7, '?'], [20, 9, '--'], [22, 7, '--'], [24, 5, '--'], [26, 10, 'g'], [23, 10, 'n']
    ]),
    legend: { n: ['spawn', 'sign', { text: 'A GANGWAY UP TO A GECKO\'S WARUNG: A SOUVENIR STAND!' }] },
    items: ['oneup'],
    doors: [{ to: 'laut@kapalBack', look: 'idHatch' }],
    gold: { '*': 'hidden' }
  },
  // 9-5 (s): the hollow behind the banyan roots: root ledges, coins, P2
  akar: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [7, 10, 'u'],
      [9, 8, '---'], [13, 6, '---'], [17, 4, '---'], [18, 2, '*'], [12, 3, 'o.o.o'],
      [22, 7, '?'], [25, 10, 'u']
    ]),
    legend: { u: ['decor', 'idBanana'] },
    items: ['oneup'],
    doors: [{ to: 'hutan@akarBack', look: 'idGroveDoor' }],
    gold: { '*': 'hidden' }
  },
  // 9-6 (s): the orangutan's leaf nest: soft and bouncy, P2
  nest: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [7, 10, 'bbbb'], [14, 7, '----'], [16, 5, '*'], [12, 4, 'o.o.o.o'],
      [22, 7, '?'], [24, 10, 'f']
    ]),
    legend: { f: ['decor', 'idFern'] },
    items: ['oneup'],
    doors: [{ to: 'rimba@nestBack', look: 'idNest' }],
    gold: { '*': 'hidden' }
  },
  // 9-7 (s): the miners' depot at the dead end: a Hard Hat on the bench, P2; its back door opens at the end of the line
  depot: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [7, 10, 'm'],
      [11, 8, '----'], [13, 6, '*'], [10, 5, 'o.o.o'],
      [19, 7, '?'], [23, 10, 'z'], [26, 10, 'E']
    ]),
    legend: { m: ['decor', 'idMineCart'], z: ['decor', 'idSulfurPile'], E: ['spawn', 'sign', { text: 'THE DEPOT\'S BACK DOOR (UP AT THE DOOR) LEADS OUT TO THE END OF THE LINE' }] },
    items: ['oneup'],
    doors: [{ to: 'ijen@depotBack', look: 'idDepotDoor' }],
    gold: { '*': 'hidden' }
  },
  // the Souvenir Stand: a gecko's warung
  stand: {
    floor: 10,
    rows: room(28, 12, 10, [[2, 9, '@'], [5, 9, 'k'], [8, 9, 'q'], [11, 9, '$'], [22, 9, 'k'], [24, 9, 'G']]),
    legend: { k: ['decor', 'idFrangipani'], q: ['decor', 'idWarungGecko'] }
  }
};

/* ---------------- the levels ---------------- */
const levels = [
  // 9-1 RIDE: the surf at Kuta; a sea cave under the old pier hides Bottle Mail #5
  { n: 1, name: 'Kuta Surf', arch: 'ride', theme: 'id_surf',
    gimmick: 'A gecko lends a surfboard: ride the swells, hop the lava-rock reefs, launch off a big set for the high coins',
    hint: 'Surf the sea! Jump off a wave crest for big air. THROW sprays water',
    postcard: 'Brady! Bali smells like frangipani and sunscreen. The Baron\'s blimp went inland. Catch a wave and follow! ♥ C',
    enemies: [['idUrchin', 2], ['idFlyfish', 2]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '9-2' } },
    areas: [
      { id: 'ombak', gen: 'strip', mode: 'auto', W: 220, H: 17, GY: 13, surf: true, scroll: 2.5,
        script: [
          'gecko',
          ['itemBlock', { item: 'power', y: 4 }],
          // ① the swells
          ['surf', { n: 9, tight: true }],
          ['jukung', { tight: true }],
          ['surf', { n: 7, jelly: 1, tight: true }],
          ['sandbar', { n: 6 }],
          // ② lava-rock reefs with urchins, the old pier and its sea cave
          ['reef', { urchin: true, tight: true }],
          ['surf', { n: 6, fish: 1, tight: true }],
          ['reef', { tall: true, urchin: true, tight: true }],
          ['pierCave', { to: 'gua@in', back: 'guaBack', tight: true }],
          ['surf', { n: 5, tight: true }],
          'cp',
          // ③ the big sets
          ['lip', { gold: 'must', tight: true }],
          ['surf', { n: 6, fish: 2, tight: true }],
          ['buoys', { gold: 'risky', tight: true }],
          ['reef', { urchin: true, tight: true }],
          ['lip', { tight: true }],
          ['starBar', { item: 'power' }],
          ['surf', { n: 6, jelly: 1, tight: true }],
          ['end', { exit: 'main' }]
        ] },
      { id: 'gua', gen: 'room', role: 'secret', stamp: 'gua' }
    ] },
  // 9-2 GLIDE: the kite festival over the rice terraces
  { n: 2, name: 'Kite Festival', arch: 'glide', theme: 'id_kites',
    gimmick: 'Fold a paper plane and glide over the rice terraces: ride the giant kites, warm air lifts you, ducks paddle across in a line',
    hint: 'Hold jump while falling to glide with the paper plane. Warm air rises over the terraces',
    postcard: 'The whole sky is full of kites! One of them looks like the Baron\'s blimp... no, it\'s a fish. ♥ C',
    enemies: [['idDuck', 1], ['idScarecrow', 1], ['idDragonfly', 2]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '9-3' }, secret: { to: '9-6', hint: 'A rice barn on stilts has a door up in its loft...' } },
    areas: [
      { id: 'sawah', gen: 'islands', W: 240, H: 30, GY: 18, gyMin: 7, gyMax: 23,
        script: [
          ['gearStand', { item: 'plane' }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['itemBlock', { item: 'cake', y: 4 }],   // a jump power (bonus)
          // ① kites over the terraces
          ['terraceIsle', { n: 3 }],
          ['glideGap', { w: 12, drop: 3 }],
          ['kites', { n: 2 }],
          ['postcard', { kind: 'must', dx: -8, dy: -6 }],
          ['terraceIsle', { n: 2, down: true, enemy: 'idDuck' }],
          // ② scarecrows, a duck parade as a bridge, the rice barn
          'scarecrows',
          ['duckRaft', { span: 10 }],
          ['lumbung', { to: 'lumbung@in', back: 'lumbungBack' }],
          ['glideGap', { w: 13, drop: 2 }],
          'cp',
          // ③ the kite relay in a strong wind
          ['gearStand', { item: 'plane' }],
          ['windKites', { n: 3, gold: 'risky' }],
          ['itemBlock', { item: 'wand', y: 4 }],
          ['paddy', {}],
          ['glideGap', { w: 14, drop: 3 }],
          ['terraceIsle', { n: 2 }],
          ['end', { exit: 'main' }]
        ] },
      { id: 'lumbung', gen: 'room', role: 'secret', stamp: 'lumbung' }
    ] },
  // 9-3 DOOM: Batur erupts at dawn; the lava flow chases Brady down the mountain
  { n: 3, name: 'Batur Eruption', arch: 'doom', theme: 'id_batur',
    gimmick: 'Batur erupts at dawn: run down the mountain ahead of the lava, dodge the lava bombs, cross the hot rocks while they are dark',
    hint: 'Keep running downhill! A glowing ring means a lava bomb lands there. The Snow Globe cools the hot rocks',
    postcard: 'We climbed in the dark to watch the sunrise and the volcano woke up. We ran. Fast. ♥ C',
    enemies: [['idCivet', 2], ['idBat', 1], ['idTokay', 2]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '9-4' }, secret: { to: '9-7', hint: 'An old mine track runs into the mountain...' } },
    areas: [
      { id: 'gunung', gen: 'strip', W: 220, H: 22, GY: 8, gyMin: 6, gyMax: 19, chase: { speed: 3.4, ramp: 0.25, look: 'lava' },
        script: [
          'summit',
          ['itemBlock', { item: 'power', y: 4 }],
          // ① the flow breaks loose; bombs and hot rocks on the way down
          ['descend', { n: 3 }],
          ['bombs', { len: 14 }],
          ['hotrocks', { n: 5 }],
          ['itemBlock', { item: 'globe', y: 4 }],
          ['descend', { n: 2 }],
          'lookout',
          // ② bombs and hot rocks together; tokay geckos on the bluffs; the mine track
          ['bombs', { len: 16, every: 1.5 }],
          ['bluff', {}],
          ['mineMouth', { to: 'tambang@in', back: 'tambangBack' }],
          ['descend', { n: 2 }],
          'cp',
          // ③ civets in the ash fields while the flow speeds up
          'civets',
          ['hotrocks', { n: 6, phase: 2 }],
          ['fissure', { gold: 'risky' }],
          ['descend', { n: 3 }],
          ['bombs', { len: 14, every: 1.3 }],
          ['end', { exit: 'main' }]
        ] },
      { id: 'tambang', gen: 'room', role: 'secret', stamp: 'tambang' }
    ] },
  // 9-4 LAMP (in the water): the night dive at Manta Point
  { n: 4, name: 'Manta Night Dive', arch: 'lamp', theme: 'id_dive',
    gimmick: 'A night dive by lamplight: glowing plankton clouds restore your light, anglerfish dangle fake coins, ride a manta\'s slipstream',
    hint: 'Your light fades: swim through the glowing plankton to bring it back. That coin in the dark might be a lure!',
    postcard: 'Night diving! A manta ray swam right over me like a big friendly blanket. ♥ C',
    enemies: [['idLionfish', 2]],
    mapCell: [2, 1], mapFrom: 2,
    exits: { main: { to: '9-5' }, secret: { to: 'house:id-warung', hint: 'A sunken outrigger\'s hold has air inside...' } },
    areas: [
      { id: 'laut', gen: 'swim', width: 320, H: 18, dark: true, lamp: { r0: 170, r1: 70, decay: 22 },
        script: [
          'biolum',
          ['gearStand', { item: 'fins' }],
          ['niche', { item: 'power' }],
          // ① plankton clouds restore the light
          'plankton',
          ['reefGate2', { gold: 'must' }],
          'plankton',
          // ② anglerfish dangle fake coins; the sunken outrigger
          ['anglers', { n: 2 }],
          ['gearStand', { item: 'hat' }],
          ['wreckDoor', { to: 'kapal@in', back: 'kapalBack' }],
          'plankton',
          'morays',
          'cp',
          // ③ the manta run through moray shafts as the light fades
          ['manta', { w: 18, gold: 'risky' }],
          'morays',
          'plankton',
          ['anglers', { n: 3 }],
          ['manta', { w: 16 }],
          'jellies'
        ] },
      { id: 'kapal', gen: 'room', role: 'secret', stamp: 'kapal' }
    ] },
  // 9-5 LAIR: the monkey forest, then Boss Kera in the durian grove
  { n: 5, name: 'Monkey Forest', arch: 'lair', theme: 'id_ruins', boss: 'id_kera',
    gimmick: 'A jungle garden by an old mossy wall: macaques snatch power-ups, durian trees drop their fruit, gongs open the gate; then Boss Kera',
    hint: 'Boss Kera laughs at stomps. Land on a branch of the tree he perches in: a durian drops on his head!',
    postcard: 'The rice terraces are back! The Baron flew north to Vietnam. I smell pho. ♥ C',
    enemies: [['idSate', 2], ['idMacaque', 2]],
    mapCell: [1, 2], mapFrom: 3,
    exits: { main: { to: 'country:next' } },
    areas: [
      { id: 'hutan', gen: 'strip', W: 84, H: 20,
        script: [
          ['itemBlock', { item: 'power', y: 4 }],
          'meetMacaque',
          ['leadTree', { gold: 'must' }],
          ['rootCurtain', { to: 'akar@in', back: 'akarBack' }],
          ['wallSteps', { item: 'power' }],
          'cp',
          ['gongs', { n: 3 }],
          ['postcard', { kind: 'risky', dx: -12, dy: -5 }],
          ['groveGate', { to: 'grove' }]
        ] },
      { id: 'akar', gen: 'room', role: 'secret', stamp: 'akar' },
      { id: 'grove', gen: 'arena', role: 'arena', layout: 'grove', arenaW: 26, H: 22, roof: false }
    ] },
  // 9-6 SWING (secret): the Borneo canopy with the orangutans
  { n: 6, name: 'Orangutan Canopy', arch: 'swing', secret: true, theme: 'id_rimba',
    gimmick: 'Swing on lianas through the Borneo canopy; orangutan friends throw you across; hornbills dart over the gaps',
    hint: 'Jump into a liana to grab it. Sit in an orangutan\'s hands and press THROW to fly',
    postcard: 'An orangutan threw me across the forest. Very gently. Then it waved. ♥ C',
    enemies: [['idHornbill', 2], ['idTokay', 1], ['idMacaque', 1], ['idRafflesia', 1]],
    mapCell: [0, 1], mapFrom: 1,
    exits: { main: {} },
    areas: [
      { id: 'rimba', gen: 'islands', W: 210, H: 26, GY: 16, gyMin: 6, gyMax: 20,
        script: [
          ['gearStand', { item: 'wand' }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['itemBlock', { item: 'socks', y: 4 }],   // a jump power (bonus)
          // ① lianas between the giant trees
          ['lianas', { n: 3 }],
          'rafflesiaIsle',
          // ② the orangutans throw you
          ['orangutan', { to: [15, -2], gold: 'must' }],
          ['lianas', { n: 2 }],
          ['nestTree', { to: 'nest@in', back: 'nestBack' }],
          'cp',
          // ③ hornbills dart across the swing chains
          ['lianas', { n: 3, hornbill: true, gold: 'risky' }],
          ['enemies', { kind: 'idMacaque', n: 1, len: 8 }],
          ['orangutan', { to: [14, -3] }],
          ['itemBlock', { item: 'lsd', y: 5 }],
          ['lianas', { n: 2, hornbill: true }],
          ['end', { exit: 'main' }]
        ] },
      { id: 'nest', gen: 'room', role: 'secret', stamp: 'nest' }
    ] },
  // 9-7 RAIL (secret): the blue-fire sulfur mine in the crater at night
  { n: 7, name: 'Blue Fire Rails', arch: 'rail', secret: true, theme: 'id_ijen', dark: true,
    gimmick: 'A mine cart through the crater at night: pick the fork, jump the blue flames that burst from the track, dodge the sulfur casks',
    hint: 'Pull a lever post (THROW) to switch the track. Jump the blue flames when the vent hisses',
    postcard: 'Blue fire! Real blue fire, coming out of the ground. The cart did not slow down. ♥ C',
    enemies: [['idBat', 1], ['idTokay', 1]],
    mapCell: [1, 1], mapFrom: 2,
    exits: { main: {} },
    areas: [
      { id: 'ijen', gen: 'rail', len: 200, H: 18, decks: { upper: 6, lower: 11 },
        script: [
          ['railBlock', { item: 'power' }],
          ['flames', { n: 2 }],
          // ① the first fork: both roads pay
          ['fork', { len: 36, upper: [['coinsRow', { n: 8 }], ['railBlock', { item: 'hat' }]], lower: [['flames', { n: 2, gap: 6 }], ['coinsRow', { n: 6 }]] }],
          ['flames', { n: 3, phase: 0.6 }],
          ['sulfurCask', {}],
          // ② flames on the forks; the lower road ends at the depot
          ['fork', { len: 40, gold: false, upper: [['flames', { n: 3 }], ['coinsRow', { n: 6 }]], lower: [['coinsRow', { n: 6 }], ['depotDoor', { to: 'depot@in', back: 'depotBack' }]] }],
          ['flames', { n: 2, phase: 1.2, period: 2.6 }],
          // ③ the last fork under the sulfur smoke: only the flames light the way
          ['fork', { len: 36, upper: [['flames', { n: 2, gap: 8 }]], lower: [['sulfurCask', {}], ['flames', { n: 2 }]] }],
          ['flames', { n: 2, period: 2.4 }]
        ] },
      { id: 'depot', gen: 'room', role: 'secret', stamp: 'depot' }
    ] }
];

for (const k in P) Tour.pieces['id.' + k] = P[k];
Tour.amend('id', {
  stamps, skins,
  map: { fort: 'grove', start: [0, 0] },
  houses: [{ id: 'id-warung', kind: 'stand', name: 'Warung', keeper: 'gecko', stock: ['fins', 'wand', 'magnet', 'sundial', 'oneup', 'globe'], mapCell: [2, 2], mapFrom: 3 }],
  levels
});
})();
