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
const POLDER = { low: 19, high: 14 };
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
const levels = [
  // 8-1 SWITCH: the polder's water level
  { n: 1, name: 'Polder Pumps', mapLabel: 'Polder', arch: 'switch', theme: 'nl_polder',
    gimmick: 'A valve wheel fills and empties the polder canals: swim across at high water, walk the canal bed at low water',
    hint: 'Turn a valve (THROW) to flood or drain the canals. Every canal bed has a valve, so you can always get out',
    postcard: 'Half of this country is below the sea, and the pumps keep it dry. Very clever pumps. ♥ C',
    enemies: [['nlBulb', 2], ['nlClog', 2], ['nlHerring', 2]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '8-2' }, secret: { to: 'house:nl-winkel', hint: 'At low water, a door shows on a canal bed...' } },
    areas: [
      { id: 'polder', gen: 'strip', W: 220, H: 20, waterLine: POLDER.low,
        script: [
          ['itemBlock', { item: 'sig', y: 4 }],
          'pump',
          ['canal', { w: 7 }],
          ['meet', { kind: 'nlBulb', text: 'TULIP BULBS BURROW UNDER YOUR FEET. STEP OFF WHEN THE MOUND WIGGLES', len: 12 }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['canal', { w: 9, door: 'gemaal@in', back: 'gemaalBack' }],
          ['enemies', { kind: 'nlClog', n: 2, len: 10 }],
          'cp',
          ['hooks', { n: 2 }],
          ['postcard', { kind: 'must', dy: -6 }],
          ['itemBlock', { item: 'fins', y: 4 }],
          ['racks', { n: 2 }],
          ['toggle', { g: 2, kind: 'valve', wall: 4 }],
          ['canal', { w: 8, gold: 'risky' }],
          ['enemies', { kind: 'nlBulb', n: 2, len: 12 }],
          ['canal', { w: 6 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'gemaal', gen: 'room', role: 'secret', stamp: 'gemaal' }
    ] },
  // 8-2 FACTORY: the flower auction
  { n: 2, name: 'Flower Auction', mapLabel: 'Auction', arch: 'factory', theme: 'nl_veiling',
    gimmick: 'Trolleys of tulips ride the belts, the auction clock\'s hand sweeps the floor, crate stacks to climb',
    hint: 'Duck the clock hand or jump it. The Pocket Sundial slows everything down',
    postcard: 'A flower auction with a clock that counts DOWN. Whoever presses first buys the tulips. ♥ C',
    enemies: [['nlBee', 2], ['nlBulb', 2], ['nlClog', 2]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '8-3' }, secret: { to: '8-6', hint: 'Cold mist creeps out of a door at the auction...' } },
    areas: [
      { id: 'veiling', gen: 'strip', W: 200, H: 20,
        script: [
          ['itemBlock', { item: 'power', y: 4 }],
          ['trolleys', { n: 2 }],
          ['enemies', { kind: 'nlBulb', n: 1, len: 8 }],
          ['gearStand', { item: 'sundial' }],
          ['clock', { gold: 'must' }],
          ['crates', { h: 3 }],
          ['belt', { dir: -1, n: 9 }],
          ['enemies', { kind: 'nlBee', n: 2, len: 10 }],
          'cp',
          ['coldDoor', { to: 'koelcel@in', back: 'koelBack' }],
          ['clock', { len: 4, speed: 1.3 }],
          ['postcard', { kind: 'risky', dy: -2, dx: -6 }],
          ['crates', { h: 4 }],
          ['itemBlock', { item: 'kazoo', y: 4 }],
          ['trolleys', { n: 3 }],
          ['enemies', { kind: 'nlClog', n: 2, len: 10 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'koelcel', gen: 'room', role: 'secret', stamp: 'koelcel' }
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
          'hop',
          ['drawbridge', { fast: true }],
          ['postcard', { kind: 'risky', dy: -5, dx: -4 }],
          'tram',
          ['enemies', { kind: 'nlGull', n: 2, len: 10 }],
          'hop',
          ['racks', { n: 1 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'brug', gen: 'room', role: 'secret', stamp: 'brug' }
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
      { id: 'hut', gen: 'room', role: 'secret', stamp: 'hut' }
    ] },
  // 8-5 LAIR: the cheese market and the weigh house
  { n: 5, name: 'The Weigh House', mapLabel: 'The Waag', arch: 'lair', theme: 'nl_waag', boss: 'nl_cheese',
    gimmick: 'Cheese sledges on the market ramps, the weighing scales, the cheese chute, then the Cheese King\'s hall',
    hint: 'Run into the Cheese King\'s wheels to kick them back at him! (The bike bell stops a rolling wheel.)',
    postcard: 'The windmill is unfolded and turning again! The Baron fled to Bali. Bring sunscreen. ♥ C',
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
      { id: 'kelder', gen: 'room', role: 'secret', stamp: 'kelder' },
      { id: 'waag', gen: 'arena', role: 'arena', layout: 'waag', arenaW: 30, H: 18, roof: false }
    ] },
  // 8-6 SWING (secret): windmill sails and tulip blooms; the wind turns round
  { n: 6, name: 'Windmill Row', mapLabel: 'Windmills', arch: 'swing', secret: true, theme: 'nl_molens',
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
          ['mill', { gold: 'high' }],
          ['tulips', { n: 3 }],
          ['mill', {}],
          ['enemies', { kind: 'nlBee', n: 1, len: 8 }],
          'cp',
          ['mill', { reverse: true }],
          ['tulips', { n: 4 }],
          ['mill', { reverse: true, speed: 1.0, gold: 'risky' }],
          ['itemBlock', { item: 'lsd', y: 5 }],
          ['mill', { reverse: true }],
          ['millDoor', { to: 'molen@in', back: 'molenBack' }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'molen', gen: 'room', role: 'secret', stamp: 'molen' }
    ] }
];

for (const k in P) Tour.pieces['nl.' + k] = P[k];
Tour.amend('nl', {
  stamps, skins,
  map: { fort: 'waag', start: [0, 0] },
  houses: [{ id: 'nl-winkel', mapLabel: 'Winkel', kind: 'stand', name: 'De Winkel', keeper: 'goose', stock: ['fins', 'kazoo', 'magnet', 'sundial', 'oneup', 'wand'], mapCell: [0, 1], mapFrom: 0 }],
  levels
});
})();
