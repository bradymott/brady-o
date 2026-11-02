/* ============================================================
   Chunk library: the set pieces levels are built from.
   Each chunk takes the strip state `st` (x, gy, B, ctx, rng, d,
   floor()) and returns the next free column.
   Reach: Brady jumps ~4 tiles high and ~5 across at a walk.
   ============================================================ */
const CH = {
  /* ---------------- basics ---------------- */
  flat(st) {
    const { B, ctx, rng } = st; const L = rng.int(5, 10);
    st.floor(st.x, st.x + L - 1);
    if (rng.chance(0.5)) B.picksRow(st.x + 1, st.x + Math.min(L - 2, 5), st.gy - 3);
    placeEnemiesOnFlat(ctx, B, st.x, st.x + L - 1, st.gy, rng.chance(0.4 + st.d * 0.4) ? 1 : 0);
    addDecor(ctx, B, st.x, st.x + L - 1, st.gy, 0.2);
    return st.x + L;
  },
  gap(st) {
    const { B, ctx, rng, R } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    let w = rng.int(2, 2 + Math.round(st.d * 2.2));
    if (R.wind) w = Math.min(w, 3);
    let ngy = clamp(st.gy + rng.int(-1, 2), st.gyMin, st.gyMax);
    if (ngy < st.gy) w = Math.min(w, 3);
    if (rng.chance(0.6)) B.picksArc(x - 1, x + w, Math.min(st.gy, ngy) - 3, 2);
    if (R.liquid && !st.sky) for (let xx = x; xx < x + w; xx++) B.fill(xx, Math.max(st.gy, ngy) + 1, xx, B.H - 1, T.LAVA);
    if (st.d > 0.35 && w >= 3 && rng.chance(0.3)) B.gold(x + Math.floor(w / 2), Math.min(st.gy, ngy) - 1, 'risky');
    x += w;
    st.gy = ngy;
    st.floor(x, x + 2);
    return x + 3;
  },
  stairs(st) {
    const { B, ctx, rng } = st;
    const n = rng.int(3, 4 + Math.round(st.d));
    const gap = !st.sky && rng.chance(0.5 + st.d * 0.3) ? rng.int(1, 2 + Math.round(st.d)) : 0;
    const top = rng.int(1, 2);
    const total = n + top + gap + top + n + 2;
    st.floor(st.x, st.x + total);
    let x = st.x + 1;
    for (let i = 0; i < n; i++, x++) B.fill(x, st.gy - 1 - i, x, st.gy - 1, T.HARD);
    for (let i = 0; i < top; i++, x++) B.fill(x, st.gy - n, x, st.gy - 1, T.HARD);
    if (gap) { for (let i = 0; i < gap; i++, x++) B.clearCol(x, st.gy, B.H - 1); B.picksArc(x - gap - 1, x, st.gy - n - 2, 2); }
    for (let i = 0; i < top; i++, x++) B.fill(x, st.gy - n, x, st.gy - 1, T.HARD);
    for (let i = n - 1; i >= 0; i--, x++) B.fill(x, st.gy - 1 - i, x, st.gy - 1, T.HARD);
    B.gold(st.x + n + top, st.gy - n - 5, 'high');
    return st.x + total + 1;
  },
  blocks(st) {
    const { B, ctx, rng } = st;
    const L = rng.int(10, 14);
    st.floor(st.x, st.x + L - 1);
    const pats = ['B?B?B', '???', 'BB?BB', '?B?', 'B?B', 'BBBBB', '?', 'B??B'];
    const pat = rng.pick(pats);
    const bx = st.x + 2 + rng.int(0, Math.max(0, L - pat.length - 4));
    const by = st.gy - 4;
    let hasQ = false;
    for (let k = 0; k < pat.length; k++) {
      const c = pat[k];
      if (c === '?') { B.set(bx + k, by, T.QBLOCK); B.item(bx + k, by, blockContent(ctx, B)); hasQ = true; }
      else if (rng.chance(0.12)) { B.set(bx + k, by, T.QBRICK); B.item(bx + k, by, rng.chance(0.7) ? 'picks' : (ctx.powerLeft-- > 0 ? 'power' : 'pick')); }
      else B.set(bx + k, by, T.BRICK);
    }
    if (!hasQ && rng.chance(0.5)) { B.set(bx, by, T.QBLOCK); B.item(bx, by, blockContent(ctx, B)); }
    if (rng.chance(0.45) && pat.length >= 3) {
      const ux = bx + 1, uy = by - 4, ulen = Math.min(pat.length, rng.int(2, 4));
      for (let k = 0; k < ulen; k++) { if (rng.chance(0.4)) { B.set(ux + k, uy, T.QBLOCK); B.item(ux + k, uy, blockContent(ctx, B)); } else B.set(ux + k, uy, T.BRICK); }
      B.picksRow(ux, ux + ulen - 1, uy - 2);
      B.gold(ux + ulen, uy - 2, 'high');
    } else B.picksRow(bx, bx + pat.length - 1, by - 2);
    const nSp = B.spawns.length;
    placeEnemiesOnFlat(ctx, B, st.x, st.x + L - 1, st.gy, rng.int(0, 1 + Math.round(st.d)));
    if (st.opening) { B.spawns.length = nSp; spawnEnemy(ctx, B, ctx.pool[0][0], st.x + L - 1, st.gy); }
    addDecor(ctx, B, st.x, st.x + L - 1, st.gy, 0.15);
    return st.x + L;
  },
  pillars(st) {
    const { B, ctx, rng } = st;
    const n = rng.int(1, 3);
    let x = st.x;
    st.floor(x, x + 1); x += 2;
    for (let k = 0; k < n; k++) {
      const h = rng.int(2, 4);
      if (st.d > 0.2 && rng.chance(0.4)) {
        const g1 = rng.int(1, 2), g2 = rng.int(1, 2);
        x += g1;
        B.fill(x, st.gy - h, x + 1, st.sky ? st.gy + 2 : B.H - 1, T.PILLAR);
        x += 2 + g2;
        st.floor(x, x + 2); x += 3;
      } else {
        st.floor(x, x + 1);
        B.fill(x, st.gy - h, x + 1, st.gy - 1, T.PILLAR);
        x += 2;
        const sp = rng.int(3, 5);
        st.floor(x, x + sp - 1);
        placeEnemiesOnFlat(ctx, B, x, x + sp - 1, st.gy, rng.chance(0.5) ? 1 : 0);
        x += sp;
      }
    }
    return x;
  },
  enemies(st) {
    const { B, ctx, rng } = st;
    const L = rng.int(9, 14);
    st.floor(st.x, st.x + L - 1);
    placeEnemiesOnFlat(ctx, B, st.x, st.x + L - 1, st.gy, rng.int(2, 2 + Math.round(st.d * 2)));
    if (rng.chance(0.5)) { const bx = st.x + rng.int(2, L - 4); B.set(bx, st.gy - 4, T.QBLOCK); B.item(bx, st.gy - 4, blockContent(ctx, B)); }
    addDecor(ctx, B, st.x, st.x + L - 1, st.gy, 0.15);
    return st.x + L;
  },
  step(st) {
    const { B, ctx, rng } = st;
    let ngy = st.gy + (rng.chance(0.5) ? -rng.int(1, 3) : rng.int(1, 3));
    ngy = clamp(ngy, st.gyMin, st.gyMax);
    st.floor(st.x, st.x + 2);
    st.gy = ngy;
    const L = rng.int(4, 8);
    st.floor(st.x + 3, st.x + 3 + L - 1);
    addDecor(ctx, B, st.x + 3, st.x + 3 + L - 1, st.gy, 0.2);
    if (rng.chance(0.4)) placeEnemiesOnFlat(ctx, B, st.x + 3, st.x + 3 + L - 1, st.gy, 1);
    return st.x + 3 + L;
  },
  floating(st) {
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const span = rng.int(7, 10 + Math.round(st.d * 6));
    const end = x + span;
    let py = st.gy, firstGold = true;
    while (x < end - 3) {
      const g = rng.int(2, 3), w = rng.int(2, 4);
      py = clamp(py + rng.int(-2, 1), st.gy - 4, st.gy);
      x += g;
      if (rng.chance(0.35) && !st.sky) B.fill(x, py, x + w - 1, B.H - 1, T.GROUND);
      else for (let k = 0; k < w; k++) B.set(x + k, py, T.SEMI);
      if (rng.chance(0.5)) B.picksRow(x, x + w - 1, py - 2);
      if (firstGold && py < st.gy - 2) { B.gold(x + 1, py - 4, 'high'); firstGold = false; }
      if (w >= 3 && rng.chance(0.3)) spawnEnemy(ctx, B, pickEnemy(ctx, ['influencer', 'poet']), x + 1, py);
      x += w;
    }
    x += 2;
    st.gy = clamp(py + rng.int(0, 1), st.gyMin, st.gyMax);
    if (py - st.gy > 0) st.gy = py;
    st.floor(x, x + 3);
    return x + 4;
  },
  spring(st, o) {
    const { B, ctx, rng } = st;
    const h = rng.int(6, 7);
    st.floor(st.x, st.x + 9);
    B.spawn('spring', st.x + 2, st.gy - 1, { skin: o.skin || st.R.springSkin }); B.springs.push([st.x + 2, st.gy - 1]);
    const wx = st.x + 4;
    B.fill(wx, st.gy - h, wx + 1, st.gy - 1, T.HARD);
    B.picksRow(wx - 1, wx + 2, st.gy - h - 3);
    B.gold(wx + 1, st.gy - h - 6, 'high');
    return st.x + 10;
  },
  hidden(st) {
    const { B, ctx } = st;
    const L = 7;
    st.floor(st.x, st.x + L - 1);
    const hx = st.x + 3;
    B.set(hx, st.gy - 4, T.HIDDEN); B.item(hx, st.gy - 4, ctx.rng.chance(0.4) ? 'oneup' : 'picks');
    B.decorAt('flower', hx - 2, st.gy);
    // LSD shows a secret ledge above the hidden block
    if (ctx.rng.chance(0.5)) { B.tripSemi(hx - 1, hx + 1, st.gy - 7); B.picksRow(hx - 1, hx + 1, st.gy - 9); }
    return st.x + L;
  },
  spikes(st) {
    const { B, ctx, rng } = st;
    const w = rng.int(3, 3 + Math.round(st.d * 2));
    st.floor(st.x, st.x + w + 5);
    const sx = st.x + 3;
    for (let k = 0; k < w; k++) B.set(sx + k, st.gy - 1, T.SPIKES);
    if (w > 3 || rng.chance(0.5)) { for (let k = 0; k < Math.min(w, 3); k++) B.set(sx + Math.floor((w - 3) / 2) + k, st.gy - 5, T.SEMI); B.picksRow(sx, sx + w - 1, st.gy - 3); }
    return st.x + w + 6;
  },
  alcove(st) { return chunkFakeAlcove(st, null); },
  conveyor(st) {
    const { B, ctx, rng } = st;
    let x = st.x;
    st.floor(x, x + 1); x += 2;
    const n = rng.int(2, 3);
    for (let k = 0; k < n; k++) {
      const L = rng.int(4, 7), dirT = rng.chance(0.7) ? T.CONV_L : T.CONV_R;
      st.floor(x, x + L - 1);
      for (let q = 0; q < L; q++) B.set(x + q, st.gy, dirT);
      if (rng.chance(0.4)) placeEnemiesOnFlat(ctx, B, x, x + L - 1, st.gy, 1);
      x += L;
      if (k < n - 1) x += rng.int(1, 2);
    }
    st.floor(x, x + 2);
    return x + 3;
  },
  moving(st, o) {
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const skin = o.skin || st.R.moveSkin;
    if (o.vertical || (o.vertical !== false && rng.chance(0.35))) {
      const hgt = rng.int(5, 7), w = 3;
      B.spawn('mplat', x, st.gy - 1, { pw: 3, ax: 0, ay: -hgt * TS, speed: 1.8 + st.d, skin });
      for (let k = 0; k <= hgt; k++) for (let q = 0; q < w; q++) B.ghosts.push([x - 1 + q, st.gy - k]);
      if (!st.sky) for (let q = -1; q <= 1; q++) B.clearCol(x + q, st.gy, st.gy); // the lift sits in a slot
      if (!st.sky) for (let q = -1; q <= 1; q++) B.fill(x + q, st.gy + 1, x + q, B.H - 1, T.GROUND);
      x += w + 1;
      const top = st.gy - hgt;
      if (st.sky) B.fill(x, top, x + 5, top + 2, T.GROUND); else B.fill(x, top, x + 5, B.H - 1, T.GROUND);
      B.picksRow(x + 1, x + 4, top - 2);
      B.gold(x + 3, top - 5, 'high');
      x += 6;
      st.floor(x, x + 3);
      return x + 4;
    }
    const gw = rng.int(7, 10);
    const py = st.gy;
    B.spawn('mplat', x, py - 1, { pw: 3, ax: (gw - 3) * TS, ay: 0, speed: 1.6 + st.d * 1.2, skin });
    for (let k = -1; k < gw + 1; k++) B.ghosts.push([x + k, py]);
    B.picksRow(x + 2, x + gw - 3, py - 3);
    x += gw;
    st.floor(x, x + 3);
    return x + 4;
  },
  falling(st, o) {
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 4;
    const n = rng.int(2, 4);
    let py = st.gy;
    for (let k = 0; k < n; k++) {
      py = clamp(py + rng.int(-1, 1), st.gy - 3, st.gy);
      B.spawn('fplat', x, py - 1, { pw: 2, skin: o.skin || st.R.fallSkin });
      B.ghosts.push([x - 1, py], [x, py]);
      B.picksRow(x - 1, x, py - 2);
      x += rng.int(3, 4);
    }
    st.gy = clamp(py, st.gy - 3, st.gyMax);
    st.floor(x, x + 3);
    return x + 4;
  },
  crumble(st) {
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    const w = rng.int(5, 8), x = st.x + 3;
    for (let k = 0; k < w; k++) B.set(x + k, st.gy, T.CRUMBLE);
    B.picksRow(x, x + w - 1, st.gy - 2);
    st.floor(x + w, x + w + 2);
    return x + w + 3;
  },
  hammock(st) {
    const { B } = st;
    st.floor(st.x, st.x + 8);
    B.spawns.push({ type: 'hammock', x: (st.x + 4) * TS + TS / 2, y: st.gy * TS });
    return st.x + 9;
  },
  gifter(st, o) {
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 8);
    const give = o.give || (ctx.R.gifts ? rng.pick(ctx.R.gifts) : rng.pick(['coffee', 'joint', 'bufo']));
    B.spawn('gifter', st.x + 4, st.gy - 1, { give, look: o.look || ctx.R.gifterLook || 'kandi' });
    B.picksRow(st.x + 1, st.x + 7, st.gy - 4);
    addDecor(ctx, B, st.x, st.x + 8, st.gy, 0.25);
    return st.x + 9;
  },
  liquidpit(st) {
    // a wide pit full of the land's liquid (coffee, chai, mud, ink) with stepping stones
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(2, 3);
    for (let k = 0; k < n; k++) {
      const w = rng.int(2, 3);
      for (let q = 0; q < w; q++) B.fill(x + q, st.gy + 1, x + q, B.H - 1, T.LAVA);
      x += w;
      if (k < n - 1) { const sw = 2, sy = st.gy - rng.int(0, 1); B.fill(x, sy, x + sw - 1, B.H - 1, T.HARD); B.picksRow(x, x + sw - 1, sy - 2); x += sw; }
    }
    st.floor(x, x + 2);
    return x + 3;
  },

  /* ---------------- Gate Road ---------------- */
  rvpark(st) {
    // parked, idling RVs: hop the roofs and awnings
    const { B, ctx, rng } = st;
    const n = rng.int(1, 3);
    let x = st.x;
    st.floor(x, x + 1); x += 2;
    for (let k = 0; k < n; k++) {
      const L = rng.int(6, 8), h = rng.int(2, 3);
      st.floor(x, x + L + 2);
      B.prop('rv', x, st.gy - h, L, h, 'body', { look: rng.int(0, 3) });
      if (rng.chance(0.55)) { for (let q = 1; q <= 2; q++) { B.set(x + L - 1 + q, st.gy - h + 1, T.SEMI); B.setHide(x + L - 1 + q, st.gy - h + 1, 1); } B.prop('awning', x + L, st.gy - h + 1, 2, h - 1, 'none'); }
      B.picksRow(x + 1, x + L - 2, st.gy - h - 2);
      if (rng.chance(0.4)) spawnEnemy(ctx, B, pickEnemy(ctx, ['influencer', 'poet', 'witch']), x + 2, st.gy - h, { edgeTurn: true });
      if (k === 0 && rng.chance(0.5)) B.gold(x + Math.floor(L / 2), st.gy - h - 4, 'high');
      x += L + 3;
      if (rng.chance(0.5)) placeEnemiesOnFlat(ctx, B, x - 3, x - 1, st.gy, 1);
    }
    return x;
  },
  convoy(st) {
    // the convoy crawls forward and brakes: RV roofs inch across a washed-out road
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const two = st.d > 0.1 && rng.chance(0.5);
    const gw = two ? rng.int(16, 19) : rng.int(9, 12);
    const py = st.gy - rng.int(1, 2);
    const rvs = two ? 2 : 1;
    for (let k = 0; k < rvs; k++) {
      const pw = rng.int(4, 5);
      const seg = Math.floor(gw / rvs), sx = x + k * seg;
      const range = Math.max(1, seg - pw);
      B.spawn('mplat', sx, py - 1, { pw, ax: range * TS, ay: 0, speed: 1.3 + st.d * 0.9, skin: 'rv', phase: rng() * 6 });
      for (let q = -1; q < seg + 1; q++) B.ghosts.push([sx + q, py]);
      B.picksRow(sx + 1, sx + seg - 2, py - 3);
      if (rng.chance(0.35)) spawnEnemy(ctx, B, pickEnemy(ctx, ['influencer', 'poet', 'witch', 'creeper']), sx + 1, py, { edgeTurn: true, onPlat: true });
    }
    if (rng.chance(0.4)) B.gold(x + Math.floor(gw / 2), py - 5, 'risky');
    x += gw;
    st.floor(x, x + 3);
    return x + 4;
  },
  flagline(st) {
    // a line of dusty flag poles over the ruts
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(3, 4);
    let top = st.gy;
    for (let k = 0; k < n; k++) {
      x += rng.int(1, 2);
      top = clamp(top + rng.int(-2, 1), st.gy - 4, st.gy - 1);
      B.prop('flagpole', x, top, 2, B.H - top, 'body', { flag: k });
      B.picksRow(x, x + 1, top - 2);
      if (k === n - 1 && rng.chance(0.5)) B.gold(x, top - 4, 'high');
      x += 2;
    }
    x += rng.int(1, 2);
    st.floor(x, x + 2);
    return x + 3;
  },
  tumbleweeds(st, o) {
    const { B, ctx, rng } = st;
    const L = rng.int(12, 16);
    st.floor(st.x, st.x + L - 1);
    B.spawn('roller', st.x + L - 1, st.gy - 1, { kind: o.kind || 'tumbleweed', period: 3.4 - st.d * 1.2, dir: -1 });
    B.picksArc(st.x + 2, st.x + L - 3, st.gy - 2, 2);
    if (rng.chance(0.5)) { for (let q = 0; q < 3; q++) B.set(st.x + 5 + q, st.gy - 4, T.SEMI); }
    addDecor(ctx, B, st.x, st.x + L - 1, st.gy, 0.15);
    return st.x + L;
  },
  horns(st) {
    // a traffic jam of honking RVs: horn blasts shove Brady back
    const { B, ctx, rng } = st;
    let x = st.x;
    st.floor(x, x + 4); x += 5;
    const n = rng.int(2, 3);
    for (let k = 0; k < n; k++) {
      const L = rng.int(5, 7), h = rng.int(2, 3);
      st.floor(x, x + L + 4);
      B.prop('rv', x, st.gy - h, L, h, 'body', { look: rng.int(0, 3), honk: true });
      B.spawn('horn', x, st.gy - 1, { dir: -1, period: 2.6 + rng() * 1.2, phase: rng() * 2, len: 6 });
      B.picksRow(x, x + L - 1, st.gy - h - 2);
      if (rng.chance(0.5)) placeEnemiesOnFlat(ctx, B, x + L, x + L + 3, st.gy, 1);
      x += L + 4;
    }
    return x;
  },
  bells(st) {
    // greeter bells on posts: ring them (by bumping) for glow sticks; greeters patrol below
    const { B, ctx, rng } = st;
    const L = rng.int(11, 14);
    st.floor(st.x, st.x + L - 1);
    for (let k = 0; k < 2; k++) { const bx = st.x + 3 + k * 5; B.set(bx, st.gy - 4, T.QBRICK); B.item(bx, st.gy - 4, 'picks'); B.prop('bellpost', bx, st.gy - 3, 1, 3, 'none'); }
    placeEnemiesOnFlat(ctx, B, st.x, st.x + L - 1, st.gy, 1 + Math.round(st.d * 2));
    return st.x + L;
  },

  /* ---------------- Center Camp ---------------- */
  queue(st) {
    // the coffee line: hop along the heads of the people waiting, over a spill of hot coffee
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(3, 5);
    const x0 = x;
    for (let k = 0; k < n; k++) {
      const px = x + k * 3;
      B.prop('queuer', px, st.gy - 2, 2, 2, 'none', { look: rng.int(0, 5) });
      for (let q = 0; q < 2; q++) { B.set(px + q, st.gy - 2, T.SEMI); B.setHide(px + q, st.gy - 2, 1); }
      B.pickAt(px + 1, st.gy - 4);
    }
    const x1 = x0 + n * 3 - 1;
    st.floor(x0 - 1, x1 + 1);
    for (let xx = x0 - 1; xx <= x1; xx++) B.set(xx, st.gy, T.LAVA);
    if (rng.chance(0.5)) B.gold(x0 + Math.floor(n * 1.5), st.gy - 6, 'high');
    x = x1 + 2;
    st.floor(x, x + 3);
    if (rng.chance(0.6)) spawnEnemy(ctx, B, ctx.pool.some(e => e[0] === 'camplead') ? 'camplead' : pickEnemy(ctx), x + 2, st.gy);
    return x + 4;
  },
  cuplift(st) { return CH.moving(st, { vertical: true, skin: 'cup' }); },
  espresso(st) { return CH.spring(st, { skin: 'steam' }); },
  trapeze(st) {
    // trapeze bars swing over a safety net (bounce) or an open pit
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(1, 2);
    const span = n * 7 + 1;
    const net = st.R.net !== false && rng.chance(0.6);
    if (net && !st.sky) for (let q = 0; q < span; q++) { B.fill(x + q, st.gy + 3, x + q, B.H - 1, T.GROUND); B.setSurf(x + q, st.gy + 3, SURF.BOUNCE); }
    for (let k = 0; k < n; k++) {
      const ax = x + 3 + k * 7, ay = st.gy - 6, len = 5;
      B.spawn('mplat', ax, ay, { pw: 3, swing: { len: len * TS, amp: 0.55 }, speed: 1.1 + st.d * 0.4, skin: 'trapeze', phase: k * 1.3 });
      for (let a = -10; a <= 10; a++) { const th = a / 10 * 0.55; const gx = Math.round(ax + Math.sin(th) * len), gy2 = Math.round(ay + 1 + Math.cos(th) * len); for (let q = -1; q <= 1; q++) B.ghosts.push([gx + q, gy2]); }
      B.picksArc(ax - 2, ax + 2, ay + len - 2, 1);
    }
    if (rng.chance(0.5)) B.gold(x + Math.floor(span / 2), st.gy - 7, 'risky');
    x += span;
    st.floor(x, x + 2);
    return x + 3;
  },
  canvas(st) {
    // a stretch of big-top canvas: bounce high to the upper rigging
    const { B, ctx, rng } = st;
    const L = rng.int(8, 11);
    st.floor(st.x, st.x + L + 2);
    for (let q = 1; q < L; q++) B.setSurf(st.x + q, st.gy, SURF.BOUNCE);
    B.prop('canvas', st.x + 1, st.gy - 1, L - 1, 1, 'none');
    const ry = st.gy - 7, rx = st.x + 2 + rng.int(0, 3);
    for (let q = 0; q < 4; q++) B.set(rx + q, ry, T.SEMI);
    B.picksRow(rx, rx + 3, ry - 2);
    B.gold(rx + 2, ry - 4, 'high');
    if (rng.chance(0.4)) spawnEnemy(ctx, B, 'witch' === pickEnemy(ctx) ? 'witch' : pickEnemy(ctx, ['influencer', 'poet']), rx + 1, ry, { edgeTurn: true });
    return st.x + L + 3;
  },
  ringoffire(st) {
    // the circus fire act: a ring of fire poi spins around a pedestal
    const { B, ctx, rng } = st;
    const L = 12;
    st.floor(st.x, st.x + L - 1);
    const cx = st.x + 6;
    B.fill(cx, st.gy - 3, cx, st.gy - 1, T.HARD);
    B.spawn('poiring', cx, st.gy - 4, { arms: 2, len: rng.int(3, 4), speed: (rng.chance(0.5) ? 1 : -1) * (1.5 + st.d) });
    B.picksRow(st.x + 1, st.x + 3, st.gy - 2); B.picksRow(st.x + 9, st.x + 11, st.gy - 2);
    return st.x + L;
  },
  micstand(st) {
    // the open mic: poets on pedestals fire verse across the room
    const { B, ctx, rng } = st;
    const L = rng.int(10, 13);
    st.floor(st.x, st.x + L - 1);
    const px = st.x + L - 4, h = rng.int(2, 3);
    B.prop('stagebox', px, st.gy - h, 3, h, 'body');
    B.spawn('poet', px + 1, st.gy - h - 1, {});
    B.picksRow(st.x + 1, px - 2, st.gy - 3);
    if (rng.chance(0.5)) B.gold(px + 1, st.gy - h - 5, 'high');
    placeEnemiesOnFlat(ctx, B, st.x, px - 2, st.gy, rng.chance(0.5) ? 1 : 0, ['poet']);
    return st.x + L;
  },
  acro(st) {
    // acro-yoga bases lift their flyers: ride the flyers' backs (they tilt you off if you dawdle)
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(2, 3);
    for (let k = 0; k < n; k++) {
      x += rng.int(1, 2);
      const h = rng.int(2, 3);
      const base = st.gy - rng.int(0, 1);
      B.spawn('mplat', x, base - 1, { pw: 3, ax: 0, ay: -h * TS, speed: 1.1 + st.d * 0.6, skin: 'acro', tilt: true, phase: k * 0.9 });
      for (let k2 = 0; k2 <= h; k2++) for (let q = -1; q <= 1; q++) B.ghosts.push([x + q, base - k2]);
      B.picksCol(x, base - h - 3, base - h - 2);
      x += 3;
    }
    x += 1;
    st.floor(x, x + 2);
    return x + 3;
  },

  /* ---------------- The Esplanade ---------------- */
  beatpads(st, o) {
    // dance-floor platforms that light up (and hold you) on the beat
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(3, 5);
    let py = st.gy;
    for (let k = 0; k < n; k++) {
      const w = rng.int(2, 3);
      x += rng.int(1, 2);
      py = clamp(py + rng.int(-1, 1), st.gy - 2, st.gy);
      B.beat(x, x + w - 1, py, k % 2, o.kind || st.R.beatKind || 'beat');
      B.picksRow(x, x + w - 1, py - 2);
      x += w;
    }
    x += 1;
    st.floor(x, x + 2);
    return x + 3;
  },
  subwoofer(st) {
    // a speaker stack sends bass shockwaves along the ground on the beat
    const { B, ctx, rng } = st;
    const L = rng.int(12, 15);
    st.floor(st.x, st.x + L - 1);
    const sx = st.x + L - 3;
    B.prop('speakerstack', sx, st.gy - 3, 2, 3, 'body');
    B.spawn('subwoofer', sx, st.gy - 1, { every: 2, dir: -1 });
    B.picksRow(sx, sx + 1, st.gy - 5);
    for (let q = 0; q < 3; q++) B.set(st.x + 3 + q, st.gy - 3, T.SEMI);
    B.picksRow(st.x + 3, st.x + 5, st.gy - 5);
    placeEnemiesOnFlat(ctx, B, st.x, sx - 2, st.gy, rng.chance(0.5) ? 1 : 0);
    return st.x + L;
  },
  lasergate(st) {
    const { B, ctx, rng } = st;
    const n = rng.int(2, 4);
    const L = n * 4 + 4;
    st.floor(st.x, st.x + L - 1);
    for (let k = 0; k < n; k++) { const lx = st.x + 3 + k * 4; B.spawn('laser', lx, st.gy - 1, { h: 5, grp: k % 2, every: 2 }); B.prop('truss', lx, st.gy - 6, 1, 1, 'none'); }
    B.picksRow(st.x + 2, st.x + L - 3, st.gy - 2);
    return st.x + L;
  },
  lasersweep(st) {
    const { B, ctx, rng } = st;
    const L = rng.int(12, 14);
    st.floor(st.x, st.x + L - 1);
    const cx = st.x + Math.floor(L / 2);
    B.fill(cx, st.gy - 2, cx, st.gy - 1, T.HARD);
    B.spawn('sweeper', cx, st.gy - 3, { len: 5, speed: (rng.chance(0.5) ? 1 : -1) * (1.0 + st.d * 0.6) });
    for (let q = -1; q <= 1; q++) B.set(cx + q, st.gy - 6, T.SEMI);
    B.picksRow(cx - 1, cx + 1, st.gy - 8);
    return st.x + L;
  },
  cones(st) {
    // speaker cones: bouncy membranes over the bass pit
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(2, 3);
    for (let k = 0; k < n; k++) {
      x += rng.int(1, 2);
      const cy = st.gy + 1;
      B.fill(x, cy, x + 2, B.H - 1, T.GROUND);
      for (let q = 0; q < 3; q++) B.setSurf(x + q, cy, SURF.BOUNCE);
      B.prop('cone', x, cy - 1, 3, 1, 'none');
      B.picksCol(x + 1, cy - 7, cy - 5);
      x += 3;
    }
    const ty = st.gy - 4;
    x += 1;
    if (st.cave) st.floor(x, x + 3); else st.floor(x, x + 3, st.gy);
    B.gold(x - 3, ty - 3, 'high');
    return x + 4;
  },
  porttube(st) {
    // a bass port tube: a gust of air carries Brady up to a high ledge
    const { B, ctx, rng } = st;
    const L = 12;
    st.floor(st.x, st.x + L - 1);
    const tx = st.x + 5, top = st.gy - 8;
    B.zone(tx, top - 1, 2, st.gy - top + 1, 0, -150 * TS, 7 * TS, st.R.ventKind || 'port');
    B.spawn('vent', tx, st.gy - 1, { look: st.R.ventKind || 'port', w: 2 });
    for (let q = 0; q < 3; q++) { B.set(tx - 3 + q, top, T.SEMI); B.set(tx + 2 + q, top, T.SEMI); }
    B.picksCol(tx, top + 1, st.gy - 3); B.picksCol(tx + 1, top + 1, st.gy - 3);
    B.gold(tx + 3, top - 2, 'high');
    return st.x + L;
  },

  /* ---------------- Theme Camp Row ---------------- */
  griddle(st) {
    // a giant breakfast griddle: pancakes flip and fling Brady skyward
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    const x = st.x + 3, L = rng.int(9, 12);
    st.floor(x, x + L);
    for (let q = 0; q < L; q++) B.set(x + q, st.gy, T.LAVA);
    B.prop('griddle', x, st.gy, L, 1, 'none');
    const n = Math.floor((L - 1) / 3);
    for (let k = 0; k < n; k++) {
      const px = x + 1 + k * 3;
      B.spawn('pancake', px, st.gy - 1, { period: 2.6 + rng() * 0.8, phase: k * 0.85 });
      B.springs.push([px, st.gy - 1], [px + 1, st.gy - 1]);
    }
    const hy = st.gy - 8;
    for (let q = 0; q < 4; q++) B.set(x + 2 + q, hy, T.SEMI);
    B.picksRow(x + 2, x + 5, hy - 2);
    B.gold(x + 4, hy - 4, 'high');
    st.floor(x + L, x + L + 2);
    return x + L + 3;
  },
  syrup(st) {
    const { B, ctx, rng } = st;
    const L = rng.int(8, 11);
    st.floor(st.x, st.x + L - 1);
    for (let q = 1; q < L - 1; q++) B.setSurf(st.x + q, st.gy, SURF.STICKY);
    B.prop('syrup', st.x + 1, st.gy, L - 2, 1, 'none');
    placeEnemiesOnFlat(ctx, B, st.x, st.x + L - 1, st.gy, 1);
    B.picksRow(st.x + 2, st.x + L - 3, st.gy - 3);
    return st.x + L;
  },
  butter(st) {
    const { B, ctx, rng } = st;
    const L = rng.int(8, 12);
    st.floor(st.x, st.x + L - 1);
    for (let k = 0; k < L; k++) B.set(st.x + k, st.gy, T.ICE);
    const g = rng.int(2, 3), gx = st.x + L;
    B.picksArc(gx - 1, gx + g, st.gy - 3, 2);
    st.floor(gx + g, gx + g + 3);
    return gx + g + 4;
  },
  crystals(st) {
    const { B, ctx, rng } = st;
    const L = rng.int(10, 14);
    st.floor(st.x, st.x + L - 1);
    let x = st.x + 2;
    while (x < st.x + L - 3) { const w = rng.int(1, 2); for (let q = 0; q < w; q++) B.set(x + q, st.gy - 1, T.SPIKES); x += w + rng.int(2, 3); }
    for (let q = 0; q < 3; q++) B.set(st.x + 4 + q, st.gy - 4, T.SEMI);
    B.picksRow(st.x + 4, st.x + 6, st.gy - 6);
    if (ctx.pool.some(e => e[0] === 'witch')) B.spawn('witch', st.x + L - 3, st.gy - 6);
    return st.x + L;
  },
  stones(st) {
    // standing stones over a misty gap
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(2, 4);
    let top = st.gy;
    for (let k = 0; k < n; k++) {
      x += rng.int(1, 2);
      top = clamp(top + rng.int(-2, 1), st.gy - 4, st.gy - 1);
      B.prop('stone', x, top, 2, B.H - top, 'body', { rune: k });
      B.picksRow(x, x + 1, top - 2);
      x += 2;
    }
    x += rng.int(1, 2);
    st.floor(x, x + 2);
    return x + 3;
  },
  couches(st) {
    // curbside couches: bouncy cushions up to the old art
    const { B, ctx, rng } = st;
    const L = rng.int(12, 15);
    st.floor(st.x, st.x + L - 1);
    const cx = st.x + 2;
    B.prop('couch2', cx, st.gy - 1, 3, 1, 'top');
    for (let q = 0; q < 3; q++) B.setSurf(cx + q, st.gy - 1, SURF.BOUNCE);
    const ax = st.x + 7, ah = rng.int(4, 6);
    B.prop('oldart', ax, st.gy - ah, 3, ah, 'body', { year: 98 });
    B.picksRow(ax, ax + 2, st.gy - ah - 2);
    B.gold(ax + 1, st.gy - ah - 4, 'high');
    placeEnemiesOnFlat(ctx, B, ax + 3, st.x + L - 1, st.gy, 1);
    return st.x + L;
  },
  bubbles(st) {
    // a bubble machine on a camp tower: ride the giant bubbles up before they pop
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const base = st.gy;
    const bx = x + 1;
    B.prop('bubbler', bx - 1, base - 1, 3, 1, 'body');
    B.spawn('bubbler', bx, base - 2, { period: 1.6, rise: 8 });
    const rise = 8;
    for (let k = 0; k <= rise; k++) for (let q = 0; q < 2; q++) B.ghosts.push([bx + q, base - 2 - k]);
    x = bx + 4;
    const ty = base - 2 - rise + 2;
    if (st.sky) B.fill(x, ty, x + 5, ty + 2, T.GROUND); else B.prop('camptower', x, ty, 4, B.H - ty, 'body', { flags: true });
    B.picksRow(x, x + 3, ty - 2);
    B.gold(x + 2, ty - 4, 'high');
    x += st.sky ? 6 : 4;
    st.floor(x, x + 2);
    return x + 3;
  },
  rant(st) {
    // a crusty on his porch: rants float up as big slow speech bubbles
    const { B, ctx, rng } = st;
    const L = rng.int(11, 14);
    st.floor(st.x, st.x + L - 1);
    const px = st.x + L - 5;
    B.prop('porch', px, st.gy - 2, 4, 2, 'body');
    B.spawn('crusty', px + 2, st.gy - 3, { perch: true });
    B.picksRow(px, px + 3, st.gy - 4);
    placeEnemiesOnFlat(ctx, B, st.x, px - 2, st.gy, 1);
    return st.x + L;
  },
  camptower(st) {
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const h = rng.int(3, 5);
    B.prop('camptower', x, st.gy - h, 3, B.H - st.gy + h, 'body', { flags: true });
    B.picksRow(x, x + 2, st.gy - h - 2);
    x += 3 + rng.int(1, 2);
    st.floor(x, x + 2);
    return x + 3;
  },

  /* ---------------- Hot Springs ---------------- */
  van(st) {
    const { B, ctx, rng } = st;
    const L = 12;
    st.floor(st.x, st.x + L - 1);
    const vx = st.x + 4;
    B.prop('van', vx, st.gy - 3, 5, 3, 'body');
    B.spawn('vent', vx + 4, st.gy - 4, { look: 'steam', w: 1 });
    B.picksRow(vx, vx + 4, st.gy - 5);
    B.gold(vx + 2, st.gy - 7, 'high');
    placeEnemiesOnFlat(ctx, B, st.x, vx - 1, st.gy, 1);
    return st.x + L;
  },
  geyser(st) {
    // geysers erupt on a timer: stand on the vent and ride the blast
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(1, 2);
    for (let k = 0; k < n; k++) {
      x += rng.int(1, 2);
      st.floor(x, x + 3);
      B.spawn('geyser', x + 1, st.gy - 1, { period: 2.8 + rng() * 1.2, phase: rng() * 2 });
      B.springs.push([x + 1, st.gy - 1], [x + 2, st.gy - 1]);
      const hy = st.gy - 8;
      for (let q = 0; q < 3; q++) B.set(x + 4 + q, hy, T.SEMI);
      B.picksRow(x + 4, x + 6, hy - 2);
      if (k === 0) B.gold(x + 5, hy - 3, 'high');
      x += 4;
      // a scalding pool between geysers
      for (let q = 0; q < 2; q++) B.fill(x + q, st.gy + 1, x + q, B.H - 1, T.LAVA);
      x += 2;
    }
    st.floor(x, x + 2);
    return x + 3;
  },
  terrace(st) {
    // mineral terraces: warm shallow pools stepping uphill
    const { B, ctx, rng } = st;
    let x = st.x;
    st.floor(x, x + 1); x += 2;
    const n = rng.int(2, 3);
    for (let k = 0; k < n; k++) {
      const w = rng.int(4, 5);
      st.floor(x, x + w);
      for (let q = 1; q < w; q++) { B.set(x + q, st.gy, T.WATER); B.set(x + q, st.gy + 1, T.GROUND); }
      B.set(x, st.gy - 1, T.HARD); B.set(x + w, st.gy - 1, T.HARD);
      B.picksRow(x + 1, x + w - 1, st.gy - 2);
      x += w + 1;
      st.gy = clamp(st.gy - 1, st.gyMin, st.gyMax);
    }
    st.floor(x, x + 2);
    return x + 3;
  },
  steamvent(st) { const R0 = st.R.ventKind; st.R.ventKind = 'steam'; const x = CH.porttube(st); st.R.ventKind = R0; return x; },
  mudslope(st) {
    // a slick mud slope: steps of slippery mud downhill, a boulder rolls behind
    const { B, ctx, rng } = st;
    const n = rng.int(3, 5);
    let x = st.x;
    st.floor(x, x + 1); x += 2;
    const up = st.gy > st.gyMin + n && rng.chance(0.4);
    for (let k = 0; k < n; k++) {
      st.gy = clamp(st.gy + (up ? -1 : 1), st.gyMin, st.gyMax);
      st.floor(x, x + 2);
      for (let q = 0; q < 3; q++) B.set(x + q, st.gy, T.ICE);
      x += 3;
    }
    st.floor(x, x + 2);
    if (!up && rng.chance(0.6)) B.spawn('roller', x + 1, st.gy - 1, { kind: 'boulder', period: 4 - st.d, dir: -1, delay: 1.2 });
    B.picksArc(st.x + 2, x, st.gy - 3, 1);
    return x + 3;
  },
  boulders(st) { return CH.tumbleweeds(st, { kind: 'boulder' }); },

  /* ---------------- Deep Playa ---------------- */
  sculpture(st, o) {
    // a giant art sculpture to climb: ledges hidden in its shape
    const { B, ctx, rng } = st;
    const kind = o.kind || rng.pick(['hand', 'whale', 'head', 'flower', 'octa']);
    st.floor(st.x, st.x + 2);
    const x = st.x + 3, W = 9;
    st.floor(x, x + W + 2);
    const gy = st.gy;
    const ledges = { hand: [[0, 3, 3], [4, 6, 3], [1, 9, 2], [6, 9, 2]], whale: [[0, 3, 2], [2, 6, 3], [5, 8, 3], [3, 10, 3]], head: [[0, 3, 3], [5, 3, 3], [2, 7, 5]], flower: [[3, 3, 3], [0, 6, 3], [5, 7, 3], [3, 10, 3]], octa: [[1, 3, 2], [5, 4, 3], [2, 7, 3], [4, 10, 2]] }[kind];
    let topY = gy;
    for (const [lx, ly, lw] of ledges) { for (let q = 0; q < lw; q++) { B.set(x + lx + q, gy - ly, T.SEMI); B.setHide(x + lx + q, gy - ly, 1); } topY = Math.min(topY, gy - ly); B.picksRow(x + lx, x + lx + lw - 1, gy - ly - 2); }
    B.prop('sculpture', x, gy - 11, W, 11, 'none', { form: kind });
    B.gold(x + ledges[ledges.length - 1][0] + 1, topY - 3, 'high');
    placeEnemiesOnFlat(ctx, B, x, x + W, gy, rng.chance(0.5) ? 1 : 0, ['witch']);
    return x + W + 3;
  },
  jellies(st) {
    // LED jellyfish drift in the dark: bounce off their bells
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(2, 4);
    let py = st.gy;
    for (let k = 0; k < n; k++) {
      x += rng.int(2, 3);
      py = clamp(py + rng.int(-2, 1), st.gy - 3, st.gy + 1);
      B.spawn('jellypad', x, py - 1, { bob: 0.4 + rng() * 0.3, phase: rng() * 6 });
      B.springs.push([x, py - 1]);
      B.picksCol(x, py - 6, py - 4);
      if (k === n - 1) B.gold(x, py - 8, 'risky');
      x += 1;
    }
    x += 2;
    st.gy = clamp(py, st.gyMin, st.gyMax);
    st.floor(x, x + 3);
    return x + 4;
  },
  photoop(st) {
    // an influencer's ring-light set: the flash dazes, the ponies pounce
    const { B, ctx, rng } = st;
    const L = rng.int(12, 15);
    st.floor(st.x, st.x + L - 1);
    const sx = st.x + L - 5;
    B.prop('ringlight', sx, st.gy - 2, 3, 2, 'top');
    B.spawn('influencer', sx + 1, st.gy - 3, {});
    B.picksRow(st.x + 2, sx - 2, st.gy - 3);
    if (ctx.pool.some(e => e[0] === 'pony')) B.spawn('pony', st.x + 3, st.gy - 1, { dir: 1 });
    return st.x + L;
  },
  devils(st) {
    // dust devils: whirlwinds that carry Brady up and over
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const w = rng.int(5, 7);
    const top = st.gy - 7;
    B.zone(x + 1, top, 2, st.gy - top + 3, 0, -150 * TS, 6.5 * TS, 'devil');
    B.spawn('devilzone', x + 1, st.gy - 1, { h: st.gy - top });
    x += w;
    for (let q = 0; q < 3; q++) B.set(x - 2 + q, top + 1, T.SEMI);
    B.picksArc(x - 4, x + 2, top - 1, 2);
    B.gold(x - 1, top - 2, 'high');
    st.floor(x + 2, x + 4);
    return x + 5;
  },
  glowpath(st) {
    // in the whiteout only the glow sticks show the way across the ruts
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 1);
    let x = st.x + 2;
    const n = rng.int(3, 4);
    for (let k = 0; k < n; k++) {
      const g = rng.int(2, 3);
      B.picksArc(x, x + g, st.gy - 2, 2);
      x += g;
      const w = rng.int(2, 4);
      st.floor(x, x + w - 1);
      x += w;
    }
    return x;
  },

  /* ---------------- Hell Station ---------------- */
  barrels(st) {
    // leaky fuel barrels: touch one and it blows a few seconds later
    const { B, ctx, rng } = st;
    const L = rng.int(12, 15);
    st.floor(st.x, st.x + L - 1);
    const n = rng.int(2, 3);
    for (let k = 0; k < n; k++) B.spawn('barrel', st.x + 3 + k * 4, st.gy - 1, {});
    B.prop('fueltank', st.x + L - 4, st.gy - 3, 3, 3, 'body');
    B.picksRow(st.x + L - 4, st.x + L - 2, st.gy - 5);
    placeEnemiesOnFlat(ctx, B, st.x, st.x + L - 5, st.gy, 1);
    return st.x + L;
  },
  fueltank(st) {
    const { B, ctx, rng } = st;
    const L = 12;
    st.floor(st.x, st.x + L - 1);
    const tx = st.x + 4;
    B.prop('fueltank', tx, st.gy - 3, 4, 3, 'body');
    B.spawn('bolt', tx + 2, st.gy - 4, { period: 2.6 + rng() * 1.2, phase: rng() * 2 });
    B.picksRow(st.x + 1, st.x + 3, st.gy - 2); B.picksRow(tx + 5, st.x + L - 2, st.gy - 2);
    return st.x + L;
  },
  forklift(st) { return CH.moving(st, { vertical: true, skin: 'forklift' }); },
  crane(st) {
    // a crane hook swings its load across the yard: ride the pallet
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    const x = st.x + 3, gw = rng.int(9, 12), py = st.gy - 1;
    B.spawn('mplat', x, py - 1, { pw: 3, ax: (gw - 3) * TS, ay: 0, speed: 1.4 + st.d, skin: 'hook' });
    for (let k = -1; k < gw + 1; k++) B.ghosts.push([x + k, py]);
    for (let q = 0; q < gw; q++) B.fill(x + q, st.gy + 1, x + q, B.H - 1, T.SPIKES);
    for (let q = 0; q < gw; q++) B.fill(x + q, st.gy + 2, x + q, B.H - 1, T.GROUND);
    B.picksRow(x + 2, x + gw - 3, py - 3);
    st.floor(x + gw, x + gw + 3);
    return x + gw + 4;
  },
  rebar(st) {
    // scaffolding planks over a bed of rebar
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const L = rng.int(9, 13);
    for (let q = 0; q < L; q++) B.set(x + q, st.gy - 1, T.SPIKES);
    st.floor(x, x + L - 1);
    let py = st.gy - 3;
    let px = x;
    while (px < x + L - 1) {
      const w = rng.int(2, 3);
      for (let q = 0; q < w && px + q < x + L; q++) B.set(px + q, py, T.SEMI);
      B.picksRow(px, px + w - 1, py - 2);
      px += w + rng.int(1, 2);
      py = clamp(py + rng.int(-1, 1), st.gy - 4, st.gy - 3);
    }
    B.prop('scaffold', x, st.gy - 5, L, 4, 'none');
    x += L;
    st.floor(x, x + 2);
    return x + 3;
  },
  windtunnel(st) {
    // the trash fence funnels a howling wind: push through, grab the flying MOOP
    const { B, ctx, rng } = st;
    const L = rng.int(14, 18);
    st.floor(st.x, st.x + L - 1);
    const dir = rng.chance(0.65) ? -1 : 1;
    B.zone(st.x + 1, st.gy - 6, L - 2, 6, dir * (2.6 + st.d * 1.4) * TS, 0, 0, 'wind', { dir });
    B.spawn('moop', st.x + (dir < 0 ? L - 2 : 1), st.gy - 3, { dir, w: L, period: 1.6 });
    B.prop('fence', st.x, st.gy - 3, L, 3, 'none');
    let x = st.x + 3;
    while (x < st.x + L - 3) { if (rng.chance(0.5)) { B.fill(x, st.gy - 1, x, st.gy - 1, T.HARD); } x += rng.int(3, 4); }
    B.picksRow(st.x + 2, st.x + L - 3, st.gy - 3);
    return st.x + L;
  },
  chasebay(st) {
    // raised loading docks to hop onto when a tech bro comes rushing through
    const { B, ctx, rng } = st;
    let x = st.x;
    const n = rng.int(2, 3);
    st.floor(x, x + 1); x += 2;
    for (let k = 0; k < n; k++) {
      const w = rng.int(3, 4), h = rng.int(2, 3);
      st.floor(x, x + w + 3);
      B.prop('dock', x, st.gy - h, w, h, 'body');
      B.picksRow(x, x + w - 1, st.gy - h - 2);
      x += w + rng.int(3, 4);
    }
    return x;
  },

  /* ---------------- The Man Base ---------------- */
  flamealley(st) {
    // a row of flame cannons fire in a rolling wave: run in the gap behind it
    const { B, ctx, rng } = st;
    const n = rng.int(3, 5);
    const L = n * 3 + 4;
    st.floor(st.x, st.x + L - 1);
    const period = 3.4 - st.d * 0.6;
    for (let k = 0; k < n; k++) B.spawn('bolt', st.x + 2 + k * 3, st.gy - 1, { period, phase: period - k * 0.45 });
    B.picksRow(st.x + 1, st.x + L - 2, st.gy - 2);
    return st.x + L;
  },
  poiring(st) {
    const { B, ctx, rng } = st;
    const L = 13;
    st.floor(st.x, st.x + L - 1);
    const cx = st.x + 6, cy = st.gy - 4;
    B.set(cx, cy, T.USED);
    B.spawn('poiring', cx, cy, { arms: rng.int(2, 3), len: rng.int(3, 4), speed: (rng.chance(0.5) ? 1 : -1) * (1.4 + st.d * 0.8) });
    for (let q = -1; q <= 1; q++) B.set(cx + q, st.gy - 8, T.SEMI);
    B.picksRow(cx - 1, cx + 1, st.gy - 10);
    if (rng.chance(0.5)) B.gold(cx, st.gy - 11, 'risky');
    return st.x + L;
  },
  neonflash(st) {
    // a neon flash trap: when the sign counts down, duck behind the plywood
    const { B, ctx, rng } = st;
    const L = rng.int(14, 17);
    st.floor(st.x, st.x + L - 1);
    const fx = st.x + L - 2;
    B.spawn('flashtrap', fx, st.gy - 5, { period: 4.2 - st.d * 0.8, phase: rng() * 2, range: L + 2 });
    for (let cx = st.x + 2; cx < fx - 2; cx += rng.int(4, 5)) { B.fill(cx, st.gy - 2, cx, st.gy - 1, T.HARD); B.prop('coverwall', cx, st.gy - 2, 1, 2, 'none'); }
    B.picksRow(st.x + 1, fx - 2, st.gy - 4);
    return st.x + L;
  },

  /* ---------------- Sunrise Set ---------------- */
  crumbleline(st) {
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(3, 4);
    let py = st.gy;
    for (let k = 0; k < n; k++) {
      const w = rng.int(2, 3);
      x += rng.int(1, 2);
      py = clamp(py + rng.int(-1, 1), st.gy - 2, st.gy);
      for (let q = 0; q < w; q++) B.set(x + q, py, T.CRUMBLE);
      B.picksRow(x, x + w - 1, py - 2);
      x += w;
    }
    x += 1;
    st.floor(x, x + 2);
    return x + 3;
  },
  thermal(st) {
    // a warm thermal over a long gap: ride it up and glide across on the tailwind
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const gw = rng.int(9, 12);
    const top = st.gy - 7;
    B.zone(x, top, 3, st.gy - top + 4, 0, -150 * TS, 6 * TS, 'thermal');
    B.zone(x + 3, top - 2, gw - 3, st.gy - top, 3.0 * TS, -70 * TS, 0, 'tailwind', { dir: 1 });
    B.spawn('vent', x + 1, st.gy + 2, { look: 'thermal', w: 3, sky: true });
    B.picksArc(x + 1, x + gw - 2, top - 1, 2);
    if (rng.chance(0.6)) B.gold(x + Math.floor(gw / 2), top - 3, 'risky');
    x += gw;
    st.floor(x, x + 3);
    return x + 4;
  },

  /* ---------------- World 22 ---------------- */
  pages(st) { return CH.beatpads(st, { kind: 'page' }); },
  textline(st) {
    // a line of text slides back and forth like a typewriter carriage
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const gw = rng.int(9, 12), py = st.gy - rng.int(0, 2);
    B.spawn('mplat', x, py - 1, { pw: 4, ax: (gw - 4) * TS, ay: 0, speed: 1.5 + st.d, skin: 'text', phase: rng() * 4 });
    for (let k = -1; k < gw + 1; k++) B.ghosts.push([x + k, py]);
    B.picksRow(x + 2, x + gw - 3, py - 3);
    x += gw;
    st.floor(x, x + 3);
    return x + 4;
  },
  inkpool(st) { return CH.liquidpit(st); },
  wordstair(st) {
    // words hang in the air as one-way ledges
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(3, 4);
    let py = st.gy;
    for (let k = 0; k < n; k++) {
      const w = rng.int(3, 4);
      x += rng.int(1, 2);
      py = clamp(py + rng.int(-3, -1), st.gy - 7, st.gy);
      for (let q = 0; q < w; q++) { B.set(x + q, py, T.SEMI); B.setHide(x + q, py, 1); }
      B.prop('word', x, py, w, 1, 'none', { text: rng.pick(['ONCE', 'UPON', 'A', 'TIME', 'THE', 'END?', 'PAGE', 'INK', 'TURN']) });
      B.picksRow(x, x + w - 1, py - 2);
      x += w;
    }
    B.gold(x - 2, py - 3, 'high');
    // drop back down to the floor
    st.floor(x + 1, x + 4);
    return x + 5;
  },

  /* ---------------- extras ---------------- */
  lamps(st) {
    // a dark stretch of camp: touch the lamp posts to light them (and keep them lit)
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const n = rng.int(2, 3);
    for (let k = 0; k < n; k++) {
      const L = rng.int(4, 6);
      st.floor(x, x + L - 1);
      B.spawn('lamp', x + 1, st.gy - 1, {});
      B.picksRow(x + 2, x + L - 1, st.gy - 3);
      x += L;
      const g = rng.int(2, 3);
      if (k < n - 1) { for (let q = 0; q < g; q++) B.set(x + q, st.gy - rng.int(1, 3), T.SEMI); x += g; }
    }
    st.floor(x, x + 2);
    return x + 3;
  },
  artcars(st) {
    // night art cars cruise the deep playa; their hydraulics bounce the decks
    const { B, ctx, rng } = st;
    st.floor(st.x, st.x + 2);
    let x = st.x + 3;
    const gw = rng.int(10, 13);
    const py = st.gy - rng.int(1, 2);
    const pw = rng.int(4, 5);
    const hop = rng.chance(0.5) ? 1 : 0;
    B.spawn('mplat', x, py - 1, { pw, ax: (gw - pw) * TS, ay: -hop * TS, speed: 1.4 + st.d * 0.8, skin: 'artcar', design: rng.int(0, 4), phase: rng() * 6 });
    for (let q = -1; q < gw + 1; q++) for (let k = 0; k <= hop; k++) B.ghosts.push([x + q, py - k]);
    B.picksRow(x + 1, x + gw - 2, py - 3 - hop);
    if (rng.chance(0.3)) spawnEnemy(ctx, B, pickEnemy(ctx, ['witch', 'influencer', 'poet']), x + 1, py, { edgeTurn: true, onPlat: true });
    if (rng.chance(0.35)) B.gold(x + Math.floor(gw / 2), py - 6, 'risky');
    x += gw;
    st.floor(x, x + 3);
    return x + 4;
  },
  cargo(st) { return CH.falling(st, { skin: 'cargo' }); },
  /* ---------------- secret exits ---------------- */
  secretKey(st) {
    // a key hidden behind a fake wall, and a locked hut with the secret gate further on
    const { B, ctx, rng } = st;
    let x = st.x;
    st.floor(x, x + 2);
    const px = x + 3, top = st.gy - 3;
    B.ground(px, px + 9, top);
    for (let xx = px; xx < px + 5; xx++) for (let y = st.gy - 2; y <= st.gy - 1; y++) B.set(xx, y, T.FAKE);
    B.spawn('key', px + 3, st.gy - 1, { id: 'secret' });
    B.picksRow(px + 1, px + 8, top - 2);
    x = px + 10;
    st.floor(x, x + 3); x += 4;
    st.floor(x, x + 18);
    B.fill(x + 1, st.gy - 3, x + 2, st.gy - 1, T.HARD);
    const hx = x + 4;
    B.fill(hx, st.gy - 6, hx + 9, st.gy - 6, T.HARD);
    B.fill(hx, st.gy - 5, hx, st.gy - 1, T.HARD);
    B.fill(hx + 9, st.gy - 5, hx + 9, st.gy - 4, T.HARD);
    B.lock(hx + 9, st.gy - 3, st.gy - 1, 'secret', 'vip');
    B.spawn('gate', hx + 5, st.gy - 1, { secret: true, secretWorld: 0 });
    B.prop('hut', hx, st.gy - 6, 10, 6, 'none');
    B.picksRow(hx + 1, hx + 8, st.gy - 8);
    return x + 19;
  },
  secretHigh(st) {
    // a spring to a high road: it runs above the main path to a secret gate
    const { B, ctx, rng } = st;
    const x = st.x;
    st.floor(x, x + 24);
    B.spawn('spring', x + 2, st.gy - 1, {}); B.springs.push([x + 2, st.gy - 1]);
    const hy = Math.max(5, st.gy - 8);
    for (let q = 4; q < 22; q++) B.set(x + q, hy, T.SEMI);
    B.picksRow(x + 5, x + 12, hy - 2);
    B.spawn('gate', x + 17, hy - 1, { secret: true, secretWorld: 0 });
    B.spawn('sign', x + 6, hy - 1, { text: 'The high road. Shhh.' });
    placeEnemiesOnFlat(ctx, B, x + 6, x + 22, st.gy, 1);
    return x + 25;
  },
  secretFake(st) {
    const { B, ctx, rng } = st;
    const x = st.x;
    st.floor(x, x + 2);
    const px = x + 3, top = st.gy - 6;
    B.ground(px, px + 13, top);
    for (let xx = px; xx < px + 12; xx++) for (let y = top + 1; y <= st.gy - 1; y++) B.set(xx, y, T.EMPTY);
    for (let y = top + 1; y <= st.gy - 1; y++) B.set(px, y, T.FAKE);
    st.floor(px, px + 13);
    B.spawn('gate', px + 7, st.gy - 1, { secret: true, secretWorld: 0 });
    B.fill(px + 12, top + 1, px + 13, st.gy - 1, T.GROUND);
    B.picksRow(px + 1, px + 11, top - 2);
    st.floor(px + 14, px + 16);
    return px + 17;
  }
};

// raised plateau whose side is a fake wall hiding an alcove
function chunkFakeAlcove(st, what) {
  const { B, ctx } = st;
  const L = 10;
  st.floor(st.x, st.x + 2);
  const px = st.x + 3, top = st.gy - 3;
  if (st.sky) B.fill(px, top, px + L - 1, st.gy + 2, T.GROUND); else B.ground(px, px + L - 1, top);
  for (let x = px; x < px + 5; x++) for (let y = st.gy - 2; y <= st.gy - 1; y++) B.set(x, y, T.FAKE);
  B.picksRow(px + 1, px + 3, st.gy - 1);
  B.gold(px + 4, st.gy - 2, 'hidden');
  B.picksRow(px + 1, px + L - 2, top - 2);
  st.floor(px + L, px + L + 2);
  return px + L + 3;
}

/* ============================================================
   Haunted puzzle house: a grid of rooms joined by open doorways,
   floor hatches, teleporting doors and fake walls. The exit gate
   sits behind a locked door; the key is somewhere deep inside.
   ============================================================ */
function genHaunt(ctx) {
  const { rng, d, R } = ctx;
  const C = R.cols || 4, RR = R.rows || 3, RW = 15, RH = 9;
  const W = C * RW + 1, fyOf = r => 1 + (r + 1) * RH, H = fyOf(RR - 1) + 2;
  const B = new AreaBuilder(W, H);
  B.themeKey = ctx.theme;
  B.fill(0, 0, W - 1, H - 1, T.GROUND);
  const cell = (c, r) => ({ c, r, x0: c * RW + 1, x1: c * RW + RW - 1, top: fyOf(r) - RH + 1, fy: fyOf(r) });
  for (let c = 0; c < C; c++) for (let r = 0; r < RR; r++) { const k = cell(c, r); B.fill(k.x0, k.top, k.x1, k.fy - 1, T.EMPTY); }
  const key = (c, r) => c + ',' + r;
  // spanning tree from the start room (bottom-left)
  const start = [0, RR - 1];
  const seen = new Set([key(...start)]), depth = { [key(...start)]: 0 }, parent = {};
  const stack = [start], edges = [];
  while (stack.length) {
    const [c, r] = stack[stack.length - 1];
    const nb = [[c + 1, r], [c - 1, r], [c, r - 1], [c, r + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < C && b < RR && !seen.has(key(a, b)));
    if (!nb.length) { stack.pop(); continue; }
    const [a, b] = nb[rng.int(0, nb.length - 1)];
    seen.add(key(a, b)); depth[key(a, b)] = depth[key(c, r)] + 1; parent[key(a, b)] = [c, r];
    edges.push({ a: [c, r], b: [a, b] }); stack.push([a, b]);
  }
  // exit: the deepest room; key: the deepest other room
  const cells = Object.keys(depth).map(k => k.split(',').map(Number));
  cells.sort((p, q) => depth[key(...q)] - depth[key(...p)] || (q[1] === 0) - (p[1] === 0));
  const exitC = cells[0];
  const keyC = cells.find(p => key(...p) !== key(...exitC) && key(...p) !== key(...start)) || cells[1];
  const isExit = p => key(...p) === key(...exitC);
  const used = {};  // per room: which sides carry a doorway
  const mark = (p, side) => { const k = key(...p); (used[k] = used[k] || {})[side] = true; };
  const holes = {};
  const doorSpots = [];
  const carveH = (p, q, how) => {
    const [L, Rt] = p[0] < q[0] ? [p, q] : [q, p];
    const wx = Rt[0] * RW, fy = fyOf(L[1]);
    for (let y = fy - 3; y <= fy - 1; y++) B.set(wx, y, how === 'fake' ? T.FAKE : T.EMPTY);
    mark(L, 'R'); mark(Rt, 'L');
  };
  const carveV = (p, q) => {
    const [U, D] = p[1] < q[1] ? [p, q] : [q, p];
    const k = cell(U[0], U[1]);
    // hatches into the exit room stay on the near side of its locked partition
    const hx = (isExit(U) || isExit(D)) ? k.x0 + 3 : k.x0 + rng.int(3, RW - 9);
    for (let q2 = 0; q2 < 3; q2++) B.set(hx + q2, k.fy, T.EMPTY);
    const lo = cell(D[0], D[1]);
    const p1 = hx >= lo.x0 + 4 ? hx - 3 : hx + 3;
    for (let q2 = 0; q2 < 3; q2++) { B.set(p1 + q2, lo.fy - 3, T.SEMI); B.set(hx + q2, lo.fy - 6, T.SEMI); }
    B.picksCol(hx + 1, k.fy - 2, k.fy - 1);
    holes[key(...U)] = (holes[key(...U)] || []).concat([[hx, hx + 2]]);
    holes[key(...D)] = (holes[key(...D)] || []).concat([[p1, p1 + 2], [hx, hx + 2]]);
    mark(U, 'D'); mark(D, 'U');
  };
  const doorPos = p => {
    const k = cell(...p);
    for (let tries = 0; tries < 30; tries++) {
      const x = k.x0 + rng.int(2, RW - 4);
      const near = (holes[key(...p)] || []).some(([a, b]) => x >= a - 1 && x <= b + 1) || doorSpots.some(s => s.k === key(...p) && Math.abs(s.x - x) < 3);
      if (!near) { doorSpots.push({ k: key(...p), x }); return { x, fy: k.fy }; }
    }
    const x = k.x0 + 2; doorSpots.push({ k: key(...p), x }); return { x, fy: k.fy };
  };
  const doorPair = (p, q, look) => {
    const A = doorPos(p), Bq = doorPos(q);
    B.spawn('portal', A.x, A.fy - 1, { kind: 'door', look: look || R.doorLook || 'door', target: { area: 0, x: Bq.x * TS + TS / 2, y: Bq.fy * TS } });
    B.spawn('portal', Bq.x, Bq.fy - 1, { kind: 'door', look: look || R.doorLook || 'door', target: { area: 0, x: A.x * TS + TS / 2, y: A.fy * TS } });
    mark(p, 'door'); mark(q, 'door');
  };
  for (const e of edges) {
    const horiz = e.a[1] === e.b[1];
    const toExit = key(...e.b) === key(...exitC);
    const r = rng();
    if (horiz) { if (!toExit && r < 0.28) doorPair(e.a, e.b); else carveH(e.a, e.b, 'open'); }
    else { if (!toExit && r < 0.22) doorPair(e.a, e.b); else carveV(e.a, e.b); }
  }
  // loops: fake walls and stray doors (never into the exit room)
  let fakes = 0;
  for (let c = 0; c < C - 1 && fakes < 2; c++) for (let r = 0; r < RR && fakes < 2; r++) {
    const p = [c, r], q = [c + 1, r];
    if (isExit(p) || isExit(q)) continue;
    if ((used[key(...p)] || {}).R) continue;
    if (rng.chance(0.45)) { carveH(p, q, 'fake'); fakes++; }
  }
  const all = cells.filter(p => !isExit(p));
  if (all.length > 3) { const a = all[all.length - 1], b = all[rng.int(0, Math.max(0, all.length - 3))]; if (key(...a) !== key(...b)) doorPair(a, b); }
  // a locked partition with a gate behind it, on a side with no doorway, hatch or door
  const freeSide = p => {
    const k = cell(...p), u = used[key(...p)] || {}, hs = holes[key(...p)] || [], ds = doorSpots.filter(s2 => s2.k === key(...p)).map(s2 => s2.x);
    if (!u.R && !hs.some(([a, b]) => b >= k.x1 - 5) && !ds.some(x => x >= k.x1 - 5)) return 'R';
    if (!u.L && !hs.some(([a, b]) => a <= k.x0 + 5) && !ds.some(x => x <= k.x0 + 5)) return 'L';
    return null;
  };
  const lockRoom = (p, id, gateProps, look) => {
    const k = cell(...p);
    const right = freeSide(p) !== 'L';
    const px = right ? k.x1 - 4 : k.x0 + 4;
    B.fill(px, k.top, px, k.fy - 4, T.HARD);
    B.lock(px, k.fy - 3, k.fy - 1, id, look || R.lockLook || 'door');
    const gx = right ? px + 2 : px - 2;
    B.spawn('gate', gx, k.fy - 1, gateProps);
    used[key(...p)] = Object.assign(used[key(...p)] || {}, right ? { R: true } : { L: true });
    return { px, right };
  };
  lockRoom(exitC, 'exit', {});
  // the key sits on a ledge in the far room
  { const k = cell(...keyC); const kx = k.x0 + 5 + rng.int(0, 3); for (let q = 0; q < 4; q++) B.set(kx + q, k.fy - 4, T.SEMI); B.spawn('key', kx + 1, k.fy - 5, { id: 'exit' }); B.picksRow(kx, kx + 3, k.fy - 7); }
  // photos: a high shelf in a dead end, a fake-walled closet, and one behind a door
  const goldRooms = cells.filter(p => !isExit(p) && key(...p) !== key(...keyC));
  const shelf = goldRooms[0] || keyC;
  { const k = cell(...shelf); const sx = k.x0 + 2; for (let q = 0; q < 3; q++) { B.set(sx + q, k.fy - 3, T.SEMI); B.set(sx + 4 + q, k.fy - 6, T.SEMI); } B.gold(sx + 5, k.fy - 7, 'must'); }
  const closetRoom = goldRooms.find(p => !(used[key(...p)] || {}).R && key(...p) !== key(...shelf)) || goldRooms[1] || shelf;
  { const k = cell(...closetRoom); const wx = k.x1 - 3; if (!(holes[key(...closetRoom)] || []).some(([a, b]) => b >= wx - 1)) { for (let y = k.top; y <= k.fy - 1; y++) B.set(wx, y, T.FAKE); B.gold(k.x1 - 1, k.fy - 2, 'must'); B.picksCol(k.x1 - 2, k.fy - 4, k.fy - 2); } else B.gold(k.x0 + 3, k.fy - 5, 'must'); }
  const doorRoom = goldRooms.find(p => (used[key(...p)] || {}).door && key(...p) !== key(...shelf) && key(...p) !== key(...closetRoom)) || goldRooms[2] || keyC;
  { const k = cell(...doorRoom); B.gold(k.x0 + 7, k.fy - 3, 'must'); }
  // the secret exit (Lost & Found): a second key hidden behind fake walls, a second locked room
  if (secretFor(ctx.id)) {
    const taken = [shelf, closetRoom, doorRoom].map(p => key(...p));
    const sRoom = goldRooms.find(p => taken.indexOf(key(...p)) < 0 && freeSide(p)) || goldRooms.find(p => freeSide(p)) || keyC;
    const kRoom = goldRooms.find(p => key(...p) !== key(...sRoom) && key(...p) !== key(...closetRoom)) || keyC;
    const k = cell(...kRoom);
    // a "cabinet" that is really a fake: the silver key hides inside it
    const kx = k.x0 + 2 + rng.int(0, 2);
    for (let q = 0; q < 3; q++) for (let y = k.fy - 2; y <= k.fy - 1; y++) if (B.get(kx + q, y) === T.EMPTY) B.set(kx + q, y, T.FAKE);
    B.spawn('key', kx + 1, k.fy - 1, { id: 'secret', silver: true });
    lockRoom(sRoom, 'secret', { secret: true, secretWorld: 0 }, 'vip');
  }
  // furnish every room
  for (const p of cells) {
    const k = cell(...p), kk = key(...p);
    const isStart = kk === key(...start);
    const furn = R.furniture || ['crate'];
    const fx = k.x0 + 1 + rng.int(0, 3);
    if (!isExit(p)) B.prop(rng.pick(furn), fx, k.fy - 2, 2, 2, 'none', { seed: rng.int(0, 99) });
    // a mid-height shelf for vertical play
    if (!isStart && rng.chance(0.6)) {
      const sx = k.x0 + rng.int(5, RW - 8);
      const clear = !(holes[kk] || []).some(([a, b]) => sx + 3 >= a - 1 && sx <= b + 1);
      if (clear && [0, 1, 2].every(q => B.get(sx + q, k.fy - 4) === T.EMPTY && B.get(sx + q, k.fy - 8) === T.EMPTY)) {
        if (R.beatKind && rng.chance(0.6)) B.beat(sx, sx + 2, k.fy - 4, rng.int(0, 1), R.beatKind);
        else for (let q = 0; q < 3; q++) B.set(sx + q, k.fy - 4, T.SEMI);
        if (rng.chance(0.5)) { B.set(sx + 1, k.fy - 8, T.QBLOCK); B.item(sx + 1, k.fy - 8, blockContent(ctx, B)); }
        else B.picksRow(sx, sx + 2, k.fy - 6);
      }
    }
    if (!isStart && rng.chance(0.75)) {
      const n = rng.int(1, 1 + Math.round(d * 1.5));
      for (let i = 0; i < n; i++) spawnEnemy(ctx, B, pickEnemy(ctx), k.x0 + rng.int(4, RW - 4), k.fy, { edgeTurn: true, home: true });
    }
    if (R.dropper && !isStart && rng.chance(0.5)) B.spawn('dropper', k.x0 + rng.int(3, RW - 4), k.top, { look: R.dropper, period: 2.4 + rng() * 1.6 });
    if (rng.chance(0.3)) { const hx2 = k.x0 + rng.int(2, RW - 4); if (B.get(hx2, k.fy - 4) === T.EMPTY) { B.set(hx2, k.fy - 4, T.HIDDEN); B.item(hx2, k.fy - 4, 'picks'); } }
  }
  const st0 = cell(...start);
  B.spawn('sign', st0.x0 + 5, st0.fy - 1, { text: R.signText || 'Find the key. Doors lie, walls lie, but glow sticks never lie.' });
  pickGold(ctx, B);
  const area = B.build({ theme: ctx.theme, music: R.music || 'haunt', water: false, dark: R.dark !== false, autoscroll: 0, haunt: true, gravity: 1, beat: R.bpm ? { bpm: R.bpm } : null, strobe: !!R.strobe });
  return { area, start: { area: 0, x: (st0.x0 + 2) * TS + TS / 2, y: st0.fy * TS }, time: 400 };
}

/* ---------- gift camps: a short friendly level, then the gift booth ---------- */
function genGift(ctx) {
  ctx.R = Object.assign({}, ctx.R, { finale: 'gift', len: ctx.R.len || 70, lenD: 0, cp: false, bonus: false });
  return genStrip(ctx, 'side');
}
function chunkFinaleGift(st) {
  const { B, ctx } = st;
  const x = st.x;
  st.floor(x, x + 23);
  B.prop('giftbooth', x + 4, st.gy - 4, 5, 4, 'none', { gift: ctx.R.gift });
  B.spawn('giftbooth', x + 6, st.gy - 1, { gift: ctx.R.gift });
  B.spawn('gate', x + 16, st.gy - 1, {});
  B.picksArc(x + 10, x + 14, st.gy - 3, 2);
  addDecor(ctx, B, x + 19, x + 22, st.gy, 0.4);
  return x + 24;
}

/* ---------- ride the bus: one long art bus carries Brady through the crowd ---------- */
function genCarrier(ctx) {
  const { rng, d, R } = ctx;
  const H = 16, ROOF = 10, len = Math.round((R.len || 150) + d * 20);
  const B = new AreaBuilder(len + 40, H);
  B.themeKey = ctx.theme;
  const speed = R.scroll || 2.6 + d;
  const busW = R.busW || 12;
  // the bus: a long lower deck and a short upper deck that travel together at the scroll speed
  B.spawn('mplat', 1, ROOF - 1, { pw: busW, carrier: true, speed, stopX: (len - busW - 1) * TS, skin: R.busSkin || 'bus' });
  B.spawn('mplat', 4, ROOF - 4, { pw: 5, carrier: true, speed, stopX: (len - busW + 2) * TS, skin: 'busdeck' });
  for (let x = 0; x < len + 2; x++) { B.ghosts.push([x, ROOF]); if (x < len - busW + 8) B.ghosts.push([x, ROOF - 3]); }
  // the crowd below: falling in is the end of the ride
  let x = 20;
  let cp = false;
  while (x < len - 16) {
    const r = rng();
    if (!cp && x > len / 2) { B.spawn('checkpoint', x, ROOF - 1, { onBus: true }); cp = true; x += 6; continue; }
    if (r < 0.32) {
      // a lighting truss overhead: hop up from the top deck for the goodies
      const L = rng.int(5, 8), ty = ROOF - 6;
      for (let q = 0; q < L; q++) B.set(x + q, ty, T.SEMI);
      B.prop('truss', x, ty, L, 1, 'none', { long: true });
      B.picksRow(x, x + L - 1, ty - 2);
      B.gold(x + Math.floor(L / 2), ty - 3, rng.chance(0.5) ? 'high' : 'risky');
      if (rng.chance(0.4)) B.spawn('banner', x + Math.floor(L / 2), ROOF - 2, { len: 2 });
      x += L + rng.int(4, 7);
    } else if (r < 0.5) {
      // a low banner: duck (or jump to the top deck)
      B.spawn('banner', x, ROOF - 2, { len: 3 });
      B.prop('truss', x - 1, ROOF - 6, 3, 1, 'none');
      x += rng.int(6, 9);
    } else if (r < 0.66) {
      // a swinging disco ball
      B.spawn('discoball', x, ROOF - 9, { len: 5, amp: 0.8, speed: 1.6 + d });
      B.picksArc(x - 2, x + 2, ROOF - 5, 1);
      x += rng.int(7, 9);
    } else if (r < 0.82) {
      // crowd surfers get tossed up from the dance floor
      B.spawn('surfer', x, ROOF + 4, { period: 2.2 + rng(), phase: rng() * 2 });
      x += rng.int(6, 8);
    } else {
      // a side stage at deck height: step off and back on
      const L = rng.int(4, 6), sy = ROOF - 3;
      for (let q = 0; q < L; q++) B.set(x + q, sy - 2, T.SEMI);
      B.prop('stage', x, sy - 2, L, 1, 'none');
      B.picksRow(x, x + L - 1, sy - 4);
      if (rng.chance(0.5)) spawnEnemy(ctx, B, pickEnemy(ctx, ['witch']), x + 1, sy - 2, { edgeTurn: true });
      x += L + rng.int(4, 6);
    }
  }
  // the bus stop at the end of the route
  B.fill(len, ROOF, len + 19, H - 1, T.GROUND);
  B.spawn('gate', len + 11, ROOF - 1, {});
  B.gold(len + 4, ROOF - 5, 'high');
  pickGold(ctx, B);
  const area = B.build({ theme: ctx.theme, music: musicFor(ctx), water: false, dark: !!R.dark, autoscroll: speed, beat: R.bpm ? { bpm: R.bpm } : null, carrier: true, gravity: 1, crowdFloor: true });
  return { area, start: { area: 0, x: 6 * TS + TS / 2, y: ROOF * TS }, time: 400 };
}
