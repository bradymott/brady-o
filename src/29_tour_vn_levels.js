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
      [7, 9, 'o.o.o'], [6, 11, '-------'],
      [34, 9, 'o.o.o'], [33, 11, '-------'],
      [4, 12, 'o'], [11, 7, '?'],
      [2, 16, 'E'], [5, 16, '@'], [8, 16, 'n'], [13, 16, 'D'], [15, 16, 'a'],
      [26, 16, '1'], [29, 16, 'D'], [31, 16, 'w'],
      [43, 16, '2'], [46, 16, 'D'], [48, 16, 'j'],
      [55, 16, '3'], [60, 16, 'G'],
      [20, 16, 'k'], [36, 16, 'k'], [52, 16, 'k']
    ], { open: true, wall: '#' }),
    legend: {
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
          // ③ the wires over the tracks while the train passes below
          ['trainWires', { len: 30, period: 8 }],
          ['rooftops', { n: 2, gold: true }],
          ['enemies', { kind: 'vnNon', n: 1, len: 8 }],
          ['trainWires', { len: 24, period: 7.5 }],
          ['stoolTower', {}],
          ['end', { exit: 'main' }]
        ] },
      { id: 'caphe', gen: 'room', role: 'secret', stamp: 'caphe' }
    ] },
  // 10-2 RIDE: Ha Long Bay on a junk
  { n: 2, name: 'Ha Long Junk', arch: 'ride', theme: 'vn_bay',
    gimmick: 'Sail a junk between the karsts: hop the rocks, lasso the cliff trees to swing up to the karst tops, then through a sea cave',
    hint: 'THROW at a cliff tree to swing off the junk. Hop back on before it sails away!',
    postcard: 'Thousands of stone islands, and the Baron\'s blimp hiding behind every one. Swing, Brady, swing! ♥ C',
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
      { id: 'hang', gen: 'room', role: 'secret', theme: 'vn_cave', stamp: 'hang' }
    ] },
  // 10-3 LAMP: Hoi An by lantern light
  { n: 3, name: 'Hoi An Lanterns', arch: 'lamp', theme: 'vn_river', dark: true,
    gimmick: 'The old town by the light of a paper lantern: relight it at the lantern shops, lasso the ferry over the river, ride the floating lanterns while silkworms drop',
    hint: 'Your lantern fades: touch a lantern shop\'s big lantern to relight it. THROW at the moored boat to pull it over',
    postcard: 'The whole river is floating lanterns tonight. I made a wish. It was about you. (And noodles.) ♥ C',
    enemies: [['vnToad', 2], ['vnMosquito', 2], ['vnSilkworm', 2]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '10-4' }, secret: { to: '10-6', hint: 'A lantern workshop has a back door to the river...' } },
    areas: [
      { id: 'phoco', gen: 'strip', W: 200, H: 18, lamp: { r0: 170, r1: 70, decay: 24 },
        script: [
          'pho',
          ['gearStand', { item: 'hat' }],
          ['itemBlock', { item: 'beans', y: 4 }],   // a jump power (bonus)
          // ① the lantern shops
          ['lanternShop', {}],
          ['oldstreet', {}],
          ['lanterns', { n: 1 }],
          ['lanternShop', { gold: 'must' }],
          // ② the ferry
          ['ferry', {}],
          ['workshop', { to: 'xuong@in', back: 'xuongBack' }],
          ['silkAwning', { n: 2 }],
          'cp',
          ['lanternShop', {}],
          // ③ floating lanterns and silkworms
          ['riverLanterns', { n: 2, silk: true }],
          ['silkAwning', { n: 3, len: 14 }],
          ['itemBlock', { item: 'lsd', y: 5 }],
          ['lanternShop', {}],
          ['riverLanterns', { n: 3, span: 13, gold: 'risky' }],
          'bridgearch',
          ['end', { exit: 'main' }]
        ] },
      { id: 'xuong', gen: 'room', role: 'secret', stamp: 'xuong' }
    ] },
  // 10-4 RISE (flood): the cave floods while Brady climbs to the skylight
  { n: 4, name: 'Son Doong Flood', arch: 'rise', theme: 'vn_cave',
    gimmick: 'The giant cave floods: swim and climb, lasso the stalactites and reel up the shafts, a jungle under the skylight, the water still rising',
    hint: 'The water keeps rising! Lasso a stalactite and hold UP to reel in. Fins help you swim',
    postcard: 'There\'s a whole jungle growing inside this cave. And a river. And now a lot more river. ♥ C',
    enemies: [['vnBat', 1], ['vnCaveCrab', 1]],
    mapCell: [2, 1], mapFrom: 2,
    exits: { main: { to: '10-5' } },
    areas: [
      { id: 'hang', gen: 'rise', W: 28, H: 110, risingWater: { speed: 0.35, delay: 8 },
        script: [
          'cstart',
          ['finsBand', { item: 'power' }],
          ['cledges', { n: 3 }],
          ['reel', { gold: true }],
          ['cledges', { n: 3, flip: true, bat: true }],
          'ccp',
          'chamber',
          ['skyGarden', { to: 'rung@in', back: 'rungBack' }],
          ['reel', { flip: true }],
          ['cledges', { n: 3 }],
          ['reel', {}],
          ['cledges', { n: 2, bat: true }]
        ] },
      { id: 'rung', gen: 'room', role: 'secret', stamp: 'rung' }
    ] },
  // 10-5 LAIR: the citadel's coffee works, then Ong Phin in the courtyard
  { n: 5, name: 'Hue Citadel', arch: 'lair', theme: 'vn_citadel', boss: 'vn_phin',
    gimmick: 'The Baron\'s coffee works: hot coffee crossed on melting ice cubes, drip filters leave hot trails, roasters spit beans; then Ong Phin under the great kettle',
    hint: 'Ong Phin is too hot to stomp. Jump on a foot pedal: the kettle swings across the courtyard and steams him!',
    postcard: 'The bridge is back in Hoi An! The Baron flew off toward Japan. He left his coffee. ♥ C',
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
      { id: 'kho', gen: 'room', role: 'secret', stamp: 'kho' },
      { id: 'kettle', gen: 'arena', role: 'arena', layout: 'kettle', arenaW: 26, H: 18, roof: false }
    ] },
  // 10-6 HUB (errand, secret): the Mekong floating market
  { n: 6, name: 'Mekong Floating Market', arch: 'hub', secret: true, theme: 'vn_mekong',
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
      { id: 'kenh', gen: 'strip', role: 'sub', W: 70, H: 18,
        enemies: [['vnShrimp', 1]],
        script: [
          ['sampans', { span: 9 }],
          ['ferry', {}],
          ['sampans', { span: 11, speed: 1.8, shrimp: true }],
          ['enemies', { kind: 'vnShrimp', n: 1, len: 8 }],
          ['goods', { id: 'k3', item: 'fruit' }],
          ['door', { to: 'cho@kenhBack', perch: 0, look: 'vnMarketDoor' }]
        ] },
      { id: 'lokeo', gen: 'room', role: 'sub', stamp: 'lokeo' },
      { id: 'thuyen', gen: 'room', role: 'secret', stamp: 'thuyen' }
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
