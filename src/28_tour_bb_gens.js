/* ============================================================
   World tour: the v2 level builder (LEVEL_OVERHAUL.md §7).
   A v2 level is a list of AREAS, each built by a generator
   (TourGens[gen](ctx, areaSpec) -> { area, anchors }), joined by
   doors whose targets are 'areaId' or 'areaId@anchor'. Postcards
   are chosen across all areas once every area exists.
   ============================================================ */
const TourGens = {};
// pieces that take no room in a strip: no breather floor before them
const TOUR_INLINE = { postcard: true, sync: true, anchor: true, vkey: true };

Object.assign(TourBuild, {
  generateV2(C, spec, w, i, attempt) {
    const id = w + '-' + i;
    const rng = mulberry32(hashStr('tour:' + id + ':' + (attempt || 0)));
    const d = Tour.difficulty(w, i);
    const problems = [];
    const ctx = {
      rng, w, i, id, d, C, spec, R: spec, theme: spec.theme, areas: [], world: WORLDS[w], v2: true, deferGold: true,
      areaBase: spec.areas.length, problems, pool: (spec.enemies || []).map(e => Array.isArray(e) ? e : [e, 1])
    };
    const built = [];
    spec.areas.forEach((A, k) => {
      const role = A.role || (k === 0 ? 'main' : 'sub');
      const S = Object.assign({}, spec, { script: null, style: null }, A);
      // a theme that doesn't exist yet (new art comes later) falls back to the level's own, or its cave look for rooms
      let theme = A.theme || spec.theme;
      if (!THEMES[theme]) { const fb = (role === 'sub' || role === 'secret') && A.gen === 'room' ? caveVariant(spec.theme) : spec.theme; if (A.theme) problems.push(`area ${A.id}: theme ${A.theme} is not defined yet, using ${fb}`); theme = THEMES[fb] ? fb : spec.theme; }
      S.theme = theme;
      const actx = Object.assign({}, ctx, { spec: S, R: S, theme, areaIndex: k, areaRole: role, area: A,
        pool: (A.enemies || spec.enemies || []).map(e => Array.isArray(e) ? e : [e, 1]) });
      const gen = TourGens[A.gen || 'strip'];
      if (!gen) { problems.push(`area ${A.id}: unknown gen '${A.gen}'`); }
      const r = (gen || TourGens.strip)(actx, A);
      const area = r.area;
      area.role = role; area.aid = A.id || ('area' + k); area.gen = A.gen || 'strip';
      if (A.bottomKill) area.bottomKill = true;
      if (A.camera) area.camera = A.camera;
      built.push({ A, area, anchors: Object.assign({}, r.anchors), B: r.B, time: r.time });
    });
    // rooms made by legacy pieces (bonus) come after the spec's areas
    const areas = built.map(b => b.area).concat(ctx.areas);
    ctx.areas.forEach((a, k) => { a.role = a.role || 'secret'; a.aid = a.aid || 'room' + (k + 1); });
    // doors: 'areaId' or 'areaId@anchor' -> { area, x, y }
    const find = ref => {
      const [aid, an] = String(ref).split('@');
      const k = built.findIndex(b => b.A.id === aid);
      if (k < 0) { problems.push(`door target '${ref}': no area '${aid}'`); return null; }
      const a = built[k].anchors, p = (an && a[an]) || a.in || a.start;
      if (an && !a[an]) problems.push(`door target '${ref}': area '${aid}' has no anchor '${an}'`);
      return p ? { area: k, x: p.x, y: p.y } : null;
    };
    for (const a of areas) for (const s of a.spawns) if (s.targetRef) s.target = find(s.targetRef);
    // edges to other areas written as refs
    for (const a of areas) for (const e of a.edges || []) if (e.toRef) { const t = find(e.toRef); if (t) { e.area = t.area; e.to = [Math.floor(t.x / TS), Math.floor(t.y / TS)]; } }
    tourPickGoldV2(ctx, built);
    const b0 = built[0], st0 = b0.anchors.start || b0.anchors.in || { x: 5 * TS + TS / 2, y: 14 * TS };
    const gen0 = (spec.areas[0].gen || 'strip');
    const level = {
      id, world: w, index: i, type: TOUR_GEN_PLAN[gen0] || 'ow', arch: spec.arch || gen0, kind: spec.kind,
      name: spec.name, worldName: C.name, areas, start: { area: 0, x: st0.x, y: st0.y },
      time: spec.time || b0.time || 300, d, secret: spec.exits.secret ? { kind: 'secretExit', to: spec.exits.secret.to } : null,
      warps: null, hint: spec.hint || null, design: spec, tour: true, country: C.id, exits: spec.exits, problems, v2: true
    };
    if (problems.length && typeof console !== 'undefined') for (const pr of problems) console.warn('tour ' + id + ': ' + pr);
    return level;
  },
  /* build a level from a spec that isn't registered (test fixtures, the lab): host country C, level number i */
  fromSpec(C, spec, i) {
    const S = Tour.normLevel(C, spec, (i || 99) - 1);
    S.exits.main.to = S.exits.main.to || null;
    return S.v2 ? this.generateV2(C, S, C.world, i || 99, 0) : this.generateLegacy(C, S, C.world, i || 99, 0);
  }
});

/* postcards across every area: 'must' spots first, then one each of hidden, risky and high, then the rest spread out,
   then a fallback in the main area (as pickGold does for one area) */
function tourPickGoldV2(ctx, built) {
  const rng = ctx.rng, spots = [];
  const ok = (B, s) => s.tx >= 1 && s.tx <= B.W - 2 && s.ty >= 1 && s.ty < B.H && !SOLID[B.get(s.tx, s.ty)] && B.get(s.tx, s.ty) !== T.LAVA && B.get(s.tx, s.ty) !== T.SPIKES;
  built.forEach((b, k) => { if (b.B) for (const s of b.B.goldSpots) if (ok(b.B, s)) spots.push(Object.assign({ ai: k, B: b.B }, s)); });
  // legacy bonus rooms keep their postcard shelf
  ctx.areas.forEach((a, k) => { if (a.bonus && a.goldX) spots.push({ ai: built.length + k, area: a, tx: Math.floor(a.goldX / TS), ty: Math.floor(a.goldY / TS), kind: 'hidden', bonus: true }); });
  const chosen = [];
  const take = list => { if (!list.length) return null; const s = list[rng.int(0, list.length - 1)]; spots.splice(spots.indexOf(s), 1); return s; };
  for (const s of spots.filter(s => s.kind === 'must')) { if (chosen.length >= 3) break; spots.splice(spots.indexOf(s), 1); chosen.push(s); }
  for (const k of ['hidden', 'risky', 'high']) { if (chosen.length >= 3) break; const s = take(spots.filter(q => q.kind === k)); if (s) chosen.push(s); }
  while (chosen.length < 3 && spots.length) {
    const far = spots.filter(s => !chosen.some(c => c.ai === s.ai && Math.abs(c.tx - s.tx) < 12));
    chosen.push(take(far.length ? far : spots));
  }
  const B0 = built[0].B;
  let fx = 24 + rng.int(0, 10);
  while (chosen.length < 3 && B0 && fx < B0.W - 12) {
    let floor = -1;
    for (let y = B0.H - 1; y > 2; y--) if (SOLID[B0.get(fx, y)] && !SOLID[B0.get(fx, y - 1)]) { floor = y; break; }
    if (floor > 6) {
      let clear = true;
      for (let y = floor - 5; y < floor; y++) if (SOLID[B0.get(fx, y)] || B0.get(fx, y) === T.SEMI) clear = false;
      if (clear && !chosen.some(c => c.ai === 0 && Math.abs(c.tx - fx) < 6)) chosen.push({ ai: 0, B: B0, tx: fx, ty: floor - 4, kind: 'fallback' });
    }
    fx += 29;
  }
  // P1 (main route) first: area order, then left to right
  chosen.sort((a, b) => (a.ai - b.ai) || (a.tx - b.tx));
  chosen.forEach((s, idx) => {
    if (s.bonus) { s.area.spawns.push({ type: 'gold', idx, x: s.area.goldX, y: s.area.goldY, kind: 'bonus' }); return; }
    if (s.B.get(s.tx, s.ty) === T.PICK) s.B.set(s.tx, s.ty, T.EMPTY);
    s.B.spawn('gold', s.tx, s.ty, { idx, kind: s.kind });
  });
}

/* ---------- generators ---------- */
const tourAnchors = (r, extra) => Object.assign({ start: r.start, in: r.start }, (r.B && r.B.anchors) || {}, extra || {});
// side-scrollers: mode 'run' | 'auto' | 'castle' (legacy styles run / night / auto / castle)
TourGens.strip = (ctx, A) => {
  const mode = A.mode || 'run';
  if (A.H && A.GY == null) ctx.spec.GY = Math.min(14, A.H - 4);
  const r = tourStrip(ctx, mode === 'night' ? 'run' : mode);
  if (A.bottomKill) r.area.bottomKill = true;
  return { area: r.area, anchors: tourAnchors(r), B: r.B, time: r.time };
};
TourGens.ride = (ctx, A) => { const r = tourRide(ctx); return { area: r.area, anchors: tourAnchors(r), B: r.B, time: r.time }; };
TourGens.swim = (ctx, A) => { const r = tourSwim(ctx); return { area: r.area, anchors: tourAnchors(r), B: r.B, time: r.time }; };
TourGens.climb = (ctx, A) => { const r = tourClimb(ctx); r.area.variant = A.variant || null; return { area: r.area, anchors: tourAnchors(r), B: r.B, time: r.time }; };
// sky islands: no ground row; islands 3-12 wide hang in open sky, falling past the bottom kills
TourGens.islands = (ctx, A) => {
  const H = A.H || 30, S = ctx.spec;
  S.H = H; S.GY = A.GY || H - 9; S.gyMin = A.gyMin || 5; S.gyMax = A.gyMax || H - 6; if (!A.W && !S.width) S.width = 190 + 40;
  ctx.stripOpts = { sky: true };
  const r = tourStrip(ctx, 'run');
  ctx.stripOpts = null;
  r.area.bottomKill = A.bottomKill !== false; r.area.sky = true;
  return { area: r.area, anchors: tourAnchors(r), B: r.B, time: r.time };
};
// a one-screen (or a few) room drawn from a stamp
TourGens.room = (ctx, A) => {
  const S = TourStamp.get(A.stamp, ctx.C.id);
  if (!S) { ctx.problems.push(`area ${A.id}: unknown stamp '${A.stamp}'`); return TourGens.room(ctx, Object.assign({}, A, { stamp: TOUR_EMPTY_ROOM })); }
  const P = TourStamp.parse(S);
  const minW = A.minW || 28, W = Math.max(P.W, minW), H = P.H;
  const B = new AreaBuilder(W, H);
  B.themeKey = ctx.theme;
  // narrower than the screen: solid rock to the right of the stamp
  if (W > P.W) B.fill(P.W, 0, W - 1, H - 1, T.GROUND);
  const st = tourState(ctx, B, { GY: P.floor, H, W, mode: 'room' });
  const placed = TourStamp.place(st, S, 0, 0, { first: ctx.areaIndex === 0 });
  if (!placed.anchors.in && !placed.anchors.start) { const a = B.anchor(ctx.areaIndex === 0 ? 'start' : 'in', 2, P.floor - 1); placed.anchors.in = a; }
  if (ctx.areaIndex === 0 && !B.anchors.start) B.anchors.start = B.anchors.in;
  const area = B.build(TourBuild.areaProps(ctx, { water: !!A.water, room: true }));
  return { area, anchors: Object.assign({}, B.anchors), B, time: A.time || 300 };
};
const TOUR_EMPTY_ROOM = { floor: 10, rows: ['############################'].concat(Array.from({ length: 9 }, (_, k) => '#' + (k === 8 ? '.@' + '.'.repeat(24) : '.'.repeat(26)) + '#')).concat(['############################', '############################']) };
// a boss arena behind a short entry: runs the country's arena_<layout> piece; anchor 'in' on the entry
TourGens.arena = (ctx, A) => {
  const S = ctx.spec, H = A.H || 18, GY = H - 4, arenaW = A.arenaW || S.arenaW || 26;
  S.arena = A.layout || S.arena; S.arenaW = arenaW; if (A.roof != null) S.roof = A.roof;
  const B = new AreaBuilder(arenaW + 40, H);
  B.themeKey = ctx.theme;
  const st = tourState(ctx, B, { GY, H, mode: 'castle' });
  st.floor(0, 5, GY);
  B.fill(0, 0, 0, GY - 1, T.HARD);
  B.anchor('in', 2, GY - 1);
  st.x = 2;
  st.x = Tour.pieces.arena(st, {});
  B.trim(st.x);
  const area = B.build(TourBuild.areaProps(ctx, { castle: true }));
  return { area, anchors: Object.assign({ start: B.anchors.in }, B.anchors), B, time: A.time || 400 };
};
/* PARADE's stacked lanes: rooftops, street, cellar (rows from the top). Each step runs on its lane's own cursor
   (opts.lane, default the street); ['sync'] brings every lane level with the furthest. Upper lanes are 2-row slabs. */
TourGens.layered = (ctx, A) => {
  const S = ctx.spec, H = A.H || 30, lanes = Object.assign({}, A.lanes || { roof: 12, street: 21, cellar: 27 });
  const names = Object.keys(lanes).sort((a, b) => lanes[a] - lanes[b]);
  const B = new AreaBuilder(A.W ? A.W + 60 : 420, H);
  B.themeKey = ctx.theme;
  const band = {}; names.forEach((n, k) => { band[n] = { y0: k === 0 ? 0 : lanes[names[k - 1]] + 2, y1: k === names.length - 1 ? H - 1 : lanes[n] + 1 }; });
  const main = A.lane || (lanes.street != null ? 'street' : names[Math.floor(names.length / 2)]);
  const st = tourState(ctx, B, { GY: lanes[main], H, mode: 'layered', gyMin: 3, gyMax: H - 2 });
  const lx = {}, lgy = {};
  for (const n of names) { lx[n] = 12; lgy[n] = lanes[n]; }
  st.lanes = lanes; st.lx = lx; st.laneY = lgy; st.lane = main;
  const slab = (x0, x1, gy) => { gy = gy == null ? st.gy : gy; const bd = band[st.lane]; for (let x = x0; x <= x1; x++) for (let y = gy; y <= bd.y1; y++) B.set(x, y, T.GROUND); };
  st.floor = (x0, x1, gy) => slab(x0, x1, gy);
  const use = n => { st.lane = n; st.x = lx[n]; st.gy = lgy[n]; B.band = band[n]; st.sky = n !== names[names.length - 1]; st.gyMin = band[n].y0 + 3; st.gyMax = band[n].y1 - (st.sky ? 1 : 2); };
  const keep = () => { lx[st.lane] = st.x; lgy[st.lane] = st.gy; };
  // the start: every lane begins with 12 tiles of floor
  for (const n of names) { use(n); slab(0, 11, lanes[n]); }
  use(main);
  if (ctx.i === 1 && !ctx.areaIndex) { B.set(7, lanes[main] - 4, T.HIDDEN); B.item(7, lanes[main] - 4, 'oneup'); }
  B.anchor('start', 5, lanes[main] - 1);
  st.dress(1, 10, 0.25);
  const script = (A.script || []).slice();
  if (!script.some(s => s === 'cp' || (Array.isArray(s) && s[0] === 'cp'))) script.splice(Math.floor(script.length / 2), 0, 'cp');
  const sync = () => {
    const far = Math.max(...names.map(n => lx[n]));
    for (const n of names) if (lx[n] < far) { use(n); slab(lx[n], far - 1); lx[n] = far; }
  };
  st.sync = sync;
  for (let k = 0; k < script.length; k++) {
    const step = script[k], nm = Array.isArray(step) ? step[0] : step, o = Array.isArray(step) ? (step[1] || {}) : {};
    if (nm === 'sync') { sync(); continue; }
    use(o.lane || main);
    if (k > 0 && !TOUR_INLINE[nm] && nm !== 'end' && !o.tight) { const br = ctx.rng.int(1, 2); st.floor(st.x, st.x + br - 1); st.x += br; }
    st.x = st.run(step);
    st.gy = clamp(st.gy, st.gyMin, st.gyMax);
    keep();
  }
  B.band = null;
  const endX = Math.max(...names.map(n => lx[n]));
  for (const n of names) if (lx[n] < endX) { use(n); slab(lx[n], endX - 1); }
  B.band = null;
  B.trim(endX);
  resolvePendingReturns(st);
  const area = B.build(TourBuild.areaProps(ctx, { lanes, camera: A.camera || 'lanes' }));
  return { area, anchors: Object.assign({ in: B.anchors.start }, B.anchors), B, time: A.time || 300 };
};

/* ---------- builder pieces (v2) ---------- */
Object.assign(Tour.pieces, {
  // a door on a perch (perch 0: on the ground) to another area: { to: 'area@anchor', look, perch: 3, back }
  door(st, o) {
    const B = st.B, perch = o.perch != null ? o.perch : 3;
    st.floor(st.x, st.x + 6);
    const px = st.x + 3;
    if (perch > 0) B.fill(px, st.gy - perch, px + 1, st.sky ? st.gy + 1 : st.gy - 1, T.HARD);
    const s = B.spawn('portal', px, st.gy - perch - 1, { kind: 'door', look: o.look || 'tourDoor', targetRef: o.to || null });
    if (perch > 0) s.x += TS / 2;
    if (o.back) B.anchor(o.back, st.x + 6, st.gy - 1);
    return st.x + 7;
  },
  /* a secret door that looks like scenery: walk into it. look 'fake' (a cracked fake wall section), 'curtain'
     (a waterfall, willow or leaf curtain drawn in front), 'painted' (a door painted on a wall). skin: the country's art */
  secretDoor(st, o) {
    const B = st.B, x = st.x, look = o.look || 'fake';
    st.floor(x, x + 7);
    const dx = x + 4;
    if (look === 'fake' || look === 'painted') {
      // a 3-wide, 4-tall wall section: the middle column is fake, the door stands inside it
      B.fill(x + 3, st.gy - 4, x + 5, st.gy - 1, T.HARD);
      B.fill(x + 3, st.gy - 3, x + 5, st.gy - 1, T.FAKE);
      B.spawn('tourDraft', dx, st.gy - 1, { look, skin: o.skin || null });
    } else B.spawn('tourCurtain', dx, st.gy - 1, { look, skin: o.skin || o.look, h: o.h || 4 });
    B.spawn('portal', dx, st.gy - 1, { kind: 'door', look: o.doorLook || 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
    if (o.back) B.anchor(o.back, x + 7, st.gy - 1);
    return x + 8;
  },
  // a hatch in the floor: stomp it (or the crate on it) and drop into another area: { to, crate, back, look }
  trapdoor(st, o) {
    const B = st.B, x = st.x;
    st.floor(x, x + 5);
    B.spawn('trapdoor', x + 2, st.gy - 1, { targetRef: o.to || null, crate: !!o.crate, look: o.look || o.skin || null });
    if (o.back) B.anchor(o.back, x + 5, st.gy - 1);
    return x + 6;
  },
  // a goal: { exit: 'main' | 'secret', need } (need: postcards before the gate opens)
  gate(st, o) {
    const x = st.x; st.floor(x, x + 9);
    const ex = o.exit || 'main';
    st.B.spawn('gate', x + 5, st.gy - 1, Object.assign({ exit: ex }, ex !== 'main' ? { secret: true } : {}, o.need ? { need: o.need } : {}));
    return x + 10;
  },
  // a postcard spot relative to the cursor: { kind: 'must' | 'hidden' | 'risky' | 'high', dx: 0, dy: -3 }
  postcard(st, o) { st.gold(st.x + (o.dx || 0), st.gy + (o.dy != null ? o.dy : -3), o.kind || 'high'); return st.x; },
  // an item block: { item, y (rows above the floor, 4), hidden }
  itemBlock(st, o) {
    const x = st.x; st.floor(x, x + 2);
    st.block(x + 1, st.gy - (o.y || 4), o.item || 'power', o.hidden ? T.HIDDEN : T.QBLOCK);
    return x + 3;
  },
  // a named entry point at the cursor: { name }
  anchor(st, o) { st.B.anchor(o.name || 'in', st.x, st.gy - 1); return st.x; },
  // a virtual key at the cursor (the validator's 'holding' flag): { id, dx, dy }
  vkey(st, o) { st.B.vkey(o.id, [[st.x + (o.dx || 0), st.gy - 1 + (o.dy || 0)]]); return st.x; },
  // layered gens: line every lane up with the furthest one
  sync(st, o) { if (st.sync) st.sync(); return st.x; }
});
// 'end' gains { exit }: the legacy finale with a choice of exit
{
  const end0 = Tour.pieces.end;
  Tour.pieces.end = function (st, o) {
    const n = st.B.spawns.length, x = end0(st, o);
    if (o && o.exit && o.exit !== 'main') for (let k = n; k < st.B.spawns.length; k++) if (st.B.spawns[k].type === 'gate') { st.B.spawns[k].exit = o.exit; st.B.spawns[k].secret = true; }
    return x;
  };
}
