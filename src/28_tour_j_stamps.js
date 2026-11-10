/* ============================================================
   World tour: stamps (LEVEL_OVERHAUL.md §7.3). A stamp is a hand-
   authored ASCII room or set piece: rows of characters read with a
   fixed global legend plus the stamp's own letters. The 'room' gen
   builds a whole area from one; the 'stamp' piece drops one into a
   strip with its floor row on the current ground.
   ============================================================ */
const TourStamp = {
  // the global legend: a stamp's own legend may not redefine these
  LEGEND: {
    '.': 'empty', '#': 'ground', 'B': 'brick', 'Q': 'coinbrick', 'H': 'hard', '-': 'semi', '|': 'pillar', '^': 'spikes',
    'v': 'ceilspikes', 'L': 'liquid', 'W': 'water', 'I': 'ice', '<': 'convL', '>': 'convR', 'C': 'crumble', 'F': 'fake',
    'S': 'soil', 'T': 'lintel', 'b': 'bounce', 'y': 'sticky', 'o': 'coin', '*': 'postcard', '?': 'item', 'h': 'hidden',
    's': 'spring', 'c': 'checkpoint', '@': 'anchor', 'G': 'gate', 'g': 'secretGate', 'D': 'door'
  },
  TILE: { empty: 'EMPTY', ground: 'GROUND', brick: 'BRICK', coinbrick: 'QBRICK', hard: 'HARD', semi: 'SEMI', pillar: 'PILLAR', spikes: 'SPIKES',
    ceilspikes: 'SPIKES_CEIL', liquid: 'LAVA', water: 'WATER', ice: 'ICE', convL: 'CONV_L', convR: 'CONV_R', crumble: 'CRUMBLE', fake: 'FAKE',
    soil: 'SOIL', lintel: 'LINTEL', bounce: 'GROUND', sticky: 'GROUND' },
  CUSTOM: ['spawn', 'enemy', 'decor', 'anchor', 'tile', 'piece', 'gear', 'key', 'lock', 'vkey'],
  // look a stamp up by name: the country's own first ('<cc>.<name>'), then a shared one; objects pass through
  get(name, cc) {
    if (name && typeof name === 'object') return name;
    return (cc && Tour.stamps[cc + '.' + name]) || Tour.stamps[name] || null;
  },
  /* parse(stamp) -> { W, H, floor, grid: [[ch...]], problems: [] }: checks the rows and the legend */
  parse(stamp) {
    const rows = stamp.rows || [], H = rows.length, W = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const problems = [];
    const legend = stamp.legend || {};
    for (const ch in legend) {
      if (this.LEGEND[ch]) problems.push(`stamp letter '${ch}' redefines the global legend (${this.LEGEND[ch]})`);
      const e = legend[ch]; if (!Array.isArray(e) || this.CUSTOM.indexOf(e[0]) < 0) problems.push(`stamp letter '${ch}': unknown entry ${JSON.stringify(e)}`);
    }
    rows.forEach((r, y) => { if (r.length !== W) problems.push(`row ${y} is ${r.length} wide, not ${W}`); });
    const grid = rows.map(r => r.padEnd(W, '.').split(''));
    let qs = 0, hs = 0, ds = 0;
    grid.forEach(r => r.forEach(ch => {
      if (ch === '?') qs++; else if (ch === 'h') hs++; else if (ch === 'D') ds++;
      else if (!this.LEGEND[ch] && !legend[ch] && !(stamp.gold && stamp.gold[ch])) problems.push(`unknown stamp letter '${ch}'`);
    }));
    if (ds > (stamp.doors || []).length) problems.push(`${ds} doors 'D' but ${(stamp.doors || []).length} entries in doors[]`);
    const floor = stamp.floor != null ? stamp.floor : H - 1;
    return { W, H, floor, grid, problems: [...new Set(problems)], items: qs, hidden: hs, doors: ds };
  },
  /* place(st, stamp, x0, y0, opts): draw the stamp with its top-left cell at (x0, y0) in the builder.
     opts: { areaIndex, first (the level's first area: '@' is 'start'), clear (default true: '.' empties the cell) }
     Returns { anchors, problems }. Doors get a targetRef the level builder resolves once every area exists. */
  place(st, stamp, x0, y0, opts) {
    opts = opts || {};
    const B = st.B, P = this.parse(stamp), legend = stamp.legend || {}, ctx = st.ctx;
    const items = stamp.items || [], hidden = stamp.hidden || [], doors = stamp.doors || [];
    let qi = 0, hi = 0, di = 0;
    const lockRuns = {};
    const anchors = {};
    const later = [];
    for (let y = 0; y < P.H; y++) for (let x = 0; x < P.W; x++) {
      const ch = P.grid[y][x], tx = x0 + x, ty = y0 + y, kind = this.LEGEND[ch];
      if (kind) {
        const tn = this.TILE[kind];
        if (tn) { if (tn !== 'EMPTY' || opts.clear !== false) B.set(tx, ty, T[tn]); if (kind === 'bounce') B.setSurf(tx, ty, SURF.BOUNCE); if (kind === 'sticky') B.setSurf(tx, ty, SURF.STICKY); if (kind === 'coinbrick') B.item(tx, ty, 'picks'); continue; }
        if (opts.clear !== false) B.set(tx, ty, T.EMPTY);
        switch (kind) {
          case 'coin': B.set(tx, ty, T.PICK); break;
          case 'postcard': B.gold(tx, ty, (stamp.gold && stamp.gold['*']) || 'hidden'); break;
          case 'item': B.set(tx, ty, T.QBLOCK); B.item(tx, ty, items[qi++] || 'pick'); break;
          case 'hidden': B.set(tx, ty, T.HIDDEN); B.item(tx, ty, hidden[hi++] || 'pick'); break;
          case 'spring': B.spawn('spring', tx, ty, {}); B.springs.push([tx, ty]); break;
          case 'checkpoint': later.push(() => B.spawn('checkpoint', tx, ty)); break;
          case 'anchor': { const nm = opts.first ? 'start' : 'in'; anchors[nm] = B.anchor(nm, tx, ty); if (opts.first) anchors.in = B.anchor('in', tx, ty); break; }
          case 'gate': later.push(() => B.spawn('gate', tx, ty, { exit: 'main' })); break;
          case 'secretGate': later.push(() => B.spawn('gate', tx, ty, { exit: 'secret', secret: true })); break;
          case 'door': { const D = doors[di++] || {}; later.push(() => { const s = B.spawn('portal', tx, ty, { kind: 'door', look: D.look || 'tourDoor', targetRef: D.to || null }); s.x += 0; }); break; }
        }
        continue;
      }
      if (stamp.gold && stamp.gold[ch] && !legend[ch]) { if (opts.clear !== false) B.set(tx, ty, T.EMPTY); B.gold(tx, ty, stamp.gold[ch]); continue; }
      const e = legend[ch];
      if (!e) continue;
      if (opts.clear !== false && e[0] !== 'tile' && e[0] !== 'lock') B.set(tx, ty, T.EMPTY);
      switch (e[0]) {
        case 'spawn': later.push(() => B.spawn(e[1], tx, ty, Object.assign({}, e[2] || {}))); break;
        case 'enemy': later.push(() => { const place = (Tour.enemyInfo[e[1]] && Tour.enemyInfo[e[1]].place) || 'walk'; B.spawn(e[1], tx, ty, Object.assign(place === 'walk' ? { dir: -1 } : {}, e[2] || {})); }); break;
        case 'decor': B.decorAt(e[1], tx, ty + 1, (tx * 7 + ty) % 97); break;
        case 'anchor': anchors[e[1]] = B.anchor(e[1], tx, ty); break;
        case 'tile': { const tv = typeof e[1] === 'string' ? T[e[1]] : e[1]; B.set(tx, ty, tv); const o = e[2] || {}; if (o.surf) B.setSurf(tx, ty, typeof o.surf === 'string' ? SURF[o.surf.toUpperCase()] : o.surf); if (o.hide) B.setHide(tx, ty, o.hide); break; }
        case 'piece': later.push(() => { const sx = st.x, sg = st.gy; st.x = tx; st.gy = ty + 1; st.run([e[1], Object.assign({}, e[2] || {})]); st.x = sx; st.gy = sg; }); break;
        case 'gear': later.push(() => { if (Tour.pieces.gearStand) { const sx = st.x, sg = st.gy; st.x = tx; st.gy = ty + 1; Tour.pieces.gearStand(st, { item: e[1], here: true }); st.x = sx; st.gy = sg; } else B.spawn('gearStand', tx, ty, { item: e[1] }); }); break;
        case 'key': later.push(() => B.spawn('key', tx, ty, { id: e[1] })); break;
        case 'lock': { const k = e[1] + '@' + tx; const run = lockRuns[k]; if (run && run.y1 === ty - 1) run.y1 = ty; else lockRuns[k] = { id: e[1], x: tx, y0: ty, y1: ty }; break; }
        case 'vkey': B.vkey(e[1], [[tx, ty]]); break;
      }
    }
    for (const k in lockRuns) { const r = lockRuns[k]; B.lock(r.x, r.y0, r.y1, r.id, 'door'); }
    for (const f of later) f();
    if (ctx && ctx.problems) for (const pr of P.problems) ctx.problems.push(`stamp ${stamp.id || ''}: ${pr}`);
    return { anchors, problems: P.problems, W: P.W, H: P.H };
  }
};

/* the 'stamp' piece: { id, at: 'ground' | rowNumber } (layered gens also take lane) */
Tour.pieces.stamp = function (st, o) {
  const S = TourStamp.get(o.id, st.ctx.C && st.ctx.C.id);
  if (!S) { if (st.ctx.problems) st.ctx.problems.push(`unknown stamp '${o.id}'`); return Tour.pieces.flat(st, {}); }
  const P = TourStamp.parse(S);
  const floorRow = o.at == null || o.at === 'ground' ? st.gy : o.at;
  const y0 = floorRow - P.floor, x0 = st.x;
  // solid ground under the stamp first (unless it sits in the sky), then the stamp over it
  if (!st.sky && o.under !== false) st.floor(x0, x0 + P.W - 1, floorRow + 1 <= st.B.H - 1 ? floorRow : floorRow);
  TourStamp.place(st, S, x0, y0, { first: false });
  return x0 + P.W;
};
try { Object.assign(window.BRADY_TOUR, { TourStamp, TourPanel, TourPanelFx, TourLandscape }); } catch (e) { /* not in a browser */ }
