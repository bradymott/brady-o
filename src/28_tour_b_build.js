/* ============================================================
   World tour: level builder.
   A level is a SCRIPT of set pieces run in order (no random filler),
   inside one of the layout styles. Generic pieces live here;
   countries add their own as '<cc>.<name>'.
   ============================================================ */
const TourBuild = {
  generate(w, i, attempt) {
    const C = Tour.byWorld[w], spec = C.levels[i - 1], id = w + '-' + i;
    const rng = mulberry32(hashStr('tour:' + id + ':' + (attempt || 0)));
    const d = Tour.difficulty(w, i);
    const ctx = {
      rng, w, i, id, d, C, spec, R: spec, theme: spec.theme, areas: [], world: WORLDS[w],
      pool: (spec.enemies || []).map(e => Array.isArray(e) ? e : [e, 1])
    };
    const gen = TourStyles[spec.style] || TourStyles.run;
    const main = gen(ctx);
    const style = spec.style || 'run';
    return {
      id, world: w, index: i, type: TOUR_STYLE_PLAN[style] || 'ow', arch: style, kind: style === 'castle' ? 'castle' : 'level',
      name: spec.name, worldName: C.name, areas: [main.area].concat(ctx.areas), start: main.start, time: main.time || spec.time || 300, d,
      secret: spec.secret ? { kind: 'secretExit', to: spec.secret.to } : null, warps: null, hint: spec.hint || null, design: spec,
      tour: true, country: C.id
    };
  },
  // area properties shared by every style
  areaProps(ctx, extra) {
    const S = ctx.spec, th = THEMES[ctx.theme] || {};
    return Object.assign({
      theme: ctx.theme, music: S.music || ctx.C.music.level, water: false, dark: !!S.dark, autoscroll: 0, gravity: 1,
      wind: S.wind || null, dust: S.dust || 0, liquid: S.liquid || th.liquid || null, beat: S.bpm ? { bpm: S.bpm } : null, tour: true
    }, extra || {});
  }
};

/* ---------- builder state: what a set piece works with ---------- */
// st.x = next free column, st.gy = current ground row (top surface). Pieces return the new st.x.
function tourState(ctx, B, o) {
  const st = Object.assign({ ctx, B, rng: ctx.rng, d: ctx.d, x: 0, gy: o.GY, R: ctx.spec, sky: false, cave: false }, o);
  st.floor = (x0, x1, gy) => { gy = gy == null ? st.gy : gy; if (st.sky) B.fill(x0, gy, x1, Math.min(B.H - 1, gy + 2), T.GROUND); else B.ground(x0, x1, gy); };
  st.pit = (x0, x1) => { for (let x = x0; x <= x1; x++) B.clearCol(x, 0, B.H - 1); if (st.ceil) for (let x = x0; x <= x1; x++) B.fill(x, 0, x, st.ceil, T.GROUND); };
  st.coins = (x0, x1, y) => B.picksRow(x0, x1, y);
  st.arc = (x0, x1, yb, h) => B.picksArc(x0, x1, yb, h);
  st.semi = (x0, x1, y) => { for (let x = x0; x <= x1; x++) B.set(x, y, T.SEMI); };
  st.block = (tx, ty, content, tile) => { B.set(tx, ty, tile || T.QBLOCK); if (content) B.item(tx, ty, content); };
  st.enemy = (kind, tx, gy, props) => tourSpawnEnemy(ctx, B, kind, tx, gy == null ? st.gy : gy, props);
  st.pickEnemy = avoid => { let p = ctx.pool.filter(e => !avoid || avoid.indexOf(e[0]) < 0); if (!p.length) p = ctx.pool; return p.length ? ctx.rng.weighted(p) : null; };
  st.decor = (kind, tx, gy, seed) => B.decorAt(kind, tx, gy == null ? st.gy : gy, seed == null ? ctx.rng.int(0, 99) : seed);
  st.gold = (tx, ty, kind) => B.gold(tx, ty, kind || 'high');
  st.spawn = (type, tx, ty, props) => B.spawn(type, tx, ty, props);
  st.sign = (tx, text, gy) => B.spawn('sign', tx, (gy == null ? st.gy : gy) - 1, { text });
  // scatter the theme's decor on a flat stretch
  st.dress = (x0, x1, density) => {
    const th = THEMES[B.themeKey || ctx.theme], list = (ctx.spec.decor) || (th && th.decor);
    if (!list || !list.length) return;
    for (let x = x0; x <= x1; x++) if (ctx.rng() < (density || 0.14) && B.get(x, st.gy - 1) === T.EMPTY && SOLID[B.get(x, st.gy)] && !B.hide[st.gy * B.W + x]) { B.decorAt(ctx.rng.pick(list), x, st.gy, ctx.rng.int(0, 99)); x += 2; }
  };
  // run one script step: 'name', ['name', {opts}] or a function
  st.run = step => {
    let name = step, opts = {};
    if (Array.isArray(step)) { name = step[0]; opts = step[1] || {}; }
    if (typeof name === 'function') return name(st, opts);
    const fn = Tour.pieces[ctx.C.id + '.' + name] || Tour.pieces[name];
    if (!fn) { console.warn('tour: unknown piece', name); return Tour.pieces.flat(st, {}); }
    return fn(st, opts);
  };
  return st;
}
function tourSpawnEnemy(ctx, B, kind, tx, gy, props) {
  if (!kind) return null;
  const place = (Tour.enemyInfo[kind] && Tour.enemyInfo[kind].place) || 'walk';
  if (place === 'fly') return B.spawn(kind, tx, gy - 4 - ctx.rng.int(0, 1), props);
  if (place === 'swim' || place === 'here') return B.spawn(kind, tx, gy, props);
  return B.spawn(kind, tx, gy - 1, Object.assign({ dir: -1 }, props || {}));
}

/* ---------- layout styles ---------- */
const TourStyles = {
  run: ctx => tourStrip(ctx, 'run'),
  night: ctx => tourStrip(ctx, 'run'),
  auto: ctx => tourStrip(ctx, 'auto'),
  castle: ctx => tourStrip(ctx, 'castle'),
  ride: ctx => tourRide(ctx),
  swim: ctx => tourSwim(ctx),
  climb: ctx => tourClimb(ctx)
};

// side-scrollers (run / night / auto / castle): ground at GY, set pieces left to right
function tourStrip(ctx, mode) {
  const S = ctx.spec, rng = ctx.rng;
  const H = S.H || 18, GY = S.GY || 14;
  const B = new AreaBuilder(S.width || 420, H);
  B.themeKey = ctx.theme;
  const st = tourState(ctx, B, { GY, H, mode, auto: mode === 'auto', gyMin: S.gyMin || 8, gyMax: S.gyMax || 15, ceil: S.ceil || 0 });
  st.floor(0, 11, GY);
  st.dress(1, 10, 0.25);
  if (ctx.i === 1) { B.set(7, GY - 4, T.HIDDEN); B.item(7, GY - 4, 'oneup'); }
  st.x = 12;
  const script = (S.script || []).slice();
  if (!script.some(s => s === 'end' || (Array.isArray(s) && s[0] === 'end'))) script.push(mode === 'castle' ? 'arena' : 'end');
  if (!script.some(s => s === 'cp' || (Array.isArray(s) && s[0] === 'cp'))) script.splice(Math.floor(script.length / 2), 0, 'cp');
  for (let k = 0; k < script.length; k++) {
    const step = script[k];
    const nm = Array.isArray(step) ? step[0] : step;
    // a short breather between set pieces (not before the finale)
    if (k > 0 && nm !== 'end' && nm !== 'arena' && !(Array.isArray(step) && step[1] && step[1].tight)) { const br = rng.int(1, 2); st.floor(st.x, st.x + br - 1); st.x += br; }
    st.x = st.run(step);
    st.gy = clamp(st.gy, st.gyMin, st.gyMax);
  }
  if (st.ceil) for (let cx = 0; cx < st.x; cx++) if (B.get(cx, 0) === T.EMPTY) B.fill(cx, 0, cx, st.ceil, T.GROUND);
  B.trim(st.x);
  resolvePendingReturns(st);
  pickGold(ctx, B);
  const area = B.build(TourBuild.areaProps(ctx, {
    autoscroll: mode === 'auto' ? (S.scroll || 2.6 + ctx.d * 0.8) : 0, castle: mode === 'castle',
    chasers: null, risingLava: S.risingLava || null
  }));
  return { area, start: { area: 0, x: 5 * TS + TS / 2, y: GY * TS }, time: S.time || (mode === 'auto' ? 400 : 300) };
}

// ride a vehicle (boat, tram, train...) that carries Brady through the level at the scroll speed
function tourRide(ctx) {
  const S = ctx.spec;
  const H = S.H || 16, DECK = S.deck || 11, len = S.len || 170;
  const B = new AreaBuilder(len + 40, H);
  B.themeKey = ctx.theme;
  const speed = S.scroll || 2.4 + ctx.d * 0.6;
  const vw = S.vehicleW || 10;
  B.spawn('mplat', 1, DECK - 1, { pw: vw, carrier: true, speed, stopX: (len - vw - 1) * TS, skin: S.vehicle || 'tourBoat' });
  for (let x = 0; x < len + 2; x++) B.ghosts.push([x, DECK]);
  // the water / track below: falling in costs a life
  if (S.below === 'liquid') for (let x = 0; x < len + 40; x++) B.set(x, H - 1, T.LAVA);
  const st = tourState(ctx, B, { GY: DECK, H, mode: 'ride', deck: DECK, speed, len });
  // the dock at the start
  B.fill(0, DECK, 0, H - 1, T.GROUND);
  st.x = 16;
  const script = (S.script || []).slice();
  if (!script.includes('cp')) script.splice(Math.floor(script.length / 2), 0, 'cp');
  for (const step of script) { st.x = st.run(step); st.x += ctx.rng.int(2, 4); if (st.x > len - 18) break; }
  // the landing at the end of the ride
  B.fill(len, DECK, len + 21, H - 1, T.GROUND);
  B.spawn('gate', len + 13, DECK - 1, {});
  B.gold(len + 5, DECK - 5, 'high');
  for (let x = len; x < len + 21; x++) B.set(x, H - 1, T.GROUND);
  B.trim(len + 22);
  pickGold(ctx, B);
  const area = B.build(TourBuild.areaProps(ctx, { autoscroll: speed, carrier: true }));
  return { area, start: { area: 0, x: 5 * TS + TS / 2, y: DECK * TS }, time: S.time || 400 };
}

// underwater: a wide flooded cave with a ceiling; set pieces shape the rock
function tourSwim(ctx) {
  const S = ctx.spec;
  const H = S.H || 18, FLOOR = H - 3;
  const B = new AreaBuilder(S.width || 360, H);
  B.themeKey = ctx.theme;
  B.fill(0, 0, B.W - 1, 1, T.GROUND);
  B.ground(0, B.W - 1, FLOOR);
  const st = tourState(ctx, B, { GY: FLOOR, H, mode: 'swim', floorY: FLOOR, top: 2 });
  // the whole area is water: pieces carve rock in and open it back up
  st.rock = (x0, y0, x1, y1) => B.fill(x0, y0, x1, y1, T.GROUND);
  st.water = (x0, y0, x1, y1) => B.fill(x0, y0, x1, y1, T.EMPTY);
  st.x = 10;
  const script = (S.script || []).slice();
  if (!script.includes('cp')) script.splice(Math.floor(script.length / 2), 0, 'cp');
  for (const step of script) { st.x = st.run(step); st.x += 2; }
  // the exit: a ledge with the goal at the end of the cave
  const x = st.x + 2;
  st.water(x, 2, x + 18, FLOOR - 1);
  B.fill(x + 8, FLOOR - 4, x + 18, FLOOR - 1, T.GROUND);
  B.spawn('gate', x + 14, FLOOR - 5, {});
  B.gold(x + 4, 6, 'high');
  B.fill(x + 19, 0, x + 20, H - 1, T.GROUND);
  B.trim(x + 21);
  pickGold(ctx, B);
  const area = B.build(TourBuild.areaProps(ctx, { water: true }));
  return { area, start: { area: 0, x: 4 * TS + TS / 2, y: 5 * TS }, time: S.time || 300 };
}

// a vertical climb: pieces stack upward from the bottom; the goal waits at the top
function tourClimb(ctx) {
  const S = ctx.spec;
  const W = S.W || 24, H = S.H || 96;
  const B = new AreaBuilder(W, H);
  B.themeKey = ctx.theme;
  B.fill(0, 0, 0, H - 1, T.HARD); B.fill(W - 1, 0, W - 1, H - 1, T.HARD);
  B.ground(0, W - 1, H - 2);
  const st = tourState(ctx, B, { GY: H - 2, H, W, mode: 'climb' });
  st.y = H - 2;                       // the floor row the next band starts from
  st.x = 1;
  st.band = (rows) => { st.y -= rows; return st.y; };
  // every band ends on a full-width one-way floor (except where `holes` leaves columns open)
  st.tops = [];
  st.top = (y, holes) => { for (let x = 2; x <= W - 3; x++) if (!(holes && holes.some(([a, b]) => x >= a && x <= b))) { if (B.get(x, y) === T.EMPTY) B.set(x, y, T.SEMI); } st.y = y; st.tops.push(y); };
  st.mid = Math.floor(W / 2);
  const script = (S.script || []).slice();
  for (const step of script) { st.run(step); if (st.y < 16) break; }
  // the summit: a wide ledge with the goal
  const top = Math.max(6, st.y - 3);
  B.fill(1, top, W - 2, top, T.GROUND); B.fill(1, top + 1, W - 2, top + 1, T.GROUND);
  for (let y = 0; y < top; y++) for (let x = 1; x < W - 1; x++) B.set(x, y, T.EMPTY);
  // a gap in the summit floor so the climb can come up through it
  const hole = st.holeX != null ? st.holeX : Math.floor(W / 2) - 2;
  for (let x = hole; x < hole + 4; x++) { B.set(x, top, T.EMPTY); B.set(x, top + 1, T.EMPTY); }
  for (let x = hole; x < hole + 4; x++) B.set(x, top, T.SEMI);
  B.spawn('gate', W - 5, top - 1, {});
  B.gold(3, top - 4, 'high');
  // spare postcard spots above the bands' one-way floors (always reachable)
  for (const y of st.tops.slice(0, -1)) if (y > top + 4) B.gold(ctx.rng.pick([3, 4, W - 5, W - 4]), y - 2, 'spare');
  pickGold(ctx, B);
  const area = B.build(TourBuild.areaProps(ctx, { tower: true, risingLava: S.risingLava || null }));
  return { area, start: { area: 0, x: 4 * TS + TS / 2, y: (H - 2) * TS }, time: S.time || 300 };
}

/* ---------- generic set pieces ---------- */
Object.assign(Tour.pieces, {
  // plain ground with a row of coins
  flat(st, o) {
    const n = o.n || 6; st.floor(st.x, st.x + n - 1);
    if (o.coins !== false && st.rng.chance(0.6)) st.coins(st.x + 1, st.x + n - 2, st.gy - 2);
    st.dress(st.x, st.x + n - 1);
    return st.x + n;
  },
  // a pit to jump, with a coin arc over it
  gap(st, o) {
    const n = o.n || clamp(2 + Math.round(st.d * 2) + st.rng.int(0, 1), 2, 4);
    st.floor(st.x, st.x + 1); st.x += 2;
    st.pit(st.x, st.x + n - 1);
    if (o.coins !== false) st.arc(st.x - 1, st.x + n, st.gy - 2, 2);
    st.x += n; st.floor(st.x, st.x + 2);
    return st.x + 3;
  },
  // change ground height
  step(st, o) {
    const dh = o.h != null ? o.h : (st.rng.chance(0.5) ? -1 : 1) * st.rng.int(1, 2);
    st.floor(st.x, st.x + 2); st.x += 3;
    st.gy = clamp(st.gy - dh, st.gyMin || 6, st.gyMax || 15);
    st.floor(st.x, st.x + 3);
    return st.x + 4;
  },
  // a staircase of solid blocks up and over
  stairs(st, o) {
    const n = o.n || 4, x = st.x;
    st.floor(x, x + n * 2 + 2);
    for (let i = 0; i < n; i++) B_col(st.B, x + i, st.gy - 1 - i, st.gy - 1, T.HARD);
    for (let i = 0; i < n; i++) B_col(st.B, x + n + 2 + i, st.gy - n + i, st.gy - 1, T.HARD);
    B_col(st.B, x + n, st.gy - n, st.gy - 1, T.HARD); B_col(st.B, x + n + 1, st.gy - n, st.gy - 1, T.HARD);
    st.coins(x + n - 1, x + n + 2, st.gy - n - 2);
    return x + n * 2 + 3;
  },
  // bricks with an item block in the middle
  blocks(st, o) {
    const n = o.n || 5, x = st.x, y = st.gy - (o.y || 4);
    st.floor(x, x + n + 1);
    for (let i = 0; i < n; i++) st.block(x + 1 + i, y, null, T.BRICK);
    const mid = x + 1 + Math.floor(n / 2);
    st.block(mid, y, o.content || 'power');
    if (n >= 5) st.block(x + 2, y, 'pick');
    if (o.high) { st.block(mid, y - 4, o.high); }
    const e = st.pickEnemy(); if (e && !o.noEnemy) st.enemy(e, x + n, st.gy);
    return x + n + 2;
  },
  // floating platforms over a pit
  floating(st, o) {
    const n = o.n || 3; let x = st.x;
    st.floor(x, x + 1); x += 2;
    const span = n * 4 + 1;
    st.pit(x, x + span - 1);
    let y = st.gy;
    for (let i = 0; i < n; i++) {
      y = clamp(y + st.rng.int(-2, 1), Math.max(5, st.gy - 5), st.gy);
      st.semi(x + 1 + i * 4, x + 2 + i * 4, y);
      if (st.rng.chance(0.5)) st.coins(x + 1 + i * 4, x + 2 + i * 4, y - 2);
    }
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // a moving platform across a wide pit
  mover(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = o.span || 8;
    st.pit(x, x + span - 1);
    st.spawn('mplat', x + 1, st.gy - 1, { pw: o.pw || 3, ax: (span - 4) * TS, ay: 0, speed: o.speed || 2, skin: o.skin || null });
    for (let k = 0; k < span; k++) st.B.ghosts.push([x + k, st.gy]);
    st.coins(x + 2, x + span - 3, st.gy - 3);
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // a lift up to a higher ground level
  lift(st, o) {
    const rise = o.rise || 4; let x = st.x;
    st.floor(x, x + 4);
    st.spawn('mplat', x + 1, st.gy - 1, { pw: 3, ax: 0, ay: -rise * TS, speed: 1.6, skin: o.skin || null });
    for (let y = st.gy - rise; y <= st.gy; y++) for (let k = 0; k < 3; k++) st.B.ghosts.push([x + 1 + k, y]);
    st.gy -= rise; x += 4;
    st.floor(x, x + 4);
    st.coins(x + 1, x + 3, st.gy - 2);
    return x + 5;
  },
  // crumbling platforms: keep moving
  fallers(st, o) {
    const n = o.n || 3; let x = st.x; st.floor(x, x + 1); x += 2;
    const span = n * 3 + 1;
    st.pit(x, x + span - 1);
    for (let i = 0; i < n; i++) { st.spawn('fplat', x + 1 + i * 3 + 1, st.gy - 1, { pw: 2, skin: o.skin || null }); st.B.ghosts.push([x + 1 + i * 3, st.gy], [x + 2 + i * 3, st.gy]); }
    st.coins(x + 1, x + span - 2, st.gy - 3);
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // a spring to a high ledge with a postcard
  spring(st, o) {
    const x = st.x; st.floor(x, x + 8);
    st.spawn('spring', x + 2, st.gy - 1, { skin: o.skin || null });
    st.B.springs.push([x + 2, st.gy - 1]);
    const ly = Math.max(3, st.gy - 9);
    st.semi(x + 4, x + 8, ly);
    st.coins(x + 4, x + 8, ly - 2);
    if (o.gold !== false) st.gold(x + 6, ly - 3, 'high');
    return x + 9;
  },
  // pillars of different heights over a pit
  pillars(st, o) {
    const n = o.n || 3; let x = st.x; st.floor(x, x + 1); x += 2;
    for (let i = 0; i < n; i++) {
      st.pit(x, x + 1);
      const h = st.rng.int(1, 3);
      st.B.fill(x + 2, st.gy - h, x + 3, st.B.H - 1, T.PILLAR);
      st.coins(x + 2, x + 3, st.gy - h - 2);
      x += 4;
    }
    st.pit(x, x + 1); x += 2;
    st.floor(x, x + 2);
    return x + 3;
  },
  // a strip of spikes with a bridge above
  spikes(st, o) {
    const n = o.n || 4, x = st.x;
    st.floor(x, x + n + 3);
    for (let i = 0; i < n; i++) st.B.set(x + 2 + i, st.gy - 1, T.SPIKES);
    st.semi(x + 1, x + n + 2, st.gy - 4);
    st.coins(x + 2, x + n + 1, st.gy - 6);
    return x + n + 4;
  },
  // a flat stretch with enemies from the level's mix
  enemies(st, o) {
    const n = o.len || 10, x = st.x;
    st.floor(x, x + n - 1);
    const k = o.n || clamp(1 + Math.round(st.d * 3), 1, 3);
    for (let i = 0; i < k; i++) st.enemy(o.kind || st.pickEnemy(), x + 3 + Math.floor(i * (n - 4) / k), st.gy);
    if (st.rng.chance(0.5)) st.coins(x + 2, x + n - 3, st.gy - 3);
    st.dress(x, x + n - 1, 0.08);
    return x + n;
  },
  // checkpoint
  cp(st, o) {
    const x = st.x; st.floor(x, x + 5);
    st.spawn('checkpoint', x + 3, st.gy - 1);
    return x + 6;
  },
  // the country's signature power-up in a block (with a sign the first time)
  sig(st, o) {
    const x = st.x; st.floor(x, x + 6);
    st.block(x + 3, st.gy - 4, 'sig');
    st.block(x + 2, st.gy - 4, null, T.BRICK); st.block(x + 4, st.gy - 4, null, T.BRICK);
    return x + 7;
  },
  // a high block with the LSD tab (free flight) and a coin trail in the sky
  lsd(st, o) {
    const x = st.x; st.floor(x, x + 8);
    st.semi(x + 2, x + 5, st.gy - 4);
    st.block(x + 4, st.gy - 8, 'lsd');
    st.arc(x + 1, x + 8, st.gy - 9, 3);
    return x + 9;
  },
  // a hidden extra life
  oneup(st, o) {
    const x = st.x; st.floor(x, x + 4);
    st.block(x + 2, st.gy - 4, 'oneup', T.HIDDEN);
    return x + 5;
  },
  // invincibility in a block over a crowd of enemies
  star(st, o) {
    const x = st.x, n = 12; st.floor(x, x + n - 1);
    st.block(x + 2, st.gy - 4, 'star');
    for (let i = 0; i < 3; i++) st.enemy(st.pickEnemy(), x + 5 + i * 2, st.gy);
    return x + n;
  },
  // a bonus room behind a door on a perch
  bonus(st, o) {
    const { B, ctx } = st;
    st.floor(st.x, st.x + 7);
    const h = 3, px = st.x + 3;
    B.fill(px, st.gy - h, px + 1, st.gy - 1, T.HARD);
    const roomIdx = 1 + ctx.areas.length;
    const portal = B.spawn('portal', px, st.gy - h - 1, { kind: 'door', look: 'tourDoor', target: { area: roomIdx, x: 6 * TS + TS / 2, y: 11 * TS } });
    portal.x += TS / 2;
    const room = tourBonusRoom(ctx, roomIdx, o.secret ? ctx.spec.secret : null);
    ctx.areas.push(room.area);
    st.pendingReturn = st.pendingReturn || [];
    st.pendingReturn.push({ room, minX: st.x + 20 });
    return st.x + 8;
  },
  // a secret exit: a bonus room whose far wall hides a second gate
  secret(st, o) { return Tour.pieces.bonus(st, Object.assign({}, o, { secret: true })); },
  // the finale: steps up to a high point, then the goal
  end(st, o) {
    const { B } = st; let x = st.x;
    st.floor(x, x + 3); x += 4;
    const n = clamp(st.gy - 9, 0, 4);
    for (let i = 0; i < n; i++, x++) { st.floor(x, x); B.fill(x, st.gy - 1 - i, x, st.gy - 1, T.HARD); }
    st.floor(x, x); B.fill(x, st.gy - n, x, st.gy - 1, T.HARD); x++;
    st.gold(x - 1, st.gy - n - 5, 'high');
    st.floor(x, x + 16);
    B.spawn('gate', x + 8, st.gy - 1, {});
    st.dress(x + 12, x + 15, 0.3);
    return x + 17;
  },
  // castles end in a boss arena: walls close behind Brady; beat the boss, the far door opens
  arena(st, o) {
    const { B, ctx } = st; const S = ctx.spec;
    let x = st.x;
    st.floor(x, x + 3); x += 4;
    if (st.gy !== st.GY) { st.gy = st.GY; st.floor(x, x + 1); x += 2; }
    const GY = st.gy, arenaX0 = x, arenaW = S.arenaW || 26;
    B.ground(arenaX0, arenaX0 + arenaW - 1, GY);
    const lay = S.arena || 'hall';
    if (Tour.pieces[ctx.C.id + '.arena_' + lay]) Tour.pieces[ctx.C.id + '.arena_' + lay](st, { x0: arenaX0, w: arenaW, GY });
    else for (let q = 0; q < 3; q++) { B.set(arenaX0 + 4 + q, GY - 4, T.SEMI); B.set(arenaX0 + arenaW - 7 + q, GY - 4, T.SEMI); }
    const doorX = arenaX0 + arenaW;
    B.ground(doorX, doorX + 14, GY);
    B.fill(doorX, 1, doorX, GY - 1, T.HARD);
    B.spawn('boss', arenaX0 + arenaW - 7, GY - 1, { world: ctx.w, style: S.boss, arenaX0, arenaX1: doorX, doorX, mid: !!S.mid });
    B.spawn('gate', doorX + 8, GY - 1, {});
    for (let cx = 0; cx < doorX + 15; cx++) if (B.get(cx, 0) === T.EMPTY && S.roof !== false) B.set(cx, 0, T.GROUND);
    return doorX + 15;
  }
});
function B_col(B, x, y0, y1, t) { B.fill(x, y0, x, y1, t); }

// a small bonus room: coins, a power-up block, a postcard; optional hidden secret gate
function tourBonusRoom(ctx, idx, secret) {
  const W = 36, H = 14, O = 5;
  const B = new AreaBuilder(W, H);
  const th = ctx.spec.bonusTheme || ctx.C.bonusTheme || caveVariant(ctx.theme);
  B.themeKey = th;
  B.fill(0, 0, W - 1, 1, T.GROUND);
  B.fill(0, 0, 1, H - 1, T.GROUND); B.fill(W - 2, 0, W - 1, H - 1, T.GROUND);
  B.ground(0, W - 1, 11);
  for (let r = 0; r < 3; r++) B.picksRow(O + 4 + r, W - O - 6 - r, 6 + r * 2);
  const lx = W - O - 9;
  B.fill(lx, 7, lx + 3, 7, T.SEMI);
  B.set(O + 8, 7, T.QBLOCK); B.item(O + 8, 7, 'power');
  B.set(O + 12, 7, T.QBRICK); B.item(O + 12, 7, 'picks');
  const ret = B.spawn('portal', W - O - 3, 10, { kind: 'door', look: 'tourDoor', target: null });
  if (secret) {
    // the far wall is fake: behind it, the secret exit
    B.fill(W - 2, 9, W - 1, 10, T.FAKE);
  }
  const area = B.build({ theme: th, music: ctx.spec.bonusMusic || 'secret', water: false, dark: false, autoscroll: 0, bonus: true, gravity: 1, goldX: (lx + 2) * TS + TS / 2, goldY: 6 * TS, entryX: (O + 3) * TS + TS / 2, tour: true });
  if (secret) {
    const W2 = W + 14;
    const ext = (arr, fillFn) => { const nt = new Uint8Array(W2 * H); for (let y = 0; y < H; y++) for (let x = 0; x < W2; x++) nt[y * W2 + x] = x < W ? arr[y * W + x] : fillFn(x, y); return nt; };
    area.tiles = ext(area.tiles, (x, y) => (y < 2 || y >= 11 || x >= W2 - 2 ? T.GROUND : T.EMPTY));
    area.hide = ext(area.hide, () => 0); area.surf = ext(area.surf, () => 0);
    area.W = W2;
    area.spawns.push({ type: 'gate', x: (W + 6) * TS, y: 11 * TS, secret: true, secretWorld: secret.to });
    area.spawns.push({ type: 'sign', x: (W + 1) * TS + TS / 2, y: 11 * TS, text: 'A secret exit! Somewhere on the map, a new place appears.' });
  }
  return { area, ret, idx };
}
