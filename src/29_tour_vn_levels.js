/* ============================================================
   Vietnam (world 10): the levels in the v2 format
   (LEVEL_OVERHAUL.md §2 "World 10", §3.2 graph). Loads after
   29_tour_vn.js (the look, the cast, the noodle lasso, Ong Phin)
   and adds, with Tour.amend: the stamps, the country looks for
   library objects, the set pieces of the overhaul, the Souvenir
   Stand Chợ Nhỏ, the map graph and all six levels. France's
   secret flight (7-7) lands at 10-1.
   ============================================================ */
(() => {
const C = Tour.countries.vn;
if (!C) return;
const K = TourKit;
const LANT = ['#e8323a', '#ffb02a', '#ff5a8a', '#ffd23a', '#2aa86a', '#3a7ad8'];

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
function swingGhosts(B, hx, hy, Lt, span, maxRow) { for (let a = -span; a <= span; a += 0.08) { const gx = Math.round(hx + Math.sin(a) * Lt), gy = Math.min(maxRow == null ? 99 : maxRow, Math.round(hy + Math.cos(a) * Lt + 1.4)); B.ghosts.push([gx, gy]); } }
function water(st, x0, x1) { st.pit(x0, x1); st.B.fill(x0, st.gy + 1, x1, st.H - 1, T.LAVA); }
// a lantern (paper, ribbed) for the art below
function lamp(ctx, x, y, r, col, t) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.2, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; for (const k of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(x, y, r * Math.abs(k) + 0.5, r * 1.2, 0, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - r * 0.5, y - r * 1.3, r, 3); ctx.fillRect(x - r * 0.5, y + r * 1.1, r, 3);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,200,120,${0.18 + 0.08 * Math.sin((t || 0) * 5 + x)})`; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill(); ctx.restore();
}

/* ---------------- objects ---------------- */
// 10-6's trade chain: a pickup at the end of a sub-area; it is a key for the matching friend's lock in the market
const GOODS = {
  coconut(ctx, x, y) { ctx.fillStyle = '#6a8a3a'; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#8aaa4a'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a2a1a'; for (const [dx, dy] of [[-2, -6], [2, -6], [0, -3]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.3, 0, TAU); ctx.fill(); } },
  candy(ctx, x, y) { for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#f4e8c8' : '#e8d4a0'; rr(ctx, x - 12 + k * 8, y - 6 + (k % 2) * 3, 9, 9, 2); ctx.fill(); ctx.strokeStyle = '#c8a05a'; ctx.lineWidth = 1; ctx.strokeRect(x - 12 + k * 8, y - 6 + (k % 2) * 3, 9, 9); } },
  fruit(ctx, x, y) { ctx.fillStyle = '#e8326a'; ctx.beginPath(); ctx.ellipse(x - 5, y, 8, 9, -0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#5ab84a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x - 5 + (k - 1.5) * 4, y - 9, 2, 4, (k - 1.5) * 0.4, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + 7, y + 2, 6, 0, TAU); ctx.fill(); },
  stamp(ctx, x, y) { ctx.fillStyle = '#fff4dc'; rr(ctx, x - 11, y - 11, 22, 22, 2); ctx.fill(); ctx.strokeStyle = '#e8323a'; ctx.lineWidth = 2; ctx.strokeRect(x - 8, y - 8, 16, 16); ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
};
class VnGoods extends Ent {
  constructor(g, s) { super(g, s, 30, 30); this.id = s.id; this.item = s.item || 'coconut'; this.hy = this.y; this.item_ = true; if (g.keys && g.keys.has(this.id)) this.remove = true; }
  update(dt) { this.t += dt; this.y = this.hy + Math.sin(this.t * 2.4) * 4; }
  touchPlayer(p) {
    if (this.remove) return;
    const g = this.g; this.remove = true; g.keys.add(this.id);
    K.sfx('stamp', 'checkpoint'); g.burst(this.cx, this.cy, 18, '#ffd84a', 'confetti');
    g.toast({ coconut: 'A COCONUT! THE WATER BUFFALO WANTS ONE', candy: 'COCONUT CANDY! THE DUCK HAS A SWEET TOOTH', fruit: 'A BOAT-LOAD OF FRUIT! THE GECKO WILL TRADE THE STAMP' }[this.item] || 'GOT IT!');
  }
  draw(ctx) {
    const x = this.cx, y = this.y + 14;
    ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.t * 4); ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill(); ctx.restore();
    Ink.around(ctx, this.x - 6, this.y - 8, this.w + 12, this.h + 16, c => GOODS[this.item](c, x, y, this.t), { pad: 8 });
  }
  get light() { return { r: 70, c: 'rgba(255,240,170,' }; }
}
// a market friend behind a little gate: it opens the gate once Brady brings what it wants (a lock with the item's id)
const FRIENDS = {
  buffalo(ctx, x, y, t) { ctx.fillStyle = '#5a5a64'; ctx.beginPath(); ctx.ellipse(x, y - 18, 20, 13, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 18, y - 26, 9, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 18, y - 34, 10, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.fillStyle = '#4a4a54'; for (const lx of [-12, -4, 6, 12]) ctx.fillRect(x + lx, y - 8, 4, 8); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x + 21, y - 28, 1.4, 0, TAU); ctx.fill(); },
  duck(ctx, x, y, t) { ctx.fillStyle = '#f4f0e4'; ctx.beginPath(); ctx.ellipse(x, y - 10, 12, 9, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + 8, y - 22, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffa81a'; ctx.beginPath(); ctx.moveTo(x + 14, y - 22); ctx.lineTo(x + 22, y - 20 + Math.sin(t * 6) * 1.5); ctx.lineTo(x + 14, y - 18); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x + 10, y - 24, 1.3, 0, TAU); ctx.fill(); },
  gecko(ctx, x, y, t) { ctx.fillStyle = '#7a9ac8'; ctx.beginPath(); ctx.ellipse(x, y - 10, 8, 10, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 2, y - 24, 8, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + 2 + s * 4, y - 27, 3, 0, TAU); ctx.fill(); } ctx.fillStyle = '#1a1020'; for (const s of [-1, 1]) ctx.fillRect(x + 2 + s * 4 - 0.6, y - 29, 1.2, 4); ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.arc(x - 3, y - 12, 1.6, 0, TAU); ctx.arc(x + 3, y - 6, 1.6, 0, TAU); ctx.fill(); }
};
class VnTradeGate extends ENTITY_TYPES.lock {
  constructor(g, s) { super(g, s); this.icon = s.icon || 'coconut'; this.friend = s.friend || 'buffalo'; }
  draw(ctx) {
    const x = this.x + 6, y = this.y, w = TS, h = this.h, k = this.open ? clamp(1 - (this.openT || 0) / 0.6, 0, 1) : 0;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 3, y - 6, 6, h + 6); ctx.fillRect(x + w - 3, y - 6, 6, h + 6);
    const hh = h * (1 - k);
    for (let yy = 0; yy < hh; yy += 8) { ctx.fillStyle = yy % 16 ? '#c8a05a' : '#a8803a'; ctx.fillRect(x + 1, y + yy, w - 2, Math.min(7, hh - yy)); }
    FRIENDS[this.friend](ctx, x - 26, y + h, this.t);
    if (k < 0.5) { ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.arc(x - 18, y - 4, 13, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 24, y + 6); ctx.lineTo(x - 20, y + 14); ctx.lineTo(x - 14, y + 7); ctx.fill(); ctx.save(); ctx.translate(x - 18, y - 4); ctx.scale(0.6, 0.6); GOODS[this.icon](ctx, 0, 0, this.t); ctx.restore(); }
    const done = this.g.keys.has(this.id); ctx.fillStyle = done ? '#7ae07a' : '#ffd84a'; ctx.beginPath(); ctx.arc(x + w / 2, y - 12, 4, 0, TAU); ctx.fill();
  }
}
Object.assign(ENTITY_TYPES, { vnGoods: VnGoods, vnTradeGate: VnTradeGate });

/* ---------------- pieces ---------------- */
const P = {
  /* ---- shared ---- */
  // a pickup for the trade chain at the end of a sub-area: { id, item }
  goods(st, o) { const x = st.x; st.floor(x, x + 4); st.B.spawn('vnGoods', x + 2, st.gy - 2, { id: o.id, item: o.item }); st.B.vkey(o.id, [[x + 2, st.gy - 1], [x + 2, st.gy - 2]]); return x + 5; },
  // a friend's gate (from a stamp letter at its bottom cell): { id, icon, friend, h }; solid wall above it to the roof
  tradeGate(st, o) {
    const B = st.B, x = st.x, y1 = st.gy - 1, h = o.h || 5, tiles = [];
    for (let y = y1 - h + 1; y <= y1; y++) { B.set(x, y, T.HARD); tiles.push([x, y]); }
    B.locks.push({ id: o.id, tiles });
    B.spawn('vnTradeGate', x, y1, { id: o.id, h, icon: o.icon, friend: o.friend });
    return x;
  },

  /* ---- 10-1 Train Street ---- */
  // the headline: the flying hats, with a sign the first time
  meetNon(st, o) {
    const x = st.x, n = 12; st.floor(x, x + n - 1);
    st.sign(x + 1, 'FLYING HATS SWOOP OUT AND BOOMERANG BACK. HOP ON THE BRIM FOR A RIDE!');
    st.B.fill(x + 8, st.gy - 3, x + 9, st.gy - 3, T.SEMI); st.spawn('vnNon', x + 8, st.gy - 5, {});
    st.coins(x + 3, x + 7, st.gy - 3);
    return x + n;
  },
  // a tower of plastic stools in front of a café: hop up it (P1 on top)
  stoolTower(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 10);
    for (const [dx, h] of [[2, 2], [4, 4], [6, 6]]) { B.prop('vnStoolStack', x + dx, st.gy - h, 1, h, 'body', { h }); }
    st.coins(x + 1, x + 7, st.gy - 8);
    if (o.gold) st.gold(x + 6, st.gy - 9, o.gold);
    if (o.non) st.spawn('vnNon', x + 9, st.gy - 7, {});
    return x + 11;
  },
  // a café front whose back wall is thin (a fake wall with a draft): behind it, the café's back room
  cafe(st, o) {
    const x = st.x; st.B.prop('vnCafeFront', x, st.gy - 5, 8, 5, 'none', {});
    return Tour.pieces.secretDoor(st, { to: o.to, look: 'fake', back: o.back });
  },
  // a train-street stretch with the tangled wires right over the tracks: lasso a knot and swing while the train passes
  trainWires(st, o) {
    const B = st.B, x0 = st.x, end = Tour.pieces['vn.trainstreet'](st, { len: o.len || 26, n: 0, period: o.period || 9 });
    for (let hx = x0 + 5; hx < end - 3; hx += 7) { st.spawn('vnHook', hx, st.gy - 6, { look: 'knot' }); swingGhosts(B, hx, st.gy - 6, 3.4, 1.0, st.gy - 1); }
    if (o.gold) st.gold(x0 + 12, st.gy - 7, o.gold);
    return end;
  },

  /* ---- 10-2 Ha Long Bay on the junk (st.deck is the junk's deck) ---- */
  // the lasso hangs on a hook over the deck at the dock
  dockLasso(st) { st.block(st.x + 2, st.deck - 4, 'sig'); st.coins(st.x, st.x + 4, st.deck - 2); return st.x + 6; },
  // limestone rocks poking out of the bay in the junk's way: hop over them
  rocks(st, o) { const x = st.x, B = st.B, n = o.n || 2; for (let k = 0; k < n; k++) { const rx = x + k * 5; B.fill(rx, st.deck - 1, rx, st.deck - 1, T.HARD); B.setHide(rx, st.deck - 1, 1); B.prop('vnRock', rx, st.deck - 1, 1, 1, 'none', {}); st.arc(rx - 1, rx + 1, st.deck - 2, 2); } return x + n * 5 + 1; },
  // a small karst with a ledge to hop onto from the deck (a mantis shrimp lives there)
  karstLedge(st, o) {
    const x = st.x, B = st.B, fy = st.deck - 4;
    for (let q = 0; q < 5; q++) B.set(x + q, fy, T.SEMI); B.prop('vnKarstTop', x, fy, 5, st.H - fy, 'none', {});
    st.coins(x, x + 4, fy - 2); if (o.shrimp) st.enemy('vnShrimp', x + 3, fy, { edgeTurn: true });
    if (o.item) st.block(x + 2, fy - 4, o.item);
    if (o.gold) st.gold(x + 2, fy - 3, o.gold);
    return x + 8;
  },
  // a tree growing out of a karst overhang above the bay: lasso it from the deck and swing up to the karst top
  cliffTree(st, o) {
    const x = st.x, B = st.B, hx = x + 3, hy = st.deck - 7;
    B.fill(x - 1, hy - 3, x + 5, hy - 2, T.GROUND);
    st.spawn('vnHook', hx, hy, { look: 'branch', dir: 1 }); swingGhosts(B, hx, hy, 3.6, 1.2, st.deck - 1);
    const lx = x + 7, ly = st.deck - 6; for (let q = 0; q < 5; q++) B.set(lx + q, ly, T.SEMI); B.prop('vnKarstTop', lx, ly, 5, st.H - ly, 'none', {});
    st.coins(lx, lx + 4, ly - 2); if (o.gold) st.gold(lx + 2, ly - 3, o.gold);
    return x + 13;
  },
  // leaping squid and a cormorant
  squids(st, o) { const x = st.x; st.spawn('vnSquid', x + 2, st.H - 2, { delay: 0 }); st.spawn('vnSquid', x + 6, st.H - 2, { delay: 0.8 }); st.coins(x + 1, x + 7, st.deck - 3); if (o.bird) st.spawn('vnCormorant', x + 5, st.deck - 6, {}); return x + 9; },
  // a sea cave straight through a karst: the rock closes in overhead, stalactites drip, an item block in the roof
  seaCave(st, o) {
    const x = st.x, B = st.B, n = o.n || 14;
    B.fill(x, 0, x + n - 1, st.deck - 5, T.GROUND); B.prop('vnCaveRoof', x, st.deck - 5, n, 1, 'none', {});
    st.block(x + 5, st.deck - 5, o.item || 'power'); st.coins(x + 2, x + n - 3, st.deck - 3);
    st.spawn('vnBat', x + 9, st.deck - 3, {});
    return x + n + 1;
  },
  // the cave mouth high on a karst cliff: lasso the cliff tree to swing up to its ledge (the way to a hidden cove)
  caveMouth(st, o) {
    const x = st.x, B = st.B, hx = x + 3, hy = st.deck - 7;
    B.fill(x - 1, hy - 3, x + 12, hy - 2, T.GROUND);
    st.spawn('vnHook', hx, hy, { look: 'branch', dir: 1 }); swingGhosts(B, hx, hy, 3.6, 1.2, st.deck - 1);
    const lx = x + 7, ly = st.deck - 6; for (let q = 0; q < 6; q++) B.set(lx + q, ly, T.SEMI); B.prop('vnKarstTop', lx, ly, 6, st.H - ly, 'none', {});
    B.spawn('portal', lx + 4, ly - 1, { kind: 'door', look: 'vnCaveMouth', targetRef: o.to });
    B.spawn('vnCaveBats', lx + 4, ly - 1, {});
    if (o.back) B.anchor(o.back, lx + 1, ly - 1);
    return x + 14;
  },
  // two cliff trees in a row: swing from one to the next over a long stretch
  doubleTree(st, o) {
    const x = st.x, B = st.B; B.fill(x - 1, st.deck - 10, x + 13, st.deck - 9, T.GROUND);
    for (const dx of [3, 9]) { st.spawn('vnHook', x + dx, st.deck - 7, { look: 'branch', dir: dx < 5 ? 1 : -1 }); swingGhosts(B, x + dx, st.deck - 7, 3.4, 1.15, st.deck - 1); }
    st.coins(x + 2, x + 11, st.deck - 5); if (o.gold) st.gold(x + 6, st.deck - 6, o.gold);
    return x + 15;
  },

  /* ---- 10-3 Hoi An by lantern light ---- */
  // a lantern shop: its big lantern relights Brady's fading light
  lanternShop(st, o) {
    const x = st.x; st.floor(x, x + 8); st.B.prop('vnLanternShopArt', x + 1, st.gy - 4, 7, 4, 'none', {});
    st.x = x + 5; Tour.pieces.lantern(st, { kind: 'relight', look: 'vnShopLantern' }); st.x = x;
    if (o.gold) st.gold(x + 3, st.gy - 6, o.gold);
    return x + 9;
  },
  // an awning beam over the lane: silkworms hang under it on their threads
  silkAwning(st, o) {
    const x = st.x, B = st.B, n = o.len || 12, by = st.gy - 6; st.floor(x, x + n - 1);
    for (let q = 1; q < n - 1; q++) B.set(x + q, by, T.SEMI); B.prop('vnAwning', x + 1, by, n - 2, 1, 'none', {});
    for (let k = 0; k < (o.n || 2); k++) st.spawn('vnSilkworm', x + 3 + k * 4, by + 1, {});
    st.coins(x + 2, x + n - 3, st.gy - 2); st.coins(x + 2, x + n - 3, by - 2);
    if (o.gold) st.gold(x + n - 3, by - 3, o.gold);
    return x + n;
  },
  // floating river lanterns: little paper boats drifting across the canal, ride them over
  riverLanterns(st, o) {
    const x = st.x, n = o.n || 2, span = o.span || 11; st.floor(x, x + 2);
    const x0 = x + 3; water(st, x0, x0 + span - 1);
    for (let k = 0; k < n; k++) { st.spawn('mplat', x0 + 1 + k * 4, st.gy - 1, { pw: 2, ax: (span - 3 - k * 4) * TS, ay: 0, speed: 0.9 + k * 0.2, skin: 'vnFloatLantern' }); }
    for (let q = 0; q < span; q++) st.B.ghosts.push([x0 + q, st.gy]);
    st.coins(x0 + 1, x0 + span - 2, st.gy - 2); if (o.silk) st.spawn('vnMosquito', x0 + 5, st.gy - 4, {});
    if (o.gold) st.gold(x0 + Math.floor(span / 2), st.gy - 4, o.gold);
    st.floor(x0 + span, x0 + span + 3);
    return x0 + span + 4;
  },
  // the lantern workshop's door: lanterns hanging around it (the way to the Mekong)
  workshop(st, o) {
    const x = st.x; st.floor(x, x + 7);
    st.B.prop('vnWorkshopFront', x, st.gy - 5, 8, 5, 'none', {});
    st.B.spawn('portal', x + 4, st.gy - 1, { kind: 'door', look: 'vnWorkshopDoor', targetRef: o.to });
    if (o.back) st.B.anchor(o.back, x + 7, st.gy - 1);
    return x + 8;
  },

  /* ---- 10-4 the flood in the cave (pieces move st.y up) ---- */
  // a skylight garden: a jungle ledge under a shaft of daylight, a door into a hidden pocket
  skyGarden(st, o) {
    const B = st.B, W = st.W, y = st.y - 3, x0 = o.left ? 2 : W - 12;
    B.fill(x0, y, x0 + 9, y, T.GROUND); for (const dx of [1, 4, 8]) B.decorAt('vnFernCave', x0 + dx, y, dx);
    B.spawn('portal', x0 + 5, y - 1, { kind: 'door', look: 'vnGardenDoor', targetRef: o.to });
    if (o.back) B.anchor(o.back, x0 + 2, y - 1);
    B.decorAt('vnSunShaft', x0 + 5, y, 0);
    for (let q = st.mid - 2; q < st.mid + 2; q++) if (q < x0 || q > x0 + 9) B.set(q, y, T.SEMI);
    st.coins(x0 + 1, x0 + 8, y - 2);
    st.top(y - 3);
  },
  // a band with an item block for the fins
  finsBand(st, o) { const B = st.B, W = st.W, y = st.y - 3; B.fill(2, y, 8, y, T.GROUND); st.x = 4; st.gy = y; Tour.pieces.gearStand(st, { item: 'fins', here: true }); B.fill(W - 9, y, W - 3, y, T.GROUND); st.block(W - 6, y - 4, o.item || 'power'); for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y, T.SEMI); st.top(y - 3); },

  /* ---- 10-5 the citadel's coffee works ---- */
  meetPhin(st, o) { const x = st.x, n = 12; st.floor(x, x + n - 1); st.sign(x + 1, 'DRIP FILTERS LEAVE A HOT COFFEE TRAIL: DON\'T STAND IN IT!'); st.enemy('vnPhinDrip', x + 8, st.gy); st.coins(x + 3, x + 9, st.gy - 3); return x + n; },
  // the store room door in the citadel wall
  storeDoor(st, o) { return Tour.pieces.door(st, { to: o.to, perch: 0, look: 'vnStoreDoor', back: o.back }); },

  /* ---- 10-6 the floating market ---- */
  // an orchard row: fruit trees with branches to climb, fallen fruit, toads
  orchard(st, o) {
    const x = st.x, B = st.B, n = 14; st.floor(x, x + n - 1);
    B.prop('vnFruitTree', x + 2, st.gy - 7, 9, 7, 'none', {});
    for (const [dx, dy] of [[2, 3], [6, 5], [3, 7]]) for (let q = 0; q < 4; q++) B.set(x + dx + q, st.gy - dy, T.SEMI);
    st.coins(x + 3, x + 7, st.gy - 9); if (o.gold) st.gold(x + 4, st.gy - 9, o.gold);
    st.enemy('vnToad', x + 11, st.gy);
    return x + n;
  },
  // a canal: sampans paddle back and forth across it
  sampans(st, o) {
    const x = st.x, span = o.span || 10; st.floor(x, x + 1);
    water(st, x + 2, x + 1 + span);
    st.spawn('mplat', x + 3, st.gy - 1, { pw: 3, ax: (span - 4) * TS, ay: 0, speed: o.speed || 1.4, skin: 'vnSampan' });
    for (let q = 0; q < span; q++) st.B.ghosts.push([x + 2 + q, st.gy]);
    st.coins(x + 3, x + span, st.gy - 2); if (o.shrimp) st.spawn('vnSquid', x + 2 + Math.floor(span / 2), st.H - 2, {});
    st.floor(x + 2 + span, x + 4 + span);
    return x + 5 + span;
  }
};

/* ---------------- Pupo in Vietnam (docs/design/PUPO.md §4.2, §4.3) ---------------- */
const VNINK = '#1c1426';
const PP = {
  // a Nap Box on the ledge or band dy rows under the cursor row (the cave climb's pieces move st.y up), column x
  napAt(st, o) { const tx = o.x, ty = st.y + (o.dy || 0) - 1; st.B.set(tx, ty, T.QBLOCK); st.B.item(tx, ty, 'pupo'); st.B.spawn('napBox', tx, ty, {}); return st.x; },
  /* 10-4's Pupo obstacle, The Cave Pearl: a rock shelf seals the cave above, and the only way on up is the old
     skylight gate in its corner, which opens with the cave pearl. The pearl lies in a flooded rimstone pool in the
     other corner, walled in behind a rusty grille: Brady can't squeeze through the bars, but Pupo's arm reaches
     through them (Action) and brings it out ("...shiny... and wet."); the gate rolls open at once. The flood keeps
     rising under them (Pupo swims it fast). The pool's floor and the gate room's are solid rock; the rest of the
     chamber's floor is one-way, so the climb comes up through it. 7 rows. { key } */
  pearlGate(st, o) {
    const B = st.B, W = st.W, key = o.key || 'pearl', F = st.y - 3, C = F - 4, g0 = W - 7;
    // the rock shelf (a hole over the gate room), the chamber's floor (one-way, solid under the pool and the gate room)
    B.fill(1, C, W - 2, C, T.GROUND); for (let x = g0 + 1; x <= W - 3; x++) B.set(x, C, T.EMPTY);
    for (let x = 2; x <= W - 3; x++) B.set(x, F, T.SEMI);
    B.fill(1, F, 5, F, T.GROUND); B.fill(g0, F, W - 2, F, T.GROUND);
    // the pool: walled in by the shelf, the floor and the grille; water and the pearl inside
    B.fill(1, F - 3, 4, F - 1, T.EMPTY); B.fill(1, F - 2, 4, F - 1, T.WATER);
    for (let y = F - 3; y <= F - 1; y++) B.set(5, y, T.HARD);
    B.spawn('pupoGrille', 5, F - 1, { w: 1, h: 3, camBox: [1, W - 2, C, F + 4, C - 1] });   // the camera keeps the shelf in view (28_tour_pg_g3.js)
    B.prop('vnRimPool', 1, F - 3, 4, 3, 'none', {});
    B.spawn('pupoSnatch', 2, F - 1, { key, path: [[0, 0]], period: 9, look: 'vnPearl', opens: true, name: 'THE CAVE PEARL! THE SKYLIGHT GATE OPENS', say: '...SHINY... AND WET.' });
    // the skylight gate: the gate room's left wall (a shutter on the pearl's key), the way up through the shelf's hole
    tourShutterLock(B, g0, F - 3, F - 1, key, 'vnSkylightGate');
    B.fill(W - 2, F - 3, W - 2, F - 1, T.EMPTY);
    st.sign(9, 'THE SKYLIGHT GATE OPENS WITH THE CAVE PEARL. IT LIES IN THE POOL BEHIND THE RUSTY GRILLE: A LONG ARM COULD REACH IN', F);
    st.coins(8, g0 - 3, F - 2);
    B.decorAt('vnFungi', 12, F, 5); B.decorAt('vnPearls', 17, F, 6);
    st.top(C);
  },
  /* 10-6's Pupo bonus (a helper level): the canal lane. A lantern seller's house with steps up to its roof, then lantern
     hooks on a string out over the lane to a stilt teahouse's roof, where a 1-up box waits under the lanterns. A rain
     cloud hangs over the lane: its downpour knocks anyone in the air straight down (a jump, a spring sock, a glide), but
     Pupo swings hook to hook (Action) under it. The lane runs on under the teahouse; the rain stops short of walking
     height. { n: hooks } */
  lanternRoofs(st, o) {
    const B = st.B, x = st.x, gy = st.gy, n = o.n || 6, roof = gy - 5, r0 = x + 25, r1 = x + 31;
    st.floor(x, r1 + 4);
    // the lantern seller's house: two steps up its side, the roof
    B.fill(x + 3, gy - 2, x + 3, gy - 1, T.HARD); B.fill(x + 4, roof, x + 9, gy - 1, T.HARD);
    for (let xx = x + 3; xx <= x + 9; xx++) for (let y = roof; y < gy; y++) B.setHide(xx, y, 1);
    B.prop('vnLanternHouse', x + 3, roof - 2, 7, gy - roof + 2, 'none', {});
    // the teahouse on its stilts: a two-row body (the lane passes under it), the roof with the 1-up and coins
    B.fill(r0, roof, r1, roof + 1, T.HARD); for (let xx = r0; xx <= r1; xx++) for (let y = roof; y <= roof + 1; y++) B.setHide(xx, y, 1);
    B.prop('vnTeahouse', r0, roof - 2, r1 - r0 + 1, gy - roof + 2, 'none', {});
    st.block(r1 - 2, roof - 3, 'oneup'); B.picksRow(r0 + 1, r1 - 4, roof - 2);
    // the rain cloud: a downpour from the sky to a little under the roofs (a sock's jump from the lane never gets up to
    // the teahouse's roof), well over walking height in the lane. The cloud hangs over the lantern string (drawn first)
    const z = B.zone(x + 10, 0, r1 + 4 - (x + 10), roof, 0, 150 * TS, 0, 'downdraft'); z.h = roof * TS + 20;
    B.spawn('vnRainCloud', x + 10, roof - 1, { w: r1 + 4 - (x + 10), h: roof, gy, cloud: roof - 8.6 });
    // the lantern string and its hooks, three tiles apart, five rows over the roofs
    for (let i = 0; i < n; i++) B.spawn('pupoGrab', x + 11 + 3 * i, roof - 5, { kind: 'hook', look: 'vnLanternHook', cam: 3, say: i === 0 ? '...PRETTY.' : null });
    B.prop('vnLanternString', x + 9, roof - 7, 3 * n + 4, 2, 'none', {});
    st.sign(x + 1, 'A RAIN CLOUD OVER THE LANTERN LANE! NO JUMPING UP THERE. PUPO CAN SWING ON THE LANTERN HOOKS (ACTION)');
    return r1 + 5;
  }
};
for (const k in PP) Tour.pieces['vn.' + k] = PP[k];
// 10-6: the little rain cloud over the lantern lane: a grey puff and its rain streaks down to the lane (cheap: lines
// from the clock)
class VnRainCloud extends Ent {
  constructor(g, s) { super(g, s, (s.w || 10) * TS, (s.h || 8) * TS); this.x = s.x - TS / 2; this.y = 0; this.ly = (s.gy || 14) * TS; this.cly = (s.cloud || 4) * TS; this.back = true; this.friendly = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x0 = this.x, w = this.w, t = this.t, cy = this.cly, ly = this.ly;
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(200,225,255,0.7)'; ctx.lineWidth = 1.6;
    for (let k = 0; k < 22; k++) {
      const xx = x0 + 8 + ((k * 53) % (w - 16)), u = (t * (520 + (k % 5) * 40) + k * 71) % (ly - cy);
      ctx.beginPath(); ctx.moveTo(xx, cy + u); ctx.lineTo(xx - 3, cy + u + 14); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    for (let k = 0, xx = x0 + 6; xx < x0 + w - 10; xx += 36, k++) {
      const r = 15 + (k % 3) * 4, yy = cy - 6 + Math.sin(t * 0.7 + k) * 2;
      ctx.fillStyle = VNINK; ctx.beginPath(); ctx.arc(xx + 18, yy, r + 2, 0, TAU); ctx.fill();
    }
    for (let k = 0, xx = x0 + 6; xx < x0 + w - 10; xx += 36, k++) {
      const r = 15 + (k % 3) * 4, yy = cy - 6 + Math.sin(t * 0.7 + k) * 2;
      ctx.fillStyle = k % 2 ? '#8a94a8' : '#9aa4b8'; ctx.beginPath(); ctx.arc(xx + 18, yy, r, 0, TAU); ctx.fill();
    }
  }
}
Object.assign(ENTITY_TYPES, { vnRainCloud: VnRainCloud });
const vnPupoSkins = {
  // 10-4: the cave pearl (a still pupoSnatch look): a creamy pearl with a soft shine, sitting in the pool
  vnPearl(ctx, e, t) {
    const x = e.cx, y = e.cy + 4;
    ctx.fillStyle = VNINK; ctx.beginPath(); ctx.arc(x, y, 9.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4ece0'; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d8c8e0'; ctx.beginPath(); ctx.arc(x + 2, y + 2, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 2.6 + Math.sin(t * 2) * 0.4, 0, TAU); ctx.fill();
  },
  // 10-4: the skylight gate (a shutter look): an old iron gate in a stone frame, a round pearl-shaped socket on it
  vnSkylightGate(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, h = e.h, k = e.k || 0, up = h * k;
    ctx.fillStyle = VNINK; ctx.fillRect(x - 4, y - 8, w + 8, 10); ctx.fillStyle = '#7a7470'; ctx.fillRect(x - 2, y - 6, w + 4, 6);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y, w + 8, h); ctx.clip();
    const gy = y - up;
    ctx.fillStyle = VNINK; ctx.fillRect(x + 2, gy, w - 4, h);
    ctx.fillStyle = '#5a6a6a'; for (let xx = x + 5; xx < x + w - 4; xx += 7) ctx.fillRect(xx, gy + 2, 4, h - 4);
    ctx.fillStyle = '#7a8a84'; ctx.fillRect(x + 3, gy + 10, w - 6, 5); ctx.fillRect(x + 3, gy + h - 18, w - 6, 5);
    ctx.fillStyle = VNINK; ctx.beginPath(); ctx.arc(x + w / 2, gy + h / 2, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = e.open ? '#f4ece0' : '#2a2430'; ctx.beginPath(); ctx.arc(x + w / 2, gy + h / 2, 5.6, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // 10-6: a lantern hook (a pupoGrab hook look): a red paper lantern on the string, the brass ring under it
  vnLanternHook(ctx, e, t) {
    const x = e.hx, y = e.hy, sw = Math.sin(t * 1.4 + e.ax * 0.02) * 1.5;
    ctx.strokeStyle = VNINK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x, y - 2 * TS + 4); ctx.lineTo(x + sw, y - 30); ctx.stroke();
    ctx.fillStyle = VNINK; ctx.beginPath(); ctx.ellipse(x + sw, y - 18, 11, 13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = LANT[Math.floor(e.ax / 96) % LANT.length]; ctx.beginPath(); ctx.ellipse(x + sw, y - 18, 9.4, 11.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x + sw, y - 18, 4.5, 11.4, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x + sw - 6, y - 31, 12, 3); ctx.fillRect(x + sw - 6, y - 8, 12, 3);
    pupoRing(ctx, x + sw, y, 5);
  }
};
Object.assign(Decor, {
  // 10-4: the rimstone pool behind the grille: stepped stone rims round still water, a glow on the pearl's side
  vnRimPool(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    ctx.fillStyle = '#2a3a3a'; ctx.fillRect(x0, top, d.w, d.h);
    ctx.fillStyle = 'rgba(120,200,190,0.35)'; ctx.beginPath(); ctx.ellipse(x0 + 30, y - 22, 34, 18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = VNINK; for (let k = 0; k < 3; k++) { rr(ctx, x0 + 4 + k * 38, y - 10 - (k % 2) * 4, 34, 8, 4); ctx.fill(); }
    ctx.fillStyle = '#c8b898'; for (let k = 0; k < 3; k++) { rr(ctx, x0 + 6 + k * 38, y - 9 - (k % 2) * 4, 30, 5, 3); ctx.fill(); }
  },
  // 10-6: the lantern seller's house: plaster walls, a tiled roof, lanterns along its eave
  vnLanternHouse(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2 + TS, w = d.w - TS, top = y - d.h + 2 * TS;
    ctx.fillStyle = VNINK; ctx.fillRect(x0 - 2, top - 2, w + 4, y - top + 2);
    ctx.fillStyle = '#e8c87a'; ctx.fillRect(x0, top, w, y - top);
    ctx.fillStyle = '#c84a2a'; ctx.fillRect(x0 - 6, top - 6, w + 12, 8); ctx.fillStyle = '#a8321a'; for (let xx = x0 - 6; xx < x0 + w + 6; xx += 8) ctx.fillRect(xx, top - 6, 3, 8);
    ctx.fillStyle = '#5a3a1a'; rr(ctx, x0 + w / 2 - 12, y - 46, 24, 46, 3); ctx.fill();
    ctx.fillStyle = '#7ab8d8'; ctx.fillRect(x0 + 10, top + 16, 22, 18); ctx.fillRect(x0 + w - 32, top + 16, 22, 18);
    for (let k = 0; k < 4; k++) { const lx = x0 + 14 + k * (w - 28) / 3; ctx.fillStyle = VNINK; ctx.beginPath(); ctx.ellipse(lx, top + 10, 7, 8.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = LANT[k]; ctx.beginPath(); ctx.ellipse(lx, top + 10, 5.6, 7, 0, 0, TAU); ctx.fill(); }
    // the steps up its side
    ctx.fillStyle = VNINK; ctx.fillRect(x - d.w / 2, y - 2 * TS - 2, TS + 2, 2 * TS + 2); ctx.fillStyle = '#a88a5a'; ctx.fillRect(x - d.w / 2 + 2, y - 2 * TS, TS - 2, 2 * TS); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - d.w / 2 + 2, y - 2 * TS, TS - 2, 5);
  },
  // 10-6: the stilt teahouse over the lane: a wooden body on posts (the lane under it), a railing round its roof
  vnTeahouse(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, w = d.w, top = y - d.h + 2 * TS, body = top + 2 * TS;
    ctx.fillStyle = VNINK; for (const px of [x0 + 8, x0 + w - 14]) ctx.fillRect(px - 1, body - 2, 8, y - body + 2);
    ctx.fillStyle = '#6a4a2a'; for (const px of [x0 + 8, x0 + w - 14]) ctx.fillRect(px + 1, body, 4, y - body);
    ctx.fillStyle = VNINK; ctx.fillRect(x0 - 2, top - 2, w + 4, 2 * TS + 4);
    ctx.fillStyle = '#9a6a3a'; ctx.fillRect(x0, top, w, 2 * TS); ctx.fillStyle = '#b8844a'; ctx.fillRect(x0, top, w, 4);
    ctx.fillStyle = '#7a5030'; for (let xx = x0 + 6; xx < x0 + w; xx += 14) ctx.fillRect(xx, top + 6, 3, 2 * TS - 8);
    ctx.fillStyle = VNINK; ctx.fillRect(x0, top - 20, w, 4); for (let xx = x0 + 2; xx < x0 + w; xx += 20) ctx.fillRect(xx, top - 20, 4, 20);
    ctx.fillStyle = '#e8322a'; ctx.fillRect(x0 + 1, top - 19, w - 2, 2);
  },
  // 10-6: the lantern string the hooks hang from, between two poles
  vnLanternString(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2 + 6, x1 = x + d.w / 2 - 6, yy = y - d.h + 8;
    ctx.strokeStyle = VNINK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.quadraticCurveTo(x, yy + 10, x1, yy); ctx.stroke();
    ctx.strokeStyle = '#c8a03a'; ctx.lineWidth = 1.4; ctx.stroke();
  }
});
Tour.amend('vn', { skins: vnPupoSkins });

/* ---------------- small entities ---------------- */
// bats flutter out of the cave mouth now and then (the tell of the hidden cove)
class VnCaveBats extends Ent {
  constructor(g, s) { super(g, s, 20, 20); this.friendly = true; this.k = 1; }
  update(dt) { this.t += dt; this.k -= dt; if (this.k <= 0 && this.g.onScreen(this, 60)) { this.k = 2 + Math.random() * 2; for (let i = 0; i < 3; i++) this.g.burst(this.cx, this.cy - 20, 1, '#2a2430', 'leaf'); } }
  draw() {}
}
Object.assign(ENTITY_TYPES, { vnCaveBats: VnCaveBats });

/* ---------------- skins (doors, the lantern post) ---------------- */
const skins = {
  vnCaveMouth(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#10161a'; ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.quadraticCurveTo(x - 22, y - 50, x, y - 54); ctx.quadraticCurveTo(x + 22, y - 50, x + 20, y); ctx.fill(); ctx.fillStyle = '#2f6a34'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x - 20 + k * 10, y - 52 + Math.abs(k - 2) * 6, 7, 4, k, 0, TAU); ctx.fill(); } },
  vnWorkshopDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#5a2a1a'; rr(ctx, x - 15, y - 50, 30, 50, 3); ctx.fill(); ctx.fillStyle = '#ffd890'; ctx.globalAlpha = 0.7; ctx.fillRect(x - 11, y - 46, 22, 40); ctx.globalAlpha = 1; for (let k = 0; k < 3; k++) lamp(ctx, x - 10 + k * 10, y - 58, 5, LANT[k + 1], t); },
  vnGardenDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = 'rgba(255,250,200,0.55)'; rr(ctx, x - 15, y - 52, 30, 52, 14); ctx.fill(); ctx.fillStyle = '#3a8a3a'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(x - 18 + k * 6, y - 52 + Math.sin(k * 2) * 4, 7, 4, k, 0, TAU); ctx.fill(); } },
  vnStoreDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#a8241a'; rr(ctx, x - 16, y - 52, 32, 52, 3); ctx.fill(); ctx.fillStyle = '#ffd23a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 5, y - 26, 2.5, 0, TAU); ctx.fill(); } ctx.strokeStyle = '#7a1a12'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 50); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = '#5a2e14'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('KHO', x, y - 56); },
  vnHallDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#7a1a12'; rr(ctx, x - 20, y - 60, 40, 60, 4); ctx.fill(); ctx.fillStyle = '#c8322a'; rr(ctx, x - 16, y - 56, 32, 56, 3); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 22, y - 64, 44, 5); ctx.fillStyle = '#fff4dc'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('COURTYARD ▶', x, y - 70); },
  vnShopLantern(ctx, e, t) { const x = e.cx, y = e.y + e.h, lit = 1 + (e.flare || 0); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 2, y - 52, 4, 52); lamp(ctx, x, y - 60, 10 * Math.min(1.3, lit), '#e8323a', t); },
  vnEmptyBoat(ctx, e, t) { const x = e.cx, y = e.y + e.h, bob = Math.sin(t * 2) * 2; ctx.fillStyle = '#3e2616'; ctx.beginPath(); ctx.moveTo(x - 30, y - 18 + bob); ctx.quadraticCurveTo(x, y - 4 + bob, x + 30, y - 18 + bob); ctx.lineTo(x + 24, y - 8 + bob); ctx.quadraticCurveTo(x, y + 2 + bob, x - 24, y - 8 + bob); ctx.fill(); ctx.fillStyle = '#5a3e22'; ctx.beginPath(); ctx.moveTo(x - 14, y - 14 + bob); ctx.quadraticCurveTo(x, y - 40 + bob, x + 14, y - 14 + bob); ctx.fill(); ctx.fillStyle = '#100a08'; rr(ctx, x - 8, y - 32 + bob, 16, 18, 6); ctx.fill(); },
  vnMarketDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 16, y - 56, 4, 56); ctx.fillRect(x + 12, y - 56, 4, 56); ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.moveTo(x - 22, y - 56); ctx.lineTo(x + 22, y - 56); ctx.lineTo(x + 18, y - 64); ctx.lineTo(x - 18, y - 64); ctx.fill(); ctx.fillStyle = 'rgba(30,20,10,0.65)'; ctx.fillRect(x - 12, y - 52, 24, 52); }
};

/* ---------------- moving-platform looks ---------------- */
Object.assign(PlatformArt, {
  // the junk: a wooden boat with ribbed red batwing sails
  vnJunk(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.moveTo(x - 14, y - 8); ctx.quadraticCurveTo(x - 4, y + 2, x + 10, y + 2); ctx.lineTo(x + w - 10, y + 2); ctx.quadraticCurveTo(x + w + 6, y + 2, x + w + 18, y - 12); ctx.lineTo(x + w + 6, y + 22); ctx.lineTo(x + 2, y + 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(x - 6, y, w + 12, 5); ctx.fillStyle = '#c8322a'; ctx.fillRect(x, y + 10, w, 3);
    for (const [mx, h] of [[x + w * 0.3, 120], [x + w * 0.65, 96]]) {
      ctx.fillStyle = '#4a2a14'; ctx.fillRect(mx - 2, y - h, 4, h);
      ctx.fillStyle = 'rgba(200,70,40,0.82)'; ctx.beginPath(); ctx.moveTo(mx + 2, y - h + 6); ctx.quadraticCurveTo(mx + 46, y - h * 0.6, mx + 34, y - 14); ctx.lineTo(mx + 2, y - 14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(90,30,20,0.6)'; ctx.lineWidth = 1.2; for (let k = 1; k < 6; k++) { const yy = y - h + 6 + k * (h - 20) / 6; ctx.beginPath(); ctx.moveTo(mx + 2, yy); ctx.lineTo(mx + 30 + Math.sin(k) * 6, yy - 4); ctx.stroke(); }
    }
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(x + w + 6, y - 2, 4, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8322a'; ctx.beginPath(); ctx.arc(x + w + 7, y - 2, 1.8, 0, TAU); ctx.fill();
  },
  // a little paper lantern boat drifting on the river
  vnFloatLantern(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#f4e8c8'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + w + 4, y); ctx.lineTo(x + w - 4, y + 10); ctx.lineTo(x + 4, y + 10); ctx.fill(); lamp(ctx, x + w / 2, y - 10, 8, LANT[Math.floor(p.x / 97) % LANT.length], t); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,190,110,0.25)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 14, w, 5, 0, 0, TAU); ctx.fill(); ctx.restore(); },
  // a sampan with a canopy (10-6's canal)
  vnSampan(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#3e2616'; ctx.beginPath(); ctx.moveTo(x - 14, y - 6); ctx.quadraticCurveTo(x, y + 4, x + w / 2, y + 4); ctx.quadraticCurveTo(x + w, y + 4, x + w + 14, y - 6); ctx.lineTo(x + w + 4, y + 14); ctx.lineTo(x - 4, y + 14); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7a5030'; ctx.fillRect(x, y - 2, w, 4); ctx.fillStyle = '#ffd23a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + 10 + k * (w - 20) / 2, y + 8, 4, 0, TAU); ctx.fill(); } }
});

/* ---------------- decor ---------------- */
Object.assign(Decor, {
  vnFruitPile(ctx, x, y) { const c = ['#e8326a', '#ffd23a', '#5ab84a', '#ff8a2a']; for (let k = 0; k < 6; k++) { ctx.fillStyle = c[k % 4]; ctx.beginPath(); ctx.arc(x - 12 + (k % 3) * 12, y - 6 - Math.floor(k / 3) * 9, 6, 0, TAU); ctx.fill(); } },
  vnStoolStack(ctx, x, y, t, th, d) { const n = d.h || 2; for (let k = 0; k < n * 2; k++) { const yy = y - k * 16; ctx.fillStyle = ['#e8323a', '#2a7ad8', '#2aa86a', '#ffb02a'][k % 4]; rr(ctx, x - 14, yy - 16, 28, 5, 2); ctx.fill(); ctx.fillRect(x - 12, yy - 12, 4, 12); ctx.fillRect(x + 8, yy - 12, 4, 12); } },
  vnCafeFront(ctx, x, y, t, th, d) { const w = d.w, h = d.h, x0 = x - w / 2; ctx.fillStyle = '#e8c87a'; ctx.fillRect(x0, y - h, w, h); ctx.fillStyle = '#2aa86a'; for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#fff4dc' : '#2aa86a'; ctx.fillRect(x0 + k * w / 8, y - h - 10, w / 8, 12); } ctx.fillStyle = '#5a2a1a'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('CÀ PHÊ', x - w * 0.25, y - h + 16); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x0 + 8, y - 30, 30, 22); },
  vnRock(ctx, x, y) { ctx.fillStyle = '#8a9a8a'; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 10, y - 30); ctx.quadraticCurveTo(x, y - 40, x + 10, y - 28); ctx.lineTo(x + 16, y); ctx.fill(); ctx.fillStyle = '#5aa84a'; ctx.beginPath(); ctx.ellipse(x, y - 34, 8, 4, 0, 0, TAU); ctx.fill(); },
  vnKarstTop(ctx, x, y, t, th, d) { const w = d.w, h = Math.min(d.h, 220), top = y - d.h; ctx.fillStyle = '#9aa8a0'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 6, top + h); ctx.lineTo(x - w / 2, top + 6); ctx.quadraticCurveTo(x, top - 6, x + w / 2, top + 4); ctx.lineTo(x + w / 2 + 8, top + h); ctx.fill(); ctx.fillStyle = '#5aa84a'; ctx.beginPath(); ctx.ellipse(x, top + 2, w / 2 + 4, 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(80,90,85,0.4)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - w / 3 + k * w / 5, top + 14); ctx.lineTo(x - w / 3 + k * w / 5 + 4, top + h * 0.8); ctx.stroke(); } },
  vnCaveRoof(ctx, x, y, t, th, d) { const w = d.w; for (let k = 0; k < w / 20; k++) { ctx.fillStyle = '#7a8a84'; const sx = x - w / 2 + 10 + k * 20; ctx.beginPath(); ctx.moveTo(sx - 6, y); ctx.lineTo(sx, y + 14 + (k % 3) * 8); ctx.lineTo(sx + 6, y); ctx.fill(); } },
  vnLanternShopArt(ctx, x, y, t, th, d) { const w = d.w, h = d.h, x0 = x - w / 2; ctx.fillStyle = '#c8943a'; ctx.fillRect(x0, y - h, w, h); ctx.fillStyle = '#5a2a1a'; ctx.fillRect(x0 - 6, y - h - 8, w + 12, 10); for (let k = 0; k < 6; k++) lamp(ctx, x0 + 10 + k * (w - 20) / 5, y - h + 14 + (k % 2) * 6, 7, LANT[k % 6], t); ctx.fillStyle = 'rgba(30,20,10,0.5)'; ctx.fillRect(x0 + 10, y - 40, w - 20, 40); },
  vnAwning(ctx, x, y, t, th, d) { const w = d.w, x0 = x - w / 2; for (let k = 0; k < w / 16; k++) { ctx.fillStyle = k % 2 ? '#e8323a' : '#fff4dc'; ctx.beginPath(); ctx.moveTo(x0 + k * 16, y - 32); ctx.lineTo(x0 + k * 16 + 16, y - 32); ctx.lineTo(x0 + k * 16 + 16, y - 20); ctx.quadraticCurveTo(x0 + k * 16 + 8, y - 14, x0 + k * 16, y - 20); ctx.fill(); } ctx.fillStyle = '#5a3a24'; ctx.fillRect(x0, y - 34, w, 4); },
  vnWorkshopFront(ctx, x, y, t, th, d) { const w = d.w, h = d.h, x0 = x - w / 2; ctx.fillStyle = '#d8a84a'; ctx.fillRect(x0, y - h, w, h); ctx.fillStyle = '#7a3a24'; ctx.beginPath(); ctx.moveTo(x0 - 10, y - h); ctx.lineTo(x, y - h - 24); ctx.lineTo(x0 + w + 10, y - h); ctx.fill(); for (let k = 0; k < 5; k++) lamp(ctx, x0 + 12 + k * (w - 24) / 4, y - h + 18, 8, LANT[(k + 2) % 6], t); },
  vnFernCave(ctx, x, y, t) { for (let k = -3; k <= 3; k++) { const a = -Math.PI / 2 + k * 0.35; ctx.strokeStyle = '#5ab84a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 16, x + Math.cos(a) * 22 + Math.sin(t + k) * 1.5, y + Math.sin(a) * 18); ctx.stroke(); } },
  vnSunShaft(ctx, x, y, t) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x, y - 300, x, y); g.addColorStop(0, 'rgba(255,250,200,0.35)'); g.addColorStop(1, 'rgba(255,250,200,0.05)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30, y - 300); ctx.lineTo(x + 30, y - 300); ctx.lineTo(x + 70, y); ctx.lineTo(x - 70, y); ctx.fill(); ctx.restore(); },
  vnFruitTree(ctx, x, y, t, th, d) { const h = d.h; ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 6, y - h * 0.7, 12, h * 0.7); ctx.fillStyle = '#3a8a3a'; for (const [dx, dy, r] of [[0, -h * 0.8, 50], [-50, -h * 0.6, 36], [50, -h * 0.6, 36]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill(); } const c = ['#ffd23a', '#e8326a', '#ff8a2a']; for (let k = 0; k < 9; k++) { ctx.fillStyle = c[k % 3]; ctx.beginPath(); ctx.arc(x - 60 + k * 15, y - h * 0.62 + (k % 2) * 12, 5, 0, TAU); ctx.fill(); } },
  vnMarketBoat(ctx, x, y, t) { const bob = Math.sin(t * 1.6 + x * 0.01) * 3; ctx.fillStyle = '#4a2e18'; ctx.beginPath(); ctx.moveTo(x - 60, y - 10 + bob); ctx.quadraticCurveTo(x, y + 8 + bob, x + 60, y - 10 + bob); ctx.lineTo(x + 50, y + 6 + bob); ctx.lineTo(x - 50, y + 6 + bob); ctx.fill(); const c = ['#5ab84a', '#ffd23a', '#e8326a', '#ff8a2a']; for (let k = 0; k < 8; k++) { ctx.fillStyle = c[k % 4]; ctx.beginPath(); ctx.arc(x - 36 + k * 10, y - 12 + bob - (k % 2) * 6, 7, 0, TAU); ctx.fill(); } ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x + 30, y - 70 + bob, 3, 60); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + 32, y - 72 + bob, 6, 0, TAU); ctx.fill(); },
  vnBuffaloKeeper(ctx, x, y, t) { FRIENDS.buffalo(ctx, x, y, t); }
});

/* ---------------- stamps ---------------- */
const stamps = {
  // 10-1 (s): the café's back room: stacks of stools, a coffee counter, P2, a water bottle
  caphe: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [7, 10, 'u'], [12, 10, 'u'],
      [9, 8, '----'], [14, 6, '----'], [16, 4, '*'], [8, 5, 'o.o.o'],
      [21, 7, '?'], [25, 10, 'u']
    ]),
    legend: { u: ['decor', 'vnStools'] },
    items: ['oneup'],
    doors: [{ to: 'pho@caBack', look: 'tourDoor' }],
    gold: { '*': 'hidden' }
  },
  // 10-2 (s): the hidden cove inside the karst: a lagoon, P2, a star, and the path to a little market stall
  hang: {
    floor: 11,
    rows: room(32, 14, 11, [
      [2, 10, '@.D'], [7, 11, 'WWWWWWWW'], [7, 12, 'WWWWWWWW'],
      [8, 8, '------'], [10, 6, '*'], [7, 4, 'o.o.o.o'],
      [19, 7, '?'], [28, 10, 'g'], [24, 10, 'n']
    ]),
    legend: { n: ['spawn', 'sign', { text: 'A WATER BUFFALO KEEPS A LITTLE MARKET STALL THROUGH HERE: A SOUVENIR STAND!' }] },
    items: ['star'],
    doors: [{ to: 'vinh@hangBack', look: 'vnCaveMouth' }],
    gold: { '*': 'hidden' }
  },
  // 10-3 (s): the lantern workshop: frames and silk, P2, the back door down to the river market
  xuong: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [8, 8, '----'], [12, 6, '----'], [16, 4, '----'], [17, 2, '*'], [7, 5, 'o.o.o'],
      [22, 7, '?'], [26, 10, 'g'], [23, 10, 'n']
    ]),
    legend: { n: ['spawn', 'sign', { text: 'THE BACK DOOR OPENS ONTO A FLOATING MARKET FAR DOWN THE RIVER... A SECRET LEVEL!' }] },
    items: ['oneup'],
    doors: [{ to: 'phoco@xuongBack', look: 'vnWorkshopDoor' }],
    gold: { '*': 'hidden' }
  },
  // 10-4 (s): the skylight garden pocket: ferns, a sunbeam, P2
  rung: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [7, 10, 'f'], [14, 10, 'f'],
      [9, 8, '---'], [13, 6, '---'], [17, 4, '---'], [18, 2, '*'], [11, 3, 'o.o.o'],
      [23, 7, '?'], [26, 10, 'f']
    ]),
    legend: { f: ['decor', 'vnFernCave'] },
    items: ['oneup'],
    doors: [{ to: 'hang@rungBack', look: 'vnGardenDoor' }],
    gold: { '*': 'hidden' }
  },
  // 10-5 (s): the citadel store room: coffee sacks, P2
  kho: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [7, 10, 'u'], [24, 10, 'u'],
      [10, 8, '-----'], [12, 6, '*'], [9, 5, 'o.o.o.o'],
      [19, 7, '?']
    ]),
    legend: { u: ['decor', 'vnUrnPot'] },
    items: ['oneup'],
    doors: [{ to: 'hoangthanh@khoBack', look: 'vnStoreDoor' }],
    gold: { '*': 'hidden' }
  },
  // 10-6: the floating market plaza. Boats bob along the back; three doors (orchard, canal, candy workshop); each
  // friend's gate opens for what it wants: the buffalo a coconut, the duck candy, the gecko fruit (the stamp)
  cho: {
    floor: 17,
    rows: room(64, 20, 17, [
      // the two stall roofs three rows over the floor (at six rows Brady could never get up to them, their picks or the box)
      [7, 12, 'o.o.o'], [6, 14, '-------'],
      [34, 12, 'o.o.o'], [33, 14, '-------'],
      [4, 12, 'o'], [11, 10, '?'],
      [2, 16, 'E'], [5, 16, '@'], [8, 16, 'n'], [13, 16, 'D'], [15, 16, 'a'],
      [26, 16, '1'], [29, 16, 'D'], [31, 16, 'w'],
      [43, 16, '2'], [46, 16, 'D'], [48, 16, 'j'],
      [55, 16, '3'], [60, 16, 'G'],
      [20, 16, 'k'], [36, 16, 'k'], [52, 16, 'k'],
      [50, 16, 'x']   // Pupo's Nap Box (PUPO.md §4.3), by the canal lane's door (past the duck's gate, like the door)
    ], { open: true, wall: '#' }),
    legend: {
      x: ['piece', 'napBox', {}],
      n: ['spawn', 'sign', { text: 'TRADE YOUR WAY TO THE STAMP: A COCONUT FOR THE BUFFALO, CANDY FOR THE DUCK, FRUIT FOR THE GECKO' }],
      a: ['anchor', 'vuonBack'], w: ['anchor', 'loBack'], j: ['anchor', 'kenhBack'],
      E: ['piece', 'boatDoor', {}],
      k: ['decor', 'vnFruitPile'],
      1: ['piece', 'tradeGate', { id: 'k1', icon: 'coconut', friend: 'buffalo' }],
      2: ['piece', 'tradeGate', { id: 'k2', icon: 'candy', friend: 'duck' }],
      3: ['piece', 'tradeGate', { id: 'k3', icon: 'fruit', friend: 'gecko' }]
    },
    items: ['power'],
    doors: [{ to: 'vuon', look: 'vnMarketDoor' }, { to: 'lokeo', look: 'vnMarketDoor' }, { to: 'kenh', look: 'vnMarketDoor' }]
  },
  // 10-6 ③: the coconut-candy workshop: belts carry the candy slabs, a Magnet Belt on the shelf, P3 over the belts
  lokeo: {
    floor: 13,
    rows: room(44, 16, 13, [
      [2, 12, '@'], [5, 12, 'D'],
      [8, 12, '>>>>>>>>'], [20, 12, '<<<<<<<<'],
      [9, 9, '----'], [21, 8, '-----'], [23, 6, '*'], [10, 6, 'o.o.o'],
      [15, 8, '?'], [32, 9, '---'], [36, 12, 'x']
    ]),
    legend: { x: ['piece', 'goods', { id: 'k2', item: 'candy' }] },
    items: ['magnet'],
    doors: [{ to: 'cho@loBack', look: 'vnMarketDoor' }],
    gold: { '*': 'risky' }
  },
  // 10-6 (s): the empty boat drifting behind the market: a hold full of coins, P2
  thuyen: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [8, 8, '----'], [10, 6, '*'], [7, 4, 'o.o.o.o'], [16, 7, 'o.o.o'],
      [21, 7, '?']
    ]),
    items: ['oneup'],
    doors: [{ to: 'cho@boatBack', look: 'vnEmptyBoat' }],
    gold: { '*': 'hidden' }
  },
  // the Souvenir Stand Chợ Nhỏ: a water buffalo's market stall
  stand: {
    floor: 10,
    rows: room(28, 12, 10, [[2, 9, '@'], [5, 9, 'k'], [8, 9, 'q'], [11, 9, '$'], [22, 9, 'k'], [24, 9, 'G']]),
    legend: { k: ['decor', 'vnFruitPile'], q: ['decor', 'vnBuffaloKeeper'] }
  }
};
// the empty boat at the back of the market (a door drawn as a boat; walk left past the start to find it)
P.boatDoor = (st, o) => { st.B.spawn('portal', st.x, st.gy - 1, { kind: 'door', look: 'vnEmptyBoat', targetRef: 'thuyen@in' }); st.B.anchor('boatBack', st.x + 2, st.gy - 1); return st.x; };

/* ---------------- the levels ---------------- */
/* ---------- 10-3: the night market, where the gongs swap the stall blinds ----------
   A covered market of two storeys, 80 x 24: the street (rows 14-18) and the upper gallery (rows 8-12, x 1-45), joined
   by three stair holes, each with a stack of plastic stools under it. Every stall has a bamboo blind in red or green;
   a lowered blind closes the lane. Ringing a gong flips every blind of its colour: the open ones drop, the closed ones
   roll up (a dashed outline shows where a raised blind will come down). The only red gong is at the start and the
   only green gong is up in the gallery, so the way is: red, up the stairs to green, back down to red, round by the
   gallery and out along the street. */
const MW = 80, MH = 24, MF = 19, ROOF = 13, UP = 7;   // width, height, the ground row, the gallery floor (the street's roof), the gallery's roof
const CARTS = { red: '#e8323a', green: '#2aa86a' };
// a stall blind across a lane: { g, state: 'A' (down while the gong's bit is 0) or 'B' (down while it is 1), w, h, look }
const blind = (st, o) => {
  const B = st.B, w = o.w || 2, h = o.h || 5, x = st.x, y1 = st.gy - 1, r = [x, y1 - h + 1, x + w - 1, y1];
  const down = o.state !== 'B';
  for (let y = r[1]; y <= r[3]; y++) for (let xx = r[0]; xx <= r[2]; xx++) { B.set(xx, y, down ? T.HARD : T.EMPTY); if (down) B.setHide(xx, y, 1); }
  B.toggle(o.g, down ? [r] : [], down ? [] : [r], { kind: 'switch' });
  B.spawn('toggleGate', r[0], r[1], { g: o.g, rect: r, state: down ? 'A' : 'B', look: o.look });
  return st.x;
};
const gong = (st, o) => { st.B.switchAt(o.g, st.x, st.gy - 1); st.B.spawn('toggleSwitch', st.x, st.gy - 1, { g: o.g, kind: 'switch', look: o.look }); return st.x; };
const stools = (st, o) => { for (let k = 0; k < (o.w || 2); k++) st.B.prop('vnStoolStack', st.x + k, st.gy - (o.h || 2), 1, o.h || 2, 'body', { h: o.h || 2 }); return st.x; };
// a stall's bamboo blind in its colour: rolled up under the lintel when open (with a dashed outline of where it drops),
// down to the floor when closed, with the stall's lantern and a fruit sign
const blindSkin = col => (ctx, e, t) => {
  const x = e.x, y = e.y, w = e.w, h = e.h, k = e.k;
  ctx.save(); ctx.strokeStyle = '#5e3417'; ctx.lineWidth = 3; ctx.strokeRect(x - 1, y, w + 2, 1); ctx.restore();
  if (k < 0.98) { ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6); ctx.restore(); }
  const hh = Math.max(10, h * k);
  Ink.around(ctx, x - 4, y - 4, w + 8, h + 8, c => {
    for (let yy = y; yy < y + hh; yy += 5) { c.fillStyle = Math.floor((yy - y) / 5) % 2 ? shade(col, -0.18) : col; c.fillRect(x + 1, yy, w - 2, Math.min(5, y + hh - yy)); }
    c.fillStyle = '#c8a060'; for (let q = 0; q < 3; q++) c.fillRect(x + 4 + q * (w - 10) / 2, y, 2, hh);
    c.fillStyle = '#5e3417'; c.fillRect(x - 2, y + hh - 4, w + 4, 5);
    if (k > 0.5) { c.fillStyle = '#f4e8d0'; c.beginPath(); c.arc(x + w / 2, y + hh * 0.45, 9, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x + w / 2, y + hh * 0.45, 5, 0, TAU); c.fill(); }
  }, { pad: 4 });
  const lx = x + w / 2, ly = y + 6; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(lx, ly + 10, 6, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,230,150,${0.55 + 0.3 * Math.sin(t * 4 + lx)})`; ctx.beginPath(); ctx.ellipse(lx, ly + 10, 3, 5, 0, 0, TAU); ctx.fill();
};
// a market gong on a wooden frame, its rim in the colour of the blinds it moves
const gongSkin = col => (ctx, e, t) => {
  const x = e.cx, y = e.y + e.h, sw = e.cool > 0 ? Math.sin(t * 40) * 2 * e.cool : 0;
  Ink.around(ctx, x - 22, y - 62, 44, 64, c => {
    c.fillStyle = '#6a3a1a'; c.fillRect(x - 18, y - 56, 4, 56); c.fillRect(x + 14, y - 56, 4, 56); c.fillRect(x - 20, y - 60, 40, 6);
    c.strokeStyle = '#3a2418'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 6, y - 54); c.lineTo(x - 4 + sw, y - 44); c.moveTo(x + 6, y - 54); c.lineTo(x + 4 + sw, y - 44); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(x + sw, y - 30, 14, 0, TAU); c.fill();
    c.fillStyle = '#e8b830'; c.beginPath(); c.arc(x + sw, y - 30, 10.5, 0, TAU); c.fill();
    c.fillStyle = '#c8902a'; c.beginPath(); c.arc(x + sw, y - 30, 4, 0, TAU); c.fill();
    c.fillStyle = '#5e3417'; c.save(); c.translate(x + 15, y - 12); c.rotate(-0.6); c.fillRect(-1.5, -12, 3, 14); c.fillStyle = '#c8b090'; c.beginPath(); c.arc(0, -13, 4, 0, TAU); c.fill(); c.restore();
  }, { pad: 4 });
};
const marketSkins = { vnBlindRed: blindSkin(CARTS.red), vnBlindGreen: blindSkin(CARTS.green), vnGongRed: gongSkin(CARTS.red), vnGongGreen: gongSkin(CARTS.green) };
const market = (() => {
  const g = Array.from({ length: MH }, (_, y) => Array.from({ length: MW }, (_, x) => (y >= MF || x === 0 || x === MW - 1) ? '#' : '.'));
  const put = (x, y, s) => { for (let k = 0; k < s.length; k++) g[y][x + k] = s[k]; };
  const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; };
  fill(1, ROOF, MW - 2, ROOF, '#');          // the street's roof (the gallery's floor)
  fill(1, UP, 45, UP, '#');                  // the gallery's roof
  fill(46, UP, 46, ROOF, '#');               // the gallery's far end wall
  fill(1, 0, MW - 2, UP - 1, '.');           // open sky over the roofs (out of reach)
  for (const sx of [3, 20, 36]) fill(sx, ROOF, sx + 1, ROOF, '.');   // the three stair holes
  // the street: stools under each hole; the start, the red gong, the board, the first red blind (down)
  put(3, 18, 'u'); put(20, 18, 'u'); put(36, 18, 'u');
  put(7, 18, '@'); put(9, 18, 'R'); put(11, 18, 'i'); put(13, 15, '?'); put(15, 18, 'a');
  put(26, 18, 'k'); put(30, 18, 't'); put(42, 15, '?'); put(50, 18, 'q'); put(56, 14, 'w'); put(56, 15, '%');
  put(60, 18, 'k'); put(64, 18, 't'); put(66, 15, 'h'); put(69, 18, '9D'); put(75, 18, 'G');
  put(22, 16, 'o.o.o'); put(44, 16, 'o.o.o'); put(70, 15, 'o.o.o');
  // the gallery: the green blind by the left stairs (down), P1, a checkpoint, the green gong
  put(8, 12, 'z'); put(24, 9, '*'); put(28, 12, 'c'); put(32, 12, 'n'); put(40, 10, 'm');
  put(14, 10, 'o.o.o'); put(36, 9, 'o.o.o');
  return g.map(r => r.join(''));
})();
const marketStamp = {
  floor: MF, rows: market,
  legend: {
    R: ['piece', gong, { g: 0, look: 'vnGongRed' }], n: ['piece', gong, { g: 1, look: 'vnGongGreen' }],
    a: ['piece', blind, { g: 0, state: 'A', look: 'vnBlindRed' }],        // red, down at the start
    k: ['piece', blind, { g: 0, state: 'B', look: 'vnBlindRed' }],        // red, up at the start
    z: ['piece', blind, { g: 1, state: 'A', look: 'vnBlindGreen' }],      // green (gallery), down at the start
    q: ['piece', blind, { g: 1, state: 'A', look: 'vnBlindGreen' }],      // green (street), down at the start
    u: ['piece', stools, { w: 2, h: 3 }],
    i: ['spawn', 'sign', { text: 'NIGHT MARKET. A GONG FLIPS EVERY BLIND OF ITS COLOUR: THE OPEN ONES DROP, THE CLOSED ONES ROLL UP. THE STOOLS UNDER THE HOLES ARE THE STAIRS.' }],
    t: ['enemy', 'vnToad'], m: ['enemy', 'vnMosquito'], w: ['enemy', 'vnSilkworm'],
    9: ['anchor', 'xuongBack']
  },
  items: ['power', 'star'], hidden: ['oneup'],
  doors: [{ to: 'xuong@in', look: 'vnWorkshopDoor' }],
  gold: { '*': 'must', '%': 'risky' }
};
Object.assign(skins, marketSkins);
stamps.market = marketStamp;

const levels = [
  // 10-1 DOOM (periodic): the train down Train Street
  { n: 1, name: 'Train Street', arch: 'doom', theme: 'vn_street',
    gimmick: 'The train rumbles down the street every few seconds: duck onto a doorstep or climb the stools; flying hats boomerang; lasso the wires over the tracks',
    hint: 'When the bell rings, get up on a doorstep or a stool stack! THROW near a wire knot to swing',
    postcard: 'Brady! A train runs right down this street, between the cafés. Everyone just moves their stools. Amazing. ♥ C',
    enemies: [['vnScooter', 2], ['vnBao', 2], ['vnNon', 2]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '10-2' } },
    areas: [
      { id: 'pho', gen: 'strip', W: 250, H: 18, gyMin: 6,
        script: [
          'pho',
          ['itemBlock', { item: 'power', y: 4 }],
          // ① the train passes: doorsteps
          ['trainstreet', { len: 24, n: 1, period: 9 }],
          'meetNon',
          // ② stool stacks to climb, the café
          ['stoolTower', { gold: 'must', non: true }],
          ['trainstreet', { len: 28, n: 2, period: 9 }],
          ['cafe', { to: 'caphe@in', back: 'caBack' }],
          'stools',
          'cp',
          ['itemBlock', { item: 'beans', y: 4 }],   // Magic Beans (fart float), to float up to the wires (Brady's request)
          // ③ the wires over the tracks while the train passes below
          ['trainWires', { len: 30, period: 8 }],
          ['rooftops', { n: 2, gold: true }],
          ['enemies', { kind: 'vnNon', n: 1, len: 8 }],
          ['trainWires', { len: 24, period: 7.5 }],
          ['stoolTower', {}],
          ['end', { exit: 'main' }]
        ] },
      { id: 'caphe', gen: 'room', role: 'secret', stamp: 'caphe', room: 'shell',
        shell: { title: 'THREE COFFEES', rule: 'THE CAFE OWNER HIDES A PRIZE UNDER ONE OF THREE COFFEE CUPS. WATCH, THEN STOMP THE RIGHT ONE', cup: 'cup', dealer: 'frog', joke: ['sock', 'fish'] } }
    ] },
  // 10-2 RIDE: Ha Long Bay on a junk
  { n: 2, name: 'Ha Long Junk', arch: 'ride', theme: 'vn_bay',
    gimmick: 'Sail a junk between the karsts: hop the rocks, lasso the cliff trees to swing up to the karst tops, then through a sea cave',
    hint: 'THROW at a cliff tree to swing off the junk. Hop back on before it sails away!',
    postcard: 'Thousands of stone islands, and Piwi\'s trunk hiding behind every one. Swing, Brady, swing! ♥ C',
    enemies: [['vnShrimp', 1], ['vnSquid', 2], ['vnCormorant', 1]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '10-3' }, secret: { to: 'house:vn-chonho', hint: 'Bats flutter out of a cave mouth high on a karst...' } },
    areas: [
      { id: 'vinh', gen: 'ride', len: 230, H: 16, deck: 11, below: 'liquid', vehicle: 'vnJunk', vehicleW: 8, scroll: 2.3,
        script: [
          'dockLasso',
          // ① karsts and rocks
          ['rocks', { n: 2 }],
          ['karstLedge', { shrimp: true, item: 'power' }],
          ['cliffTree', { gold: 'must' }],
          ['rocks', { n: 1 }],
          // ② lasso the trees; leaping squid
          ['squids', {}],
          ['cliffTree', {}],
          ['caveMouth', { to: 'hang@in', back: 'hangBack' }],
          ['squids', { bird: true }],
          // ③ a sea cave straight through a karst, the double swing
          ['seaCave', { item: 'power' }],
          ['doubleTree', { gold: 'risky' }],
          ['rocks', { n: 2 }],
          ['karstLedge', { shrimp: true }]
        ] },
      { id: 'hang', gen: 'room', role: 'secret', theme: 'vn_cave', stamp: 'hang', room: 'lantern',
        lantern: { title: 'THE GLOW-WORM CAVE', rule: 'A CAVE BEHIND THE BAY. YOUR LIGHT FADES: RELIGHT IT AT THE LANTERNS. THE ROCKS SHOW ONLY IN THE LIGHT' } }
    ] },
  // 10-3 LAMP: Hoi An by lantern light
  { n: 3, name: 'Hoi An Lanterns', arch: 'gong', theme: 'vn_river',
    gimmick: 'The night market on wheels: ring a gong and every stall cart of its colour rolls to its other spot. Change the street until there is a way through',
    hint: 'A dashed outline shows where a cart will roll. Red moves the red carts, green the green ones; you may need a gong twice',
    postcard: 'The whole river is floating lanterns tonight. I made a wish. It was about you. (And noodles.) ♥ C',
    enemies: [['vnToad', 2], ['vnMosquito', 2], ['vnSilkworm', 1]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '10-4' }, secret: { to: '10-6', hint: 'A lantern workshop has a back door to the river...' } },
    areas: [
      { id: 'phoco', gen: 'room', theme: 'vn_river', stamp: 'market' },
      { id: 'xuong', gen: 'room', role: 'secret', stamp: 'xuong', room: 'lamps',
        lamps: { title: 'THE LANTERN WORKSHOP', rule: 'THE LANTERN MAKER\'S WORKSHOP IS DARK. LIGHT HER LANTERNS IN THE ORDER HER SKETCH SHOWS', sym: 3 } }
    ] },
  // 10-4 RISE (flood): the cave floods while Brady climbs to the skylight
  { n: 4, name: 'Son Doong Flood', arch: 'rise', theme: 'vn_cave', pupo: 'level',   // Vietnam's Pupo level: The Cave Pearl
    gimmick: 'The giant cave floods: swim and climb, lasso the stalactites and reel up the shafts, a jungle under the skylight, the water still rising',
    hint: 'The water keeps rising! Lasso a stalactite and hold UP to reel in. Fins help you swim',
    postcard: 'There\'s a whole jungle growing inside this cave. And a river. And now a lot more river. ♥ C',
    enemies: [['vnBat', 1], ['vnCaveCrab', 1]],
    mapCell: [2, 1], mapFrom: 2,
    exits: { main: { to: '10-5' } },
    areas: [
      { id: 'hang', gen: 'rise', W: 28, H: 118, risingWater: { speed: 0.35, delay: 8 },   // 8 more rows for the pearl gate
        script: [
          'cstart',
          ['finsBand', { item: 'power' }],
          ['cledges', { n: 3 }],
          ['reel', { gold: true }],
          ['napAt', { x: 25, dy: 3 }],   // Pupo (PUPO.md §4.2): his Nap Box on the first dry ledge, over the first shaft
          ['cledges', { n: 3, flip: true, bat: true }],
          'ccp',
          ['napAt', { x: 23, dy: 3 }],   // the backup Nap Box at the checkpoint (the near side of the pearl gate)
          'chamber',
          ['skyGarden', { to: 'rung@in', back: 'rungBack' }],
          ['pearlGate', { key: 'pearl' }],   // The Cave Pearl
          ['reel', { flip: true }],
          ['cledges', { n: 3 }],
          ['reel', {}],
          ['cledges', { n: 2, bat: true }]
        ] },
      { id: 'rung', gen: 'room', role: 'secret', stamp: 'rung', room: 'climb',
        climb: { title: 'THE CAVE JUNGLE CLIMB', rule: 'A JUNGLE GROWING UP A CAVE SHAFT. CLIMB IT: THE PRIZE IS IN THE SKYLIGHT', style: 'plain' } }
    ] },
  // 10-5 LAIR: the citadel's coffee works, then Ong Phin in the courtyard
  { n: 5, name: 'Hue Citadel', arch: 'lair', theme: 'vn_citadel', boss: 'vn_phin',
    gimmick: 'Piwi\'s backstage coffee works: hot coffee crossed on melting ice cubes, drip filters leave hot trails, roasters spit beans; then Ong Phin under the great kettle',
    hint: 'Ong Phin is too hot to stomp. Jump on a foot pedal: the kettle swings across the courtyard and steams him!',
    postcard: 'The bridge is back in Hoi An! Piwi flew off toward Japan. He left his coffee. I drank it. ♥ C',
    enemies: [['vnBean', 2], ['vnPhinDrip', 2]],
    mapCell: [1, 2], mapFrom: 3,
    exits: { main: { to: 'country:next' } },
    areas: [
      { id: 'hoangthanh', gen: 'strip', W: 76, H: 18,
        script: [
          ['itemBlock', { item: 'power', y: 4 }],
          ['coffeepit', { n: 2 }],
          'meetPhin',
          ['roasters', { gold: true }],
          ['storeDoor', { to: 'kho@in', back: 'khoBack' }],
          'palacehall',
          ['coffeepit', { n: 3 }],
          ['door', { to: 'kettle', perch: 0, look: 'vnHallDoor' }]
        ] },
      { id: 'kho', gen: 'room', role: 'secret', stamp: 'kho', room: 'bigone',
        bigone: { title: 'THE BIG COFFEE BEAN', rule: 'A GIANT, VERY STRONG COFFEE BEAN GUARDS THE STORE. STOMP IT THREE TIMES', critter: 'vnBean', name: 'THE BIG COFFEE BEAN' } },
      { id: 'kettle', gen: 'arena', role: 'arena', layout: 'kettle', arenaW: 26, H: 18, roof: false }
    ] },
  // 10-6 HUB (errand, secret): the Mekong floating market
  { n: 6, name: 'Mekong Floating Market', arch: 'hub', secret: true, theme: 'vn_mekong', pupo: 'helper',   // Pupo's Nap Box in the plaza, the lantern hooks over the canal lane to a 1-up
    gimmick: 'Trade your way through a floating market: a coconut from the orchard, coconut candy from the workshop, fruit from the canal boats, and the stamp',
    hint: 'Each friend wants something: the buffalo a coconut, the duck candy, the gecko fruit',
    postcard: 'A whole market on boats! I bought coconut candy from a duck. Don\'t ask. ♥ C',
    enemies: [['vnShrimp', 1], ['vnToad', 2]],
    mapCell: [1, 1], mapFrom: 2,
    exits: { main: {} },
    areas: [
      { id: 'cho', gen: 'room', role: 'main', theme: 'vn_mekong', stamp: 'cho' },
      { id: 'vuon', gen: 'strip', role: 'sub', W: 70, H: 18,
        enemies: [['vnToad', 2]],
        script: [
          ['itemBlock', { item: 'socks', y: 4 }],   // a jump power (bonus)
          ['orchard', { gold: 'must' }],
          ['sampans', { span: 8 }],
          ['orchard', {}],
          ['enemies', { kind: 'vnToad', n: 1, len: 8 }],
          ['goods', { id: 'k1', item: 'coconut' }],
          ['door', { to: 'cho@vuonBack', perch: 0, look: 'vnMarketDoor' }]
        ] },
      { id: 'kenh', gen: 'strip', role: 'sub', W: 70, H: 22, GY: 18, gyMax: 18,   // four more rows of sky (the lantern hooks stay clear of the HUD)
        enemies: [['vnShrimp', 1]],
        script: [
          ['lanternRoofs', { n: 6 }],   // Pupo's bonus (a helper here, PUPO.md §4.3): lantern hooks over the lane to a 1-up
          ['sampans', { span: 9 }],
          ['ferry', {}],
          ['sampans', { span: 11, speed: 1.8, shrimp: true }],
          ['enemies', { kind: 'vnShrimp', n: 1, len: 8 }],
          ['goods', { id: 'k3', item: 'fruit' }],
          ['door', { to: 'cho@kenhBack', perch: 0, look: 'vnMarketDoor' }]
        ] },
      { id: 'lokeo', gen: 'room', role: 'sub', stamp: 'lokeo' },
      { id: 'thuyen', gen: 'room', role: 'secret', stamp: 'thuyen', room: 'rush',
        rush: { title: 'FLOATING MARKET RUSH', rule: 'A FRUIT BOAT TIPPED OVER! GRAB ALL SIX MANGOES BEFORE THEY FLOAT AWAY', look: 'tokMango', n: 6, t: 16 } }
    ] }
];

for (const k in P) Tour.pieces['vn.' + k] = P[k];
Tour.amend('vn', {
  stamps, skins,
  map: { fort: 'citadel', start: [0, 0] },
  houses: [{ id: 'vn-chonho', kind: 'stand', name: 'Chợ Nhỏ', keeper: 'buffalo', stock: ['fins', 'magnet', 'sundial', 'oneup', 'plane', 'kazoo'], mapCell: [0, 1], mapFrom: 1 }],
  levels
});
})();
