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
      // a room without its own theme is an interior: the level theme's cave look (as legacy bonus rooms)
      let theme = A.theme || (A.gen === 'room' ? caveVariant(spec.theme) : spec.theme);
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
  // tall areas (climbs, shafts): spare spots over standable ledges, every dozen rows
  if (B0 && B0.H > B0.W && chosen.length < 3) {
    for (let y = 6; y < B0.H - 3 && chosen.length < 3; y += 13) for (let x = 2; x < B0.W - 2; x++) {
      if ((SOLID[B0.get(x, y)] || B0.get(x, y) === T.SEMI) && B0.get(x, y - 1) === T.EMPTY && B0.get(x, y - 2) === T.EMPTY && B0.get(x, y - 3) === T.EMPTY && !chosen.some(c => c.ai === 0 && Math.abs(c.ty - y) < 8)) { chosen.push({ ai: 0, B: B0, tx: x, ty: y - 2, kind: 'fallback' }); break; }
    }
  }
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
  const minW = A.minW || 28, W = Math.max(P.W, minW), H = Math.max(P.H, A.minH || 14);
  const B = new AreaBuilder(W, H);
  B.themeKey = ctx.theme;
  // smaller than the screen: solid rock to the right of the stamp and under it
  if (W > P.W) B.fill(P.W, 0, W - 1, H - 1, T.GROUND);
  if (H > P.H) B.fill(0, P.H, W - 1, H - 1, T.GROUND);
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
  // launchers open the lane above: over every bouncy surface, spring and updraft in a lower lane the slab of the
  // lane above gets a hole (a light well) so the launch reaches it (A.autoOpen: false to place holes by hand)
  if (A.autoOpen !== false) {
    const wells = new Set();
    const laneAbove = y => { let best = null; for (const n of names) if (lanes[n] < y - 1 && (best == null || lanes[n] > lanes[best])) best = n; return best; };
    const open = (x, y) => { const up = laneAbove(y); if (!up) return; for (const yy of [lanes[up], lanes[up] + 1]) if (SOLID[B.get(x, yy)] && B.get(x, yy) !== T.HARD) { B.set(x, yy, T.EMPTY); wells.add(x + ',' + yy); } };
    for (let y = 0; y < H; y++) for (let x = 0; x < endX; x++) if (B.surf[y * B.W + x] === SURF.BOUNCE) open(x, y);
    for (const sp of B.springs) for (let dx = -1; dx <= 1; dx++) open(sp[0] + dx, sp[1]);
    for (const z of B.zones) if (z.fy < 0) for (let x = Math.floor(z.x / TS); x < Math.ceil((z.x + z.w) / TS); x++) open(x, Math.floor((z.y + z.h) / TS));
    st.wells = wells;
  }
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

/* ---------- more generators (W8) ---------- */
/* FALL: a narrow shaft played top to bottom. st.y is the next free row going down; st.shelf(y, holes) lays a
   full-width ledge with holes ([x0, x1] pairs). Brady starts on a lip at the top; the bottom is a splash pool and
   the gate. Area: fallCap 11 t/s, air steering x1.4, camera 'shaft' (Brady at 35 % from the top). */
TourGens.shaft = (ctx, A) => {
  const W = A.W || 22, H = A.H || 160;
  const B = new AreaBuilder(W, H);
  B.themeKey = ctx.theme;
  B.fill(0, 0, 0, H - 1, T.HARD); B.fill(W - 1, 0, W - 1, H - 1, T.HARD); B.fill(0, 0, W - 1, 1, T.HARD);
  const st = tourState(ctx, B, { GY: 6, H, W, mode: 'shaft' });
  st.mid = Math.floor(W / 2);
  // the lip at the top: stand on the left, step off to the right
  B.fill(1, 6, Math.floor(W / 2) - 2, 6, T.GROUND); B.fill(1, 7, Math.floor(W / 2) - 2, 7, T.GROUND);
  B.anchor('start', 3, 5); st.y = 9; st.x = 1;
  st.shelf = (y, holes) => { for (let x = 1; x <= W - 2; x++) if (!(holes || []).some(([a, b]) => x >= a && x <= b)) { if (B.get(x, y) === T.EMPTY) B.set(x, y, T.GROUND); } };
  st.down = n => { st.y += n; return st.y; };
  // generic pieces (cp, blocks, enemies...) get a one-row ledge on the side instead of ground to the bottom
  st.floor = (x0, x1, gy) => { gy = gy == null ? st.gy : gy; B.fill(Math.max(1, x0), gy, Math.min(W - 2, x1), gy, T.GROUND); };
  const script = (A.script || []).slice();
  if (!script.length) script.push('ledges', 'ringFall', ['shelf', { cp: true }], ['ledges', { gold: true }], 'spikeShelf', 'updraft', 'ledges');
  for (const step of script) {
    const y0 = st.y; st.gy = st.y + 4; st.x = st.rng.chance(0.5) ? 2 : W - 9;
    st.run(step);
    if (st.y === y0) st.y += 6;
    if (st.y > H - 16) break;
  }
  // the bottom: an underground river to splash into (water), then the gate on a bank
  const by = H - 2, pool = Math.max(st.y + 3, H - 9);
  B.fill(1, by, W - 2, H - 1, T.GROUND);
  for (let y = pool; y < by; y++) for (let x = 1; x <= W - 7; x++) B.set(x, y, T.WATER);
  B.fill(W - 6, by - 2, W - 2, by - 1, T.GROUND);
  B.spawn('gate', W - 4, by - 3, { exit: 'main' });
  B.gold(W - 4, by - 6, 'high');
  const area = B.build(TourBuild.areaProps(ctx, { tower: true, camera: A.camera || 'shaft', fallCap: A.fallCap || 11, airSteer: A.airSteer || 1.4 }));
  return { area, anchors: Object.assign({ in: B.anchors.start }, B.anchors), B, time: A.time || 240 };
};
/* RISE: the climb builder with the floor falling away (camera autoscroll up, autoscrollY) or a rising flood
   (risingWater: Brady swims in it). */
TourGens.rise = (ctx, A) => {
  const S = ctx.spec;
  S.W = A.W || 28; S.H = A.H || 120;
  if (A.rise) S.autoscrollY = A.rise; if (A.risingWater) S.risingWater = A.risingWater;
  const r = tourClimb(ctx);
  if (A.rise) r.area.autoscrollY = Object.assign({ speed: 1.0, delay: 3 }, A.rise);
  if (A.risingWater) r.area.risingWater = Object.assign({ speed: 0.6, delay: 4 }, A.risingWater);
  r.area.gen = 'rise';
  return { area: r.area, anchors: tourAnchors(r), B: r.B, time: r.time };
};
/* MAZE: one area of room cells (default 3 x 3 cells of 26 x 14). script: rows of cell stamps (names or objects);
   links: [{ from: [c, r], to: [c, r], kind: 'door' | 'drop' | 'oneway', at: [dx, dy], toAt: [dx, dy] }].
   Doors are same-area portals; a drop opens the floor between two stacked cells. Camera 'room': one cell at a time. */
TourGens.maze = (ctx, A) => {
  const [CW, CH] = A.cell || [26, 14], [NC, NR] = A.cells || [3, 3];
  const B = new AreaBuilder(NC * CW, NR * CH);
  B.themeKey = ctx.theme;
  B.fill(0, 0, NC * CW - 1, NR * CH - 1, T.GROUND);
  const st = tourState(ctx, B, { GY: CH - 1, H: NR * CH, W: NC * CW, mode: 'maze' });
  const rows = A.script || [];
  const cellOf = (c, r) => ({ x: c * CW, y: r * CH });
  for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
    const S = TourStamp.get((rows[r] || [])[c], ctx.C.id) || tourMazeCell(CW, CH);
    const { x, y } = cellOf(c, r);
    const placed = TourStamp.place(st, S, x, y, { first: ctx.areaIndex === 0 && r === 0 && c === 0 });
    if (r === 0 && c === 0 && !B.anchors.start) B.anchor('start', x + 3, y + CH - 3);
  }
  for (const L of A.links || []) {
    const a = cellOf(L.from[0], L.from[1]), b = cellOf(L.to[0], L.to[1]);
    const at = L.at || [CW - 4, CH - 3], toAt = L.toAt || [3, CH - 3];
    if (L.kind === 'drop') {
      // open the floor of the upper cell into the lower one (one way: too high to jump back)
      const up = L.from[1] < L.to[1] ? a : b, x0 = up.x + (L.at ? L.at[0] : Math.floor(CW / 2) - 2);
      for (let x = x0; x < x0 + 4; x++) for (let y = up.y + CH - 2; y <= up.y + CH; y++) B.set(x, y, T.EMPTY);
      continue;
    }
    const p1 = B.spawn('portal', a.x + at[0], a.y + at[1], { kind: 'door', look: L.look || 'tourDoor', target: { area: ctx.areaIndex || 0, x: (b.x + toAt[0]) * TS + TS / 2, y: (b.y + toAt[1] + 1) * TS }, sym: L.sym || null });
    if (L.kind !== 'oneway') B.spawn('portal', b.x + toAt[0], b.y + toAt[1], { kind: 'door', look: L.look || 'tourDoor', target: { area: ctx.areaIndex || 0, x: (a.x + at[0]) * TS + TS / 2, y: (a.y + at[1] + 1) * TS }, sym: L.sym || null });
  }
  const area = B.build(TourBuild.areaProps(ctx, { camera: A.camera || 'room', cell: [CW, CH], maze: true }));
  // same-area door targets are set directly: fix their area index once the level knows it (the generateV2 pass)
  return { area, anchors: Object.assign({ in: B.anchors.start }, B.anchors), B, time: A.time || 300 };
};
// a default maze cell: walls, a floor, two ledges
function tourMazeCell(CW, CH) {
  const rows = [];
  for (let y = 0; y < CH; y++) {
    if (y === 0 || y >= CH - 1) { rows.push('#'.repeat(CW)); continue; }
    let r = '#' + '.'.repeat(CW - 2) + '#';
    if (y === CH - 6) r = '#' + '.'.repeat(4) + '-----' + '.'.repeat(CW - 16) + '-----' + '#';
    rows.push(r);
  }
  return { rows, floor: CH - 1 };
}
/* RAIL: a cart on a track with forks. Decks: lower (default) and upper; a fork piece { len, upper: [steps],
   lower: [steps] } runs both branches side by side and a lever post before it picks one. */
TourGens.rail = (ctx, A) => {
  const S = ctx.spec, H = A.H || 18, decks = Object.assign({ upper: 6, lower: 11 }, A.decks || {}), len = A.len || 200;
  const B = new AreaBuilder(len + 40, H);
  B.themeKey = ctx.theme;
  const speed = A.scroll || 2.4 + ctx.d * 0.6;
  const st = tourState(ctx, B, { GY: decks.lower, H, mode: 'rail', deck: decks.lower, decks, speed, len });
  st.forks = [];
  // the track bed: lower deck along the whole length (a ghost path the cart rides); falling below costs a life
  if (A.below === 'liquid') for (let x = 0; x < len + 40; x++) B.set(x, H - 1, T.LAVA);
  B.fill(0, decks.lower, 3, H - 1, T.GROUND);
  st.x = 16;
  const script = (A.script || []).slice();
  if (!script.includes('cp')) script.splice(Math.floor(script.length / 2), 0, 'cp');
  for (const step of script) { st.x = st.run(step); st.x += ctx.rng.int(2, 4); if (st.x > len - 18) break; }
  // the track profile: lower deck, with forks splitting off; the cart picks the deck at each fork's lever
  const track = [];
  for (let x = 0; x < len + 2; x++) track.push(decks.lower);
  for (let x = 0; x < len + 2; x++) B.ghosts.push([x, decks.lower]);
  for (const f of st.forks) for (let x = f.x0; x <= f.x1; x++) { const k = Math.min(x - f.x0, f.x1 - x, 3) / 3, y = Math.round(decks.lower + (decks.upper - decks.lower) * k); B.ghosts.push([x, y]); }
  const vw = A.vehicleW || 6;
  B.spawn('railTrack', 0, decks.lower - 1, { len: len + 2, forks: st.forks, decks, skin: A.track || null });
  B.spawn('railCart', 1, decks.lower - 1, { pw: vw, speed, stopX: (len - vw) * TS, forks: st.forks, decks, skin: A.vehicle || null });
  B.fill(len, decks.lower, len + 21, H - 1, T.GROUND);
  B.spawn('gate', len + 13, decks.lower - 1, { exit: 'main' });
  B.gold(len + 5, decks.lower - 5, 'high');
  B.anchor('start', 2, decks.lower - 1);
  B.trim(len + 22);
  const area = B.build(TourBuild.areaProps(ctx, { autoscroll: speed, carrier: true, rail: { decks, forks: st.forks } }));
  return { area, anchors: Object.assign({ in: B.anchors.start }, B.anchors), B, time: A.time || 400 };
};
/* DIG: a surface strip over deep soil (rows soilFrom..H-3). st.cavern(x0, y0, x1, y1) carves air, st.rock(...) sets
   undiggable rock, st.pocket(x, y, item) a treasure niche. Steps run left to right along the surface with st.y the
   depth cursor; the gate waits in the deepest cavern (the 'exit' piece, added at the end if the script has none). */
TourGens.dig = (ctx, A) => {
  const W = A.W || 130, H = A.H || 40, top = A.surface || 8, soil = A.soilFrom || top + 1;
  const B = new AreaBuilder(W, H);
  B.themeKey = ctx.theme;
  B.fill(0, top, W - 1, H - 1, T.SOIL);
  B.fill(0, H - 2, W - 1, H - 1, T.HARD); B.fill(0, 0, 0, H - 1, T.HARD); B.fill(W - 1, 0, W - 1, H - 1, T.HARD);
  // the start pad is firm ground; the rest of the surface is soil to dig
  B.fill(1, top, 7, H - 3, T.GROUND);
  const st = tourState(ctx, B, { GY: top, H, W, mode: 'dig' });
  // a 'floor' on the surface is a firm (undiggable) path
  st.floor = (x0, x1) => B.fill(x0, top, x1, top, T.GROUND);
  st.cavern = (x0, y0, x1, y1) => B.fill(x0, y0, x1, y1, T.EMPTY);
  st.rock = (x0, y0, x1, y1) => B.fill(x0, y0, x1, y1, T.HARD);
  st.soilAt = (x0, x1) => B.fill(x0, top, x1, top, T.SOIL);
  st.pocket = (x, y, item) => { B.fill(x - 1, y - 1, x + 1, y, T.EMPTY); if (item) st.block(x, y - 2 < top ? y : y - 1, item); };
  st.y = soil; st.x = 10;
  B.anchor('start', 4, top - 1);
  const script = (A.script || []).slice();
  if (!script.some(s => s === 'exit' || (Array.isArray(s) && s[0] === 'exit'))) script.push('exit');
  for (const step of script) st.x = st.run(step);
  const area = B.build(TourBuild.areaProps(ctx, { camera: A.camera || 'free', dig: true, surface: top, tunnelCol: A.tunnelCol || null }));
  return { area, anchors: Object.assign({ in: B.anchors.start }, B.anchors), B, time: A.time || 300 };
};

/* ---------- generic pieces for the new gens ---------- */
Object.assign(Tour.pieces, {
  // shaft: side ledges zig-zagging down, coins between
  ledges(st, o) {
    if (st.mode !== 'shaft') return Tour.pieces.flat(st, o);
    const B = st.B, W = st.W, n = o.n || 4;
    for (let k = 0; k < n; k++) {
      const y = st.down(o.gap || 6), left = (k + (o.flip ? 1 : 0)) % 2 === 0, x0 = left ? 1 : W - 7;
      B.fill(x0, y, x0 + 5, y, T.GROUND);
      st.coins(left ? x0 + 7 : x0 - 4, left ? x0 + 9 : x0 - 2, y - 3);
      if (k === 1 && o.gold) st.gold(left ? x0 + 1 : x0 + 4, y - 2, 'high');
      if (k === 2 && o.enemy) st.enemy(o.enemy, x0 + 2, y, { edgeTurn: true });
    }
    st.down(3); return st.x;
  },
  // shaft: a full-width ledge with a gap to fall through (a wide shelf doubles as a checkpoint landing)
  shelf(st, o) {
    if (st.mode !== 'shaft') return Tour.pieces.flat(st, o);
    const y = st.down(o.gap || 5), W = st.W, h0 = o.hole != null ? o.hole : (st.rng.chance(0.5) ? 3 : W - 7);
    st.shelf(y, [[h0, h0 + 3]]);
    st.coins(h0, h0 + 3, y - 2);
    if (o.cp) st.spawn('checkpoint', h0 > W / 2 ? 4 : W - 5, y - 1);
    st.down(3); return st.x;
  },
  // shaft: a ring of coins to fall through
  ringFall(st, o) {
    if (st.mode !== 'shaft') return Tour.pieces.flat(st, o);
    const n = o.n || 3;
    for (let k = 0; k < n; k++) { const cy = st.down(6), cx = 5 + ((k * 7) % (st.W - 10)); for (let a = 0; a < 8; a++) st.B.pickAt(Math.round(cx + Math.cos(a * TAU / 8) * 2), Math.round(cy + Math.sin(a * TAU / 8) * 2)); if (k === 1) st.gold(cx, cy, o.goldKind || 'risky'); }
    st.down(3); return st.x;
  },
  // shaft: a shelf studded with spikes and one safe gap; fall through the gap
  spikeShelf(st, o) {
    if (st.mode !== 'shaft') return Tour.pieces.spikes(st, o);
    const y = st.down(o.gap || 6), W = st.W, hx = o.hole != null ? o.hole : st.rng.int(4, W - 8);
    for (let x = 1; x <= W - 2; x++) { if (x >= hx && x <= hx + 3) continue; st.B.set(x, y, T.GROUND); st.B.set(x, y - 1, T.SPIKES); }
    for (let x = hx; x <= hx + 3; x++) { st.B.set(x, y - 1, T.EMPTY); }
    st.coins(hx, hx + 3, y - 4);
    st.down(3); return st.x;
  },
  // an updraft column (in a shaft it brakes the fall; in a strip it lifts): { w, h, force }
  updraft(st, o) {
    const B = st.B;
    if (st.mode === 'shaft') {
      const h = o.h || 8, w = o.w || 4, x0 = o.x != null ? o.x : st.rng.int(3, st.W - w - 3), y0 = st.y + 1;
      B.zone(x0, y0, w, h, 0, -(o.force || 70) * TS, (o.vmax || 2) * TS, 'updraft', { pull: 1 });
      B.spawn('vent', x0 + Math.floor(w / 2), y0 + h, { w, look: o.look || 'steam' });
      st.down(h + 2); return st.x;
    }
    const x = st.x, w = o.w || 2, h = o.h || 7; st.floor(x, x + w + 3);
    B.zone(x + 2, st.gy - h, w, h, 0, -(o.force || 110) * TS, (o.vmax || 7.2) * TS, 'updraft', { pull: 3 });
    B.spawn('vent', x + 2 + Math.floor(w / 2), st.gy - 1, { w, look: o.look || 'steam' });
    return x + w + 4;
  },
  // rail: a fork. Both branches are built side by side (upper deck and lower deck); a lever post before it picks one
  fork(st, o) {
    if (st.mode !== 'rail') return Tour.pieces.flat(st, o);
    const x0 = st.x + 3, len = o.len || 40, x1 = x0 + len, d = st.decks;
    st.spawn('railSwitch', st.x, d.lower - 1, { fork: st.forks.length, skin: o.skin || null });
    st.forks.push({ x0, x1, upper: d.upper, lower: d.lower });
    const run = (deck, steps) => { const sx = st.x, sg = st.gy; st.gy = deck; st.deck = deck; st.x = x0 + 4; for (const s of steps || []) { st.x = st.run(s); st.x += 2; if (st.x > x1 - 4) break; } st.x = sx; st.gy = sg; st.deck = d.lower; };
    run(d.upper, o.upper || ['coinsRow']); run(d.lower, o.lower || ['coinsRow']);
    // a postcard over each branch: the high road and the low road both pay
    if (o.gold !== false) { st.gold(x0 + Math.floor(len / 2), d.upper - 3, 'high'); st.gold(x0 + Math.floor(len * 0.7), d.lower - 3, 'risky'); }
    return x1 + 2;
  },
  coinsRow(st, o) { const x = st.x; st.coins(x, x + (o.n || 6) - 1, (st.deck || st.gy) - 2); return x + (o.n || 6); },
  // dig: a cavern at depth with a coin row; { w, h, dy } from the depth cursor
  cavern(st, o) {
    if (st.mode !== 'dig') return Tour.pieces.flat(st, o);
    const x = st.x, w = o.w || 10, h = o.h || 4, y = Math.min(st.B.H - 4 - h, st.y + (o.dy || 4));
    st.cavern(x, y, x + w - 1, y + h - 1); st.coins(x + 1, x + w - 2, y + h - 2);
    if (o.gold) st.gold(x + Math.floor(w / 2), y + h - 2, o.gold === true ? 'hidden' : o.gold);
    st.y = y + h; return x + w + (o.gap || 3);
  },
  // dig: a band of rock to dig around
  rockBand(st, o) { if (st.mode !== 'dig') return st.x; const x = st.x, w = o.w || 6; st.rock(x, st.y + (o.dy || 1), x + w - 1, st.y + (o.dy || 1) + (o.h || 2) - 1); return x + w; },
  // dig: a treasure pocket { item }
  pocket(st, o) { if (st.mode !== 'dig') return st.x; st.pocket(st.x + 1, st.y + (o.dy || 2), o.item || 'pick'); return st.x + 4; },
  // dig: the exit cavern at the bottom with the gate
  exit(st, o) {
    if (st.mode !== 'dig') return Tour.pieces.end(st, o);
    const B = st.B, x = Math.min(st.x, B.W - 16), y1 = B.H - 3, y0 = y1 - 4;
    st.cavern(x, y0, x + 12, y1); B.spawn('gate', x + 8, y1, { exit: o.exit || 'main' }); st.gold(x + 3, y1 - 2, 'high');
    return x + 13;
  }
});
// climbs (climb / rise gens): generic bands
Object.assign(Tour.pieces, {
  // a band of ledges zig-zagging up, with a one-way floor on top: { n, crumble, enemy, gold }
  zigzag(st, o) {
    if (st.mode !== 'climb') return Tour.pieces.flat(st, o);
    const B = st.B, W = st.W, n = o.n || 4, mid = st.mid; let y = st.y;
    for (let k = 0; k < n; k++) {
      y = st.y - 3 * (k + 1);
      const left = (k + (o.flip ? 1 : 0)) % 2 === 0, x0 = left ? 2 : W - 9;
      if (o.crumble && k % 2) for (let q = 0; q < 7; q++) B.set(x0 + q, y, T.CRUMBLE); else B.fill(x0, y, x0 + 6, y, T.GROUND);
      st.coins(x0 + 1, x0 + 5, y - 2);
      if (k === 1 && o.enemy) st.enemy(o.enemy, x0 + 3, y, { edgeTurn: true });
      if (k === 2 && o.gold) st.gold(x0 + 3, y - 3, o.gold === true ? 'high' : o.gold);
      if (k < n - 1) for (let q = -2; q < 2; q++) B.set(mid + q, y - 2, T.SEMI);
    }
    st.top(y - 2);
  },
  // a climb band with an item block on a ledge: { item }
  blockBand(st, o) {
    if (st.mode !== 'climb') return Tour.pieces.blocks(st, o);
    const B = st.B, W = st.W, y = st.y - 3, x0 = o.left ? 2 : W - 9;
    B.fill(x0, y, x0 + 6, y, T.GROUND); st.block(x0 + 3, y - 4, o.item || 'power');
    for (let q = -2; q < 2; q++) B.set(st.mid + q, y, T.SEMI);
    st.top(y - 3);
  },
  // facade climbs: a waterfall column that pushes Brady down while he's in it: { x, w, h }
  waterfall(st, o) {
    if (st.mode !== 'climb') return st.x;
    const B = st.B, w = o.w || 2, h = o.h || 12, x0 = o.x != null ? o.x : st.mid - 1, y0 = st.y - h;
    B.zone(x0, y0, w, h, 0, (o.force || 40) * TS, 0, 'waterfall');
    B.spawn('tourCurtain', x0 + w / 2, st.y - 1, { look: 'waterfall', h, skin: o.skin || null, ghost: true });
    return st.x;
  },
  // exterior climbs: a gondola (window-washer cradle) that lifts Brady { rise, x }
  gondola(st, o) {
    if (st.mode !== 'climb') return Tour.pieces.lift(st, o);
    const B = st.B, rise = o.rise || 8, x = o.x != null ? o.x : (o.left ? 3 : st.W - 7), y0 = st.y;
    B.spawn('mplat', x, y0 - 1, { pw: 3, ax: 0, ay: -rise * TS, speed: 1.4, skin: o.skin || 'tourGondola' });
    for (let y = y0 - rise; y <= y0; y++) for (let k = 0; k < 3; k++) B.ghosts.push([x - 1 + k, y]);
    const y1 = y0 - rise, lx = x > st.mid ? x - 7 : x + 3;
    B.fill(lx, y1, lx + 4, y1, T.GROUND); st.coins(lx, lx + 4, y1 - 2);
    st.top(y1 - 3);
  }
});
