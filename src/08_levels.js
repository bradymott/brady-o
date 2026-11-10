/* ============================================================
   Super Brady-O World — level generator core.
   Every level has its own recipe (LEVEL_DESIGNS in 08c_designs.js):
   an archetype (strip, auto-scroll, cave, sky, water, tower, castle,
   haunted house, gift camp, ride-the-bus), a chunk table of set pieces
   (08a_chunks.js), an enemy mix and a theme. The world tables
   (names, kinds, specs) live in 26_worlddata.js.
   ============================================================ */
const WORLDS = {};                                   // filled as the tour's countries register (28_tour_a_core.js)
const WORLD_ORDER = [];                               // playable worlds in route order (Tour.rebuildOrder)
const MAIN_WORLDS = [41, 42, 43, 44, 45, 46, 47, 48];
// a level's secret exit opens a hidden path on the overworld map
function secretFor(id) {
  if (typeof WORLD3_SECRETS !== 'undefined' && WORLD3_SECRETS[id]) return { kind: 'secretExit', world: 0, city: true };
  return null;
}
const SIGN_TEXTS = [
  'Hydrate or die-drate.',
  'Leave no trace. Except footprints. And maybe glitter.',
  'Lost something? Check Lost & Found. Then check your pockets.',
  'Somewhere, a wall is lying to you.',
  'The Man has a crush. It is not going well for anyone.',
  'Stand still long enough and Brady gets bored.',
  'Chinka was here. She left a heart in the dust.',
  'Free hugs ahead. Proceed with caution.',
  'Radical self-reliance means carrying your own snacks.',
  'Up on a porta-potty door to step through. Hold your breath.',
  'Tap jump again in mid-air to headbang. Spikes hate that.',
  'Your pack holds one spare power-up. Tap it when you need it.',
  'Welcome home!'
];

function levelDifficulty(w, i) {
  if (w === 49) return 0.82 + i * 0.025;                                   // Sunrise Set: secret, hard
  if (w === 50) return 0.9 + i * 0.02;                                     // World 22
  return clamp(0.04 + (w - 41) * 0.105 + (i - 1) * 0.016, 0, 0.92);
}
function levelId(w, i) { return w + '-' + i; }

/* ---------- area builder ---------- */
class AreaBuilder {
  constructor(W, H) {
    this.W = W; this.H = H; this.tiles = new Uint8Array(W * H);
    this.hide = new Uint8Array(W * H);   // 1 = invisible collision under a prop, 2 = trip platform (LSD reveals it)
    this.surf = new Uint8Array(W * H);   // SURF.* special surfaces
    this.contents = {}; this.spawns = []; this.decor = []; this.ghosts = []; this.springs = [];
    this.goldSpots = []; this.extraLinks = []; this.zones = []; this.beats = []; this.locks = [];
    // validator v2 primitives (LEVEL_OVERHAUL.md §6.1) and the area graph's named entry points
    this.anchors = {}; this.vkeys = []; this.edges = []; this.toggles = {}; this.route = []; this.noGrabs = [];
  }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
  set(x, y, t) { if (this.inb(x, y)) { const i = y * this.W + x; this.tiles[i] = t; if (t === T.EMPTY) { this.hide[i] = 0; this.surf[i] = 0; } } }
  get(x, y) { return this.inb(x, y) ? this.tiles[y * this.W + x] : (y >= this.H ? T.EMPTY : T.HARD); }
  fill(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, t); }
  // band: { y0, y1 } limits ground fills and column clears to one horizontal band (the layered gen's lanes)
  ground(x0, x1, top, t) { const yb = this.band ? this.band.y1 + 1 : this.H; for (let x = x0; x <= x1; x++) for (let y = top; y < yb; y++) this.set(x, y, t || T.GROUND); }
  clearCol(x, y0, y1) { if (this.band) { y0 = Math.max(y0, this.band.y0); y1 = Math.min(y1, this.band.y1); } for (let y = y0; y <= y1; y++) this.set(x, y, T.EMPTY); }
  item(x, y, it) { this.contents[x + ',' + y] = it; }
  spawn(type, tx, ty, props) { const s = Object.assign({ type, x: tx * TS + TS / 2, y: (ty + 1) * TS }, props || {}); this.spawns.push(s); return s; }
  pickAt(x, y) { if (this.get(x, y) === T.EMPTY) this.set(x, y, T.PICK); }
  picksRow(x0, x1, y) { for (let x = x0; x <= x1; x++) this.pickAt(x, y); }
  picksArc(x0, x1, yb, h) { const n = x1 - x0; for (let x = x0; x <= x1; x++) { const k = n ? (x - x0) / n : 0.5; this.pickAt(x, Math.round(yb - Math.sin(k * Math.PI) * h)); } }
  picksCol(x, y0, y1) { for (let y = y0; y <= y1; y++) this.pickAt(x, y); }
  decorAt(kind, tx, groundTop, seed) { this.decor.push({ kind, x: tx * TS + TS / 2, y: groundTop * TS, seed: seed || 0 }); }
  gold(tx, ty, kind) { this.goldSpots.push({ tx, ty, kind }); }
  surfaceAt(x) { for (let y = 0; y < this.H; y++) { const t = this.get(x, y); if (SOLID[t] || t === T.SEMI) return y; } return -1; }
  // first tile from the top you could stand on (two clear tiles above), so ceilings are skipped
  standAt(x) { for (let y = 2; y < this.H; y++) { const t = this.get(x, y); if ((SOLID[t] || t === T.SEMI) && this.get(x, y - 1) === T.EMPTY && this.get(x, y - 2) === T.EMPTY) return y; } return -1; }
  setHide(x, y, v) { if (this.inb(x, y)) this.hide[y * this.W + x] = v; }
  setSurf(x, y, v) { if (this.inb(x, y)) this.surf[y * this.W + x] = v; }
  // a prop: art drawn by Decor[kind] with invisible collision tiles underneath
  // solid: 'body' fills the whole box with HARD; 'top' makes only the roof a one-way platform; 'none' is decor only
  prop(kind, x0, y0, w, h, solid, extra) {
    const d = Object.assign({ kind, x: (x0 + w / 2) * TS, y: (y0 + h) * TS, w: w * TS, h: h * TS, prop: true, seed: (x0 * 7 + y0 * 13) % 97 }, extra || {});
    this.decor.push(d);
    if (solid === 'body') { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { this.set(x, y, T.HARD); this.setHide(x, y, 1); } }
    else if (solid === 'top') { for (let x = x0; x < x0 + w; x++) { this.set(x, y0, T.SEMI); this.setHide(x, y0, 1); } }
    return d;
  }
  // hidden one-way platform: always there, only LSD shows it
  tripSemi(x0, x1, y) { for (let x = x0; x <= x1; x++) if (this.get(x, y) === T.EMPTY) { this.set(x, y, T.SEMI); this.setHide(x, y, 2); } }
  zone(tx, ty, tw, th, fx, fy, vmax, kind, extra) { const z = Object.assign({ x: tx * TS, y: ty * TS, w: tw * TS, h: th * TS, fx: fx || 0, fy: fy || 0, vmax: vmax || 0, kind: kind || 'updraft' }, extra || {}); this.zones.push(z); return z; }
  // beat / strobe / page blocks: one-way platforms that switch on and off in time
  beat(x0, x1, y, grp, kind) { for (let x = x0; x <= x1; x++) { this.set(x, y, T.SEMI); this.beats.push({ tx: x, ty: y, grp: grp || 0, kind: kind || 'beat' }); } }
  // a named entry point for doors ('area@name'): Brady's feet at the bottom of row ty (the same rule as spawn)
  anchor(name, tx, ty) { this.anchors[name] = { x: tx * TS + TS / 2, y: (ty + 1) * TS }; return this.anchors[name]; }
  // virtual key: the search holds `id` once a standing body overlaps any one (mode 'any') or all (mode 'all') of tiles
  vkey(id, tiles, mode) { const v = { id, tiles: tiles.map(t => [t[0], t[1]]), mode: mode || 'any' }; this.vkeys.push(v); return v; }
  // one-way edge: a standing body overlapping tile `from` can be at tile `to` next (toArea: another area's index)
  edge(from, to, toArea) { const e = { from: [from[0], from[1]], to: [to[0], to[1]] }; if (toArea != null) e.area = toArea; this.edges.push(e); return e; }
  // toggle group g (0-2): tile rects A are solid in state 0, B in state 1 (opts: auto, kind, zonesA, zonesB)
  toggle(g, tilesA, tilesB, opts) {
    const T0 = this.toggles[g] || (this.toggles[g] = { A: [], B: [], auto: false, kind: 'switch', switches: [] });
    const rects = r => r.length === 4 && typeof r[0] === 'number' ? [r] : r;
    for (const r of rects(tilesA || [])) T0.A.push(r.slice());
    for (const r of rects(tilesB || [])) T0.B.push(r.slice());
    if (opts) { if (opts.auto != null) T0.auto = !!opts.auto; if (opts.kind) T0.kind = opts.kind; for (const k in opts) if (!(k in T0)) T0[k] = opts[k]; }
    return T0;
  }
  switchAt(g, tx, ty) { (this.toggles[g] || this.toggle(g, [], [])).switches.push([tx, ty]); }
  // grabbers, pushers and tongues never act over these columns (pits)
  noGrab(x0, x1) { this.noGrabs.push([x0, x1]); }
  lock(tx, ty0, ty1, id, look) { const tiles = []; for (let y = ty0; y <= ty1; y++) { this.set(tx, y, T.HARD); tiles.push([tx, y]); } this.locks.push({ id, tiles }); this.spawn('lock', tx, ty1, { id, h: ty1 - ty0 + 1, look: look || 'door' }); }
  trim(W2) {
    if (W2 >= this.W) return;
    const cut = arr => { const nt = new Uint8Array(W2 * this.H); for (let y = 0; y < this.H; y++) for (let x = 0; x < W2; x++) nt[y * W2 + x] = arr[y * this.W + x]; return nt; };
    this.tiles = cut(this.tiles); this.hide = cut(this.hide); this.surf = cut(this.surf); this.W = W2;
  }
  build(props) {
    return Object.assign({ W: this.W, H: this.H, tiles: this.tiles, hide: this.hide, surf: this.surf, contents: this.contents, spawns: this.spawns, decor: this.decor,
      ghosts: this.ghosts, springs: this.springs, links: this.extraLinks, zones: this.zones, beats: this.beats, locks: this.locks,
      anchors: this.anchors, vkeys: this.vkeys, edges: this.edges, toggles: this.toggles, route: this.route, noGrabs: this.noGrabs }, props);
  }
}

/* ---------- main entry ---------- */
const LevelCache = {};
function getLevel(w, i) {
  const id = levelId(w, i);
  if (LevelCache[id]) return LevelCache[id];
  const lvl = generateLevel(w, i, (typeof LEVEL_SEEDS !== 'undefined' && LEVEL_SEEDS[id]) || 0);
  LevelCache[id] = lvl;
  return lvl;
}
// the per-level recipe, with defaults filled in from the world table
function levelDesign(w, i) {
  const W = WORLDS[w], id = levelId(w, i);
  const base = (typeof LEVEL_DESIGNS !== 'undefined' && LEVEL_DESIGNS[id]) || {};
  const kind = W.kinds ? W.kinds[i - 1] : 'level';
  const plan = W.plan[i - 1];
  const arch = base.arch || (kind === 'haunt' ? 'haunt' : kind === 'gift' ? 'gift' : kind === 'castle' || kind === 'fort' ? 'castle' : ({ ow: 'side', auto: 'auto', under: 'cave', sky: 'sky', water: 'water', tower: 'tower', castle: 'castle' }[plan] || 'side'));
  return Object.assign({ arch, kind, theme: W.theme, enemies: (W.pool || ['hippie']).map(e => [e, 1]), chunks: null }, base);
}
const ARCH_TYPE = { side: 'ow', auto: 'auto', cave: 'under', sky: 'sky', water: 'water', tower: 'tower', castle: 'castle', haunt: 'haunt', gift: 'gift', carrier: 'auto' };

function generateLevel(w, i, attempt) {
  // world-tour levels are built from their country's level scripts
  if (typeof Tour !== 'undefined' && Tour.levelSpec(w, i)) return TourBuild.generate(w, i, attempt);
  const W = WORLDS[w];
  const id = levelId(w, i);
  const rng = mulberry32(hashStr('sbw:' + id + ':' + attempt));
  const R = levelDesign(w, i);
  const d = levelDifficulty(w, i);
  const ctx = {
    rng, w, i, id, d, R, type: ARCH_TYPE[R.arch] || 'ow', world: W, theme: R.theme, gim: R.gim || [], pool: R.enemies,
    powerLeft: R.powers != null ? R.powers : 2 + (d < 0.3 ? 1 : 0), areas: [], bonusRooms: 0
  };
  const gen = ARCHETYPES[R.arch] || ARCHETYPES.side;
  const main = gen(ctx);
  // Slothy naps in hammocks in many levels; the recipe can ask for more than one
  const sloths = R.slothy === false ? 0 : (R.slothy === true ? 1 : (R.slothy || 0));
  if (sloths > 0 && !main.area.water) {
    placeHammock(main.area, main.start, 3);
    for (let k = 1; k < sloths; k++) placeHammock(main.area, null, Math.floor(main.area.W * (0.3 + k * 0.25)));
  }
  const level = {
    id, world: w, index: i, type: ctx.type, arch: R.arch, kind: R.kind, name: W.names[i - 1], worldName: W.name,
    areas: [main.area].concat(ctx.areas), start: main.start, time: main.time || 300, d,
    secret: secretFor(id), warps: null, hint: R.hint || null, design: R
  };
  return level;
}

/* ---------- shared helpers ---------- */
function placeHammock(A, start, fromTx) {
  const get = (x, y) => (x < 0 || y < 0 || x >= A.W || y >= A.H) ? T.GROUND : A.tiles[y * A.W + x];
  const sx = start ? Math.floor(start.x / TS) + fromTx : fromTx;
  for (let tx = sx; tx < Math.min(A.W - 4, sx + 40); tx++) {
    for (let y = 3; y < A.H; y++) {
      const t = get(tx, y);
      if (!(SOLID[t] || t === T.SEMI)) continue;
      if (get(tx, y - 1) !== T.EMPTY || get(tx, y - 2) !== T.EMPTY) break;
      if (A.hide && A.hide[y * A.W + tx]) break;
      if (SOLID[get(tx - 1, y)] && SOLID[get(tx + 1, y)] && get(tx - 1, y - 1) === T.EMPTY && get(tx + 1, y - 1) === T.EMPTY && get(tx, y - 3) === T.EMPTY && !(A.surf && A.surf[y * A.W + tx])) {
        if (A.spawns.some(s => Math.abs(s.x - (tx * TS + TS / 2)) < 2 * TS && Math.abs(s.y - y * TS) < 3 * TS)) break;
        A.spawns.push({ type: 'hammock', x: tx * TS + TS / 2, y: y * TS });
        return true;
      }
      break;
    }
  }
  return false;
}
function themeFor(ctx, variant) {
  if (variant === 'cave') return caveVariant(ctx.theme);
  if (variant === 'fort') return fortressVariant(ctx.theme);
  return ctx.theme;
}
function musicFor(ctx, fallback) {
  const R = ctx.R;
  if (R.music) return R.music;
  return 'land' + (ctx.w - 40);
}
// where each enemy kind likes to be placed
const ENEMY_PLACE = {
  driver: 'walk', hippie: 'walk', raver: 'walk', camplead: 'walk', greeter: 'walk', spinner: 'walk', pony: 'walk', influencer: 'stand',
  techbro: 'walk', crusty: 'walk', creeper: 'walk', dpw: 'walk', witch: 'fly', ledjelly: 'fly', devil: 'walk', thief: 'walk', poet: 'stand',
  glyph: 'walk', inkblot: 'walk', snapper: 'swim', jelly: 'swim'
};
function pickEnemy(ctx, avoid) {
  let pool = ctx.pool.filter(e => !avoid || avoid.indexOf(e[0]) < 0);
  if (!pool.length) pool = ctx.pool;
  return ctx.rng.weighted(pool);
}
function spawnEnemy(ctx, B, kind, tx, gy, props) {
  const place = ENEMY_PLACE[kind] || 'walk';
  if (place === 'fly') return B.spawn(kind, tx, gy - 4 - ctx.rng.int(0, 2), props);
  if (place === 'swim') return B.spawn(kind, tx, gy, props);
  return B.spawn(kind, tx, gy - 1, Object.assign({ dir: -1 }, props || {}));
}
function blockContent(ctx, B) {
  const r = ctx.rng();
  if (ctx.powerLeft > 0 && r < 0.22) { ctx.powerLeft--; return (ctx.R.bags && ctx.rng.chance(0.45)) ? 'bag:' + ctx.rng.pick(ctx.R.bags) : 'power'; }
  if (r < 0.32) return 'picks';
  if (r < 0.34 && ctx.d > 0.2) return 'eclipse';
  return 'pick';
}
function addDecor(ctx, B, x0, x1, gy, density) {
  const th = THEMES[B.themeKey || ctx.theme];
  const list = (ctx.R && ctx.R.decor) || (th && th.decor);
  if (!list) return;
  for (let x = x0; x <= x1; x++) {
    if (ctx.rng() < (density || 0.12) && B.get(x, gy - 1) === T.EMPTY && SOLID[B.get(x, gy)] && !B.hide[gy * B.W + x]) {
      B.decorAt(ctx.rng.pick(list), x, gy, ctx.rng.int(0, 99));
      x += 2;
    }
  }
}
function placeEnemiesOnFlat(ctx, B, x0, x1, gy, n, avoid) {
  const len = x1 - x0 + 1;
  if (len < 3) return;
  const used = new Set();
  for (let k = 0; k < n; k++) {
    const tx = x0 + 1 + ctx.rng.int(0, Math.max(0, len - 3));
    if (used.has(tx) || used.has(tx - 1) || used.has(tx + 1)) continue;
    used.add(tx);
    spawnEnemy(ctx, B, pickEnemy(ctx, avoid), tx, gy);
  }
}

/* ---------- strip generator: side-scrollers, auto-scrollers, caves and sky levels ---------- */
// mode: 'side' | 'auto' | 'cave' | 'sky'
function genStrip(ctx, mode) {
  const { rng, d, R } = ctx;
  const cave = mode === 'cave', sky = mode === 'sky', auto = mode === 'auto';
  const H = R.H || (cave ? 21 : 18), GY = R.GY || (cave ? 17 : sky ? 12 : 14);
  const len = Math.round((R.len || (cave ? 135 : 150)) + d * (R.lenD != null ? R.lenD : 50) + rng.int(0, 20)) + (auto ? 20 : 0);
  const B = new AreaBuilder(len + 90, H);
  const th = cave ? (R.caveTheme || themeFor(ctx, 'cave')) : ctx.theme;
  B.themeKey = th;
  const gyMin = R.gyMin || (cave ? 13 : sky ? 7 : 9), gyMax = R.gyMax || (cave ? 17 : sky ? 13 : 15);
  const st = { x: 0, gy: GY, ctx, B, rng, d, mode, sky, cave, auto, H, gyMin, gyMax, R };
  // the floor under a stretch: solid to the bottom, or a floating island in the sky
  st.floor = (x0, x1, gy) => { gy = gy == null ? st.gy : gy; if (sky) B.fill(x0, gy, x1, Math.min(H - 1, gy + 2), T.GROUND); else B.ground(x0, x1, gy); };
  st.floor(0, 11, GY);
  addDecor(ctx, B, 0, 10, GY, 0.2);
  if (ctx.i === 1 || R.oneup) { B.set(6, GY - 4, T.HIDDEN); B.item(6, GY - 4, 'oneup'); }
  st.x = 12;
  for (const name of (R.open || [])) st.x = runChunk(st, name);
  const table = R.chunks || [['flat', 3], ['gap', 3], ['blocks', 3], ['enemies', 2], ['step', 2], ['floating', 1.5]];
  const mid = Math.floor(len * 0.5);
  let checkpointPlaced = R.cp === false, secretPlaced = false, bonusPlaced = false;
  const secret = secretFor(ctx.id);
  const secretStyle = secret ? (R.secretStyle || 'portal') : null;
  const wantBonus = !secret && R.bonus !== false && (R.bonus === true || rng.chance(0.5));
  const sets = (R.set || []).map(s => Object.assign({ done: false }, s));
  let n = 0;
  while (st.x < len - 34) {
    const brMin = R.breather ? R.breather[0] : 1, brMax = R.breather ? R.breather[1] : 3;
    const br = rng.int(brMin, brMax);
    st.floor(st.x, st.x + br - 1); st.x += br;
    if (!checkpointPlaced && st.x > mid) {
      st.floor(st.x, st.x + 4); B.spawn('checkpoint', st.x + 2, st.gy - 1);
      st.x += 5; checkpointPlaced = true; continue;
    }
    const due = sets.find(s => !s.done && st.x > s.at * len);
    if (due) { due.done = true; st.x = runChunk(st, due.chunk, due.opts); n++; continue; }
    if (secret && !secretPlaced && st.x > len * (R.secretAt || 0.3)) {
      st.x = placeSecret(st, secret, secretStyle); secretPlaced = true; continue;
    }
    if (wantBonus && !bonusPlaced && st.x > len * 0.22 && rng.chance(0.5)) {
      st.x = chunkSecretPortal(st, null); bonusPlaced = true; continue;
    }
    const kind = rng.weighted(table);
    st.opening = n === 0 && d < 0.12;
    st.x = runChunk(st, kind);
    st.opening = false;
    st.gy = clamp(st.gy, gyMin, gyMax);
    n++;
  }
  for (const s of sets) if (!s.done) st.x = runChunk(st, s.chunk, s.opts);
  if (secret && !secretPlaced) st.x = placeSecret(st, secret, secretStyle);
  // the end: stairs up then a runway to the Encore Gate
  const endX = R.finale === 'gift' ? chunkFinaleGift(st) : R.finale === 'flat' ? chunkFinaleFlat(st) : chunkFinale(st);
  if (cave) for (let cx = 0; cx < endX; cx++) { B.fill(cx, 0, cx, R.ceil || 4, T.GROUND); }
  B.trim(endX);
  resolvePendingReturns(st);
  pickGold(ctx, B);
  const area = B.build({
    theme: th, music: musicFor(ctx), water: false, dark: !!R.dark, autoscroll: auto ? (R.scroll || (2.7 + d * 1.2)) : 0,
    wind: R.wind || null, dust: R.dust || 0, whiteout: !!R.whiteout, beat: R.bpm ? { bpm: R.bpm } : null, sky: sky,
    gravity: R.gravity || 1, camMinY: 0, chasers: R.chasers || null, sunrise: !!R.sunrise, lsdHint: !!R.trip, liquid: R.liquid || null
  });
  return { area, start: { area: 0, x: 6 * TS + TS / 2, y: GY * TS }, time: auto ? 400 : (R.time || 300) };
}
function runChunk(st, name, opts) {
  const fn = CH[name];
  if (!fn) { console.warn('unknown chunk', name); return CH.flat(st); }
  return fn(st, opts || {});
}
function placeSecret(st, secret, style) {
  if (style === 'key') return CH.secretKey(st, {});
  if (style === 'high') return CH.secretHigh(st, {});
  if (style === 'fake') return CH.secretFake(st, {});
  return chunkSecretPortal(st, secret);
}

// portal (on a high perch) to a bonus room; return portal lands later in the level
function chunkSecretPortal(st, secret) {
  const { B, ctx } = st; const rng = ctx.rng;
  st.floor(st.x, st.x + 7);
  const h = rng.int(3, 4);
  const px = st.x + 3;
  B.fill(px, st.gy - h, px + 1, st.sky ? st.gy + 2 : B.H - 1, T.PILLAR);
  const roomIdx = 1 + ctx.areas.length;
  const portal = B.spawn('portal', px, st.gy - h - 1, { kind: secret && secret.kind === 'secretExit' ? 'secret' : 'normal', target: { area: roomIdx, x: 8 * TS + TS / 2, y: 11 * TS } });
  portal.x += TS / 2; // centred on the 2-wide pillar
  const room = makeBonusRoom(ctx, roomIdx, secret);
  ctx.areas.push(room.area);
  st.pendingReturn = st.pendingReturn || [];
  st.pendingReturn.push({ room: room, minX: st.x + 22 });
  return st.x + 8;
}

function makeBonusRoom(ctx, idx, secret) {
  const rng = ctx.rng;
  // wide enough that the entry and exit sit clear of the on-screen controls
  const W = 36, H = 14, O = 5;
  const B = new AreaBuilder(W, H);
  const th = ctx.R.bonusTheme || themeFor(ctx, 'cave');
  B.themeKey = th;
  B.fill(0, 0, W - 1, 1, T.GROUND);
  B.fill(0, 0, 1, H - 1, T.GROUND); B.fill(W - 2, 0, W - 1, H - 1, T.GROUND);
  B.ground(0, W - 1, 11);
  for (let r = 0; r < 3; r++) B.picksRow(O + 4 + r, W - O - 6 - r, 6 + r * 2);
  const lx = W - O - 9;
  B.fill(lx, 7, lx + 3, 7, T.SEMI);
  B.set(O + 8, 7, T.QBLOCK); B.item(O + 8, 7, ctx.powerLeft > 0 ? (ctx.R.bags ? 'bag:' + rng.pick(ctx.R.bags) : 'power') : 'picks');
  B.set(O + 12, 7, T.QBRICK); B.item(O + 12, 7, 'picks');
  if (rng.chance(0.6)) B.spawn('sign', O + 3, 10, { text: rng.pick(SIGN_TEXTS) });
  const ret = B.spawn('portal', W - O - 3, 10, { kind: 'normal', target: null });
  B.decorAt('torch', O + 1, 11); B.decorAt('torch', W - O - 1, 11);
  let secretGate = null;
  if (secret && secret.kind === 'secretExit') {
    // a hidden second chamber reached through the right wall
    B.fill(W - 2, 9, W - 1, 10, T.FAKE);
    secretGate = true;
  }
  const area = B.build({ theme: th, music: 'underground', water: false, dark: false, autoscroll: 0, bonus: true, gravity: 1, goldX: (lx + 2) * TS + TS / 2, goldY: 6 * TS, entryX: (O + 3) * TS + TS / 2 });
  if (secretGate) {
    const W2 = W + 14;
    const ext = (arr, fillFn) => { const nt = new Uint8Array(W2 * H); for (let y = 0; y < H; y++) for (let x = 0; x < W2; x++) nt[y * W2 + x] = x < W ? arr[y * W + x] : fillFn(x, y); return nt; };
    area.tiles = ext(area.tiles, (x, y) => (y < 2 || y >= 11 || x >= W2 - 2 ? T.GROUND : T.EMPTY));
    area.hide = ext(area.hide, () => 0); area.surf = ext(area.surf, () => 0);
    area.W = W2;
    area.spawns.push({ type: 'gate', x: (W + 6) * TS, y: 11 * TS, secret: true, secretWorld: secret.world });
    area.spawns.push({ type: 'sign', x: (W + 1) * TS + TS / 2, y: 11 * TS, text: 'Secret exit! A hidden path opens on the map.' });
  }
  return { area, ret, idx };
}

function resolvePendingReturns(st) {
  if (!st.pendingReturn) return;
  const B = st.B;
  for (const pr of st.pendingReturn) {
    let tx = -1, sy = -1;
    for (let x = Math.min(pr.minX, B.W - 20); x < B.W - 12; x++) {
      const s = B.standAt(x);
      if (s > 2 && SOLID[B.get(x, s)] && !B.hide[s * B.W + x] && !B.surf[s * B.W + x] && B.get(x, s - 1) === T.EMPTY && B.get(x, s - 2) === T.EMPTY && B.get(x + 1, s) !== T.EMPTY && SOLID[B.get(x - 1, s)] && B.get(x, s - 3) !== T.SPIKES) { tx = x; sy = s; break; }
    }
    if (tx < 0) { tx = 4; sy = B.standAt(4); }
    pr.room.ret.target = { area: 0, x: tx * TS + TS / 2, y: sy * TS };
  }
}

function chunkFinale(st) {
  const { B, ctx } = st;
  let x = st.x;
  st.floor(x, x + 3); x += 4;
  const n = 4;
  for (let i = 0; i < n; i++, x++) { st.floor(x, x); B.fill(x, st.gy - 1 - i, x, st.gy - 1, T.HARD); }
  st.floor(x, x); B.fill(x, st.gy - n, x, st.gy - 1, T.HARD); x++;
  B.gold(x - 1, st.gy - n - 5, 'high');
  st.floor(x, x + 16);
  if (st.sky) B.fill(x, st.gy + 3, x + 16, Math.min(B.H - 1, st.gy + 4), T.GROUND);
  B.spawn('gate', x + 7, st.gy - 1, {});
  addDecor(ctx, B, x + 11, x + 15, st.gy, 0.3);
  return x + 17;
}
function chunkFinaleFlat(st) {
  const { B, ctx } = st;
  const x = st.x;
  st.floor(x, x + 19);
  B.spawn('gate', x + 11, st.gy - 1, {});
  B.gold(x + 4, st.gy - 5, 'high');
  addDecor(ctx, B, x + 15, x + 18, st.gy, 0.3);
  return x + 20;
}

function pickGold(ctx, B) {
  const rng = ctx.rng;
  const okSpot = s => s.tx >= 2 && s.tx <= B.W - 3 && s.ty >= 1 && !SOLID[B.get(s.tx, s.ty)] && B.get(s.tx, s.ty) !== T.LAVA && B.get(s.tx, s.ty) !== T.SPIKES;
  const spots = B.goldSpots.filter(okSpot);
  const chosen = [];
  const bonusSpots = [];
  ctx.areas.forEach((a, k) => { if (a.bonus) bonusSpots.push({ area: k + 1, a }); });
  const byKind = k => spots.filter(s => s.kind === k);
  const take = list => { if (!list.length) return null; const s = list[rng.int(0, list.length - 1)]; spots.splice(spots.indexOf(s), 1); return s; };
  let idx = 0;
  if (bonusSpots.length && !ctx.R.noBonusGold) {
    const bs = bonusSpots[0];
    bs.a.spawns.push({ type: 'gold', idx: idx++, x: bs.a.goldX, y: bs.a.goldY, kind: 'bonus' });
  }
  const need = () => 3 - idx - chosen.length;
  // spots a chunk insists on (a photo is the whole point of that set piece)
  for (const s of byKind('must')) { if (need() <= 0) break; spots.splice(spots.indexOf(s), 1); chosen.push(s); }
  for (const k of ['hidden', 'risky', 'high']) {
    if (need() <= 0) break;
    const s = take(byKind(k));
    if (s) chosen.push(s);
  }
  // spread them out: avoid two photos right next to each other
  while (need() > 0 && spots.length) {
    const far = spots.filter(s => !chosen.some(c => Math.abs(c.tx - s.tx) < 12));
    chosen.push(take(far.length ? far : spots));
  }
  let fx = 24 + rng.int(0, 10);
  while (need() > 0 && fx < B.W - 12) {
    let floor = -1;
    for (let y = B.H - 1; y > 2; y--) { if (SOLID[B.get(fx, y)] && !SOLID[B.get(fx, y - 1)]) { floor = y; break; } }
    if (floor > 6) {
      let clear = true;
      for (let y = floor - 5; y < floor; y++) if (SOLID[B.get(fx, y)] || B.get(fx, y) === T.SEMI) clear = false;
      if (clear && !chosen.some(c => Math.abs(c.tx - fx) < 6)) chosen.push({ tx: fx, ty: floor - 4, kind: 'fallback' });
    }
    fx += 29;
  }
  chosen.sort((a, b) => a.tx - b.tx);
  for (const s of chosen) {
    if (B.get(s.tx, s.ty) === T.PICK) B.set(s.tx, s.ty, T.EMPTY);
    B.spawn('gold', s.tx, s.ty, { idx: idx++, kind: s.kind });
  }
}

/* ---------- underwater ---------- */
function genWater(ctx) {
  const { rng, d, R } = ctx;
  const H = 16, FLOOR = 13;
  const len = Math.round((R.len || 130) + d * 40 + rng.int(0, 20));
  const B = new AreaBuilder(len + 30, H);
  B.themeKey = ctx.theme;
  B.fill(0, 0, len + 29, 1, T.GROUND);
  B.ground(0, len + 29, FLOOR);
  let x = 12;
  let cp = false;
  const sea = R.sea || ['snapper', 'jelly'];
  while (x < len - 20) {
    const r = rng();
    if (!cp && x > len / 2) { B.spawn('checkpoint', x + 1, FLOOR - 1); x += 6; cp = true; continue; }
    if (r < 0.22) {
      // mineral ridge with a vent of bubbles rising off it
      const h = rng.int(2, 6), w = rng.int(2, 5);
      B.fill(x, FLOOR - h, x + w - 1, FLOOR, T.GROUND);
      if (rng.chance(0.35)) for (let q = 0; q < w; q++) B.set(x + q, FLOOR - h - 1, T.SPIKES);
      B.picksRow(x, x + w - 1, FLOOR - h - 3);
      x += w + rng.int(3, 6);
    } else if (r < 0.4) {
      const h = rng.int(2, 6), w = rng.int(2, 4);
      B.fill(x, 2, x + w - 1, 1 + h, T.GROUND);
      B.picksRow(x, x + w - 1, 3 + h);
      x += w + rng.int(3, 6);
    } else if (r < 0.55) {
      // narrow tunnel between two rock walls
      const gapTop = rng.int(4, 8), gapH = 4;
      B.fill(x, 2, x + 1, gapTop - 1, T.GROUND);
      B.fill(x, gapTop + gapH, x + 1, FLOOR, T.GROUND);
      B.picksRow(x, x + 1, gapTop + 1);
      if (rng.chance(0.4)) B.gold(x + 1, gapTop + gapH + 1 < FLOOR - 1 ? FLOOR - 1 : gapTop + 2, 'risky');
      x += 2 + rng.int(4, 7);
    } else if (r < 0.72 && R.currents) {
      // a warm current: drifts Brady sideways, with a bubble column to ride up
      const L = rng.int(8, 12), dir = rng.chance(0.65) ? 1 : -1;
      B.zone(x, 3, L, 8, dir * 2.2 * TS, 0, 0, 'current');
      const cx = x + rng.int(2, L - 3);
      B.zone(cx, 2, 2, FLOOR - 2, 0, -14 * TS, 4.5 * TS, 'bubbles');
      B.spawn('vent', cx, FLOOR - 1, { look: 'bubbles', w: 2 });
      B.picksArc(x + 1, x + L - 2, 7, 3);
      x += L;
    } else {
      const L = rng.int(6, 10);
      const n = rng.int(1, 2 + Math.round(d * 2));
      for (let k = 0; k < n; k++) B.spawn(rng.pick(sea), x + rng.int(1, L - 2), rng.int(4, 10), { range: rng.int(2, 4) });
      B.picksArc(x + 1, x + L - 2, 9, 3);
      if (rng.chance(0.5)) B.decorAt(rng.pick(['reeds', 'mineralcone', 'rubberduck', 'steamvent']), x + 2, FLOOR);
      x += L;
    }
    for (let k = 0; k < 2; k++) if (rng.chance(0.5)) B.decorAt(rng.pick(['reeds', 'mineralcone', 'steamvent']), x - k * 3 - 1, FLOOR, rng.int(0, 99));
  }
  B.gold(Math.floor(len * 0.3), 2, 'risky');
  B.gold(Math.floor(len * 0.55), FLOOR - 1, 'hidden');
  B.gold(Math.floor(len * 0.8), 2, 'high');
  for (const g of B.goldSpots) { B.set(g.tx, g.ty, T.EMPTY); B.set(g.tx, g.ty + (g.ty < 5 ? 1 : -1), T.EMPTY); }
  B.fill(x, 2, x + 18, FLOOR - 1, T.EMPTY);
  B.ground(x, x + 18, FLOOR);
  B.spawn('gate', x + 10, FLOOR - 1, {});
  B.trim(x + 19);
  B.fill(B.W - 1, 0, B.W - 1, H - 1, T.GROUND);
  pickGold(ctx, B);
  const area = B.build({ theme: ctx.theme, music: musicFor(ctx), water: true, dark: !!R.dark, autoscroll: 0, gravity: 1 });
  return { area, start: { area: 0, x: 6 * TS + TS / 2, y: FLOOR * TS }, time: 300 };
}

/* ---------- vertical tower (optionally with a fortress boss on the roof) ---------- */
function genTower(ctx) {
  const { rng, d, R } = ctx;
  const W = 22, H = Math.round((R.towerH || 70) + d * 24) + (R.boss ? 8 : 0);
  const B = new AreaBuilder(W, H);
  B.themeKey = ctx.theme;
  B.fill(0, 0, 1, H - 1, T.GROUND); B.fill(W - 2, 0, W - 1, H - 1, T.GROUND);
  B.ground(0, W - 1, H - 3);
  let y = H - 3;
  let x0 = 7, pw = 6, side = 1;
  let cp = false;
  let steps = 0;
  const midY = Math.floor(H / 2);
  const topLimit = R.boss ? 22 : 12;
  while (y > topLimit) {
    const dy = rng.int(3, 4);
    const ny = y - dy;
    const w = rng.int(3, 6);
    const maxGap = dy === 4 ? 1 : 2;
    const g = rng.int(-1, maxGap);
    let nx = side > 0 ? x0 + pw + g : x0 - g - w;
    if (nx < 2 || nx + w > W - 2) { side = -side; nx = side > 0 ? x0 + pw + g : x0 - g - w; }
    nx = clamp(nx, 2, W - 2 - w);
    const kind = rng();
    const lift = R.lifts && steps % 4 === 2 && steps > 0;
    if (lift) {
      // a lift (teacup / forklift / saucer) carries Brady up the next stretch
      const rise = rng.int(5, 7);
      const lx = clamp(nx, 3, W - 6);
      B.spawn('mplat', lx, ny + 1, { pw: 3, ax: 0, ay: -rise * TS, speed: 1.6 + d, skin: R.lifts });
      for (let k = 0; k <= rise; k++) for (let q = 0; q < 3; q++) B.ghosts.push([lx - 1 + q, ny + 2 - k]);
      const ty2 = ny - rise + 1;
      const lw = 4, lx2 = lx + 3 <= W - 2 - lw ? lx + 3 : lx - lw - 1;
      for (let q = 0; q < lw; q++) B.set(lx2 + q, ty2, T.SEMI);
      B.picksRow(lx2, lx2 + lw - 1, ty2 - 2);
      x0 = lx2; pw = lw; y = ty2; steps++;
      side = lx2 > W / 2 ? -1 : 1;
      continue;
    }
    if (R.orbit && steps % 5 === 3) {
      // a saucer ring orbiting a hub: ride it up and around
      const cx = Math.floor(W / 2), cy = ny - 1, rad = 3;
      B.spawn('mplat', cx - 1, cy, { pw: 3, orbit: rad * TS, speed: 0.9 + d * 0.5, skin: 'saucer' });
      for (let a = 0; a < 16; a++) { const ang = a / 16 * TAU; const gx = Math.round(cx + Math.cos(ang) * rad), gy2 = Math.round(cy + 1 + Math.sin(ang) * rad); for (let q = -1; q <= 1; q++) B.ghosts.push([gx + q, gy2]); }
      B.set(cx, cy + 1, T.USED);
      const ty2 = cy - rad - 1;
      const lw = 5, lx2 = rng.chance(0.5) ? 3 : W - 3 - lw;
      for (let q = 0; q < lw; q++) B.set(lx2 + q, ty2, T.SEMI);
      x0 = lx2; pw = lw; y = ty2; steps++; side = lx2 > W / 2 ? -1 : 1;
      continue;
    }
    if (kind < 0.62) for (let q = 0; q < w; q++) B.set(nx + q, ny, T.SEMI);
    else if (kind < 0.76) { for (let q = 0; q < w; q++) B.set(nx + q, ny, T.BRICK); const qx = nx + rng.int(0, w - 1); B.set(qx, ny, T.QBLOCK); B.item(qx, ny, blockContent(ctx, B)); }
    else if (kind < 0.86 && R.teeter) { B.spawn('fplat', nx + 1, ny - 1, { pw: Math.min(3, w), skin: R.teeter }); for (let q = 0; q < Math.min(3, w); q++) B.ghosts.push([nx + q, ny]); }
    else if (kind < 0.92 && R.spiky) { for (let q = 0; q < w; q++) B.set(nx + q, ny, T.HARD); if (w >= 5) { B.set(nx + 2, ny - 1, T.SPIKES); } }
    else for (let q = 0; q < w; q++) B.set(nx + q, ny, T.HARD);
    if (w >= 4 && rng.chance(0.35 + d * 0.2)) spawnEnemy(ctx, B, pickEnemy(ctx, ['witch', 'influencer', 'poet']), nx + 1, ny, { edgeTurn: true });
    if (rng.chance(0.5)) B.picksRow(nx, nx + w - 1, ny - 2);
    if (rng.chance(0.12 + d * 0.12) && ctx.pool.some(e => ENEMY_PLACE[e[0]] === 'fly')) B.spawn(ctx.pool.find(e => ENEMY_PLACE[e[0]] === 'fly')[0], rng.int(4, W - 5), ny - 2);
    if (steps % 5 === 1) B.gold(nx + Math.floor(w / 2), ny - 4, 'high');
    if (!cp && ny < midY) { cp = true; B.spawn('checkpoint', nx + Math.floor(w / 2), ny - 1); }
    if (steps % 6 === 3) {
      const gx = side > 0 ? 2 : W - 4;
      B.set(gx, ny - 1, T.HARD); B.set(gx + 1, ny - 1, T.HARD);
      B.gold(gx + (side > 0 ? 0 : 1), ny - 3, 'risky');
    }
    x0 = nx; pw = w; y = ny; steps++;
    if (nx <= 4) side = 1; else if (nx + w >= W - 5) side = -1; else if (rng.chance(0.3)) side = -side;
  }
  const top = y - 3;
  if (R.boss) {
    // the roof: a boss arena with the exit door on the right
    B.fill(2, top, W - 3, top, T.HARD);
    const ox = clamp(x0 + 1, 3, W - 5);
    B.set(ox, top, T.SEMI); B.set(ox + 1, top, T.SEMI); B.set(ox - 1, top, T.SEMI);
    const ay = top - 1;           // arena floor row: 'top' itself
    for (let yy = 0; yy < top - 7; yy++) B.fill(2, yy, W - 3, yy, T.GROUND);
    const doorX = W - 6;
    B.fill(doorX, top - 6, doorX, top - 1, T.HARD);
    B.spawn('boss', doorX - 5, ay, { world: ctx.w, style: R.boss, arenaX0: 3, arenaX1: doorX, doorX, mid: true });
    B.spawn('gate', W - 4, ay, {});
    for (let q = 0; q < 3; q++) B.set(5 + q, top - 4, T.SEMI);
  } else {
    B.fill(2, top, W - 3, top, T.HARD);
    const ox = clamp(x0 + 1, 3, W - 5);
    B.set(ox, top, T.SEMI); B.set(ox + 1, top, T.SEMI); B.set(ox - 1, top, T.SEMI);
    B.spawn('gate', Math.floor(W / 2), top - 1, {});
  }
  pickGold(ctx, B);
  const rising = R.rising ? { delay: 4, speed: (R.rising.speed || 0.8) + d * 0.3, look: R.rising.look || 'lava' } : null;
  const area = B.build({ theme: ctx.theme, music: musicFor(ctx), water: false, dark: !!R.dark, autoscroll: 0, tower: true, risingLava: rising, gravity: 1, liquid: R.liquid || (rising && rising.look) || null });
  return { area, start: { area: 0, x: 5 * TS, y: (H - 3) * TS }, time: 400 };
}

/* ---------- castles and fortresses: a themed gauntlet, then the boss ---------- */
function genCastle(ctx) {
  const { rng, d, R } = ctx;
  const H = R.H || 18, GY = H - 4;
  const len = Math.round((R.len || 100) + d * 40 + rng.int(0, 20));
  const B = new AreaBuilder(len + 120, H);
  const th = R.castleTheme || themeFor(ctx, 'fort');
  B.themeKey = th;
  const st = { x: 0, gy: GY, ctx, B, rng, d, mode: 'side', H, gyMin: GY - 2, gyMax: GY + 1, R };
  st.floor = (x0, x1, gy) => B.ground(x0, x1, gy == null ? st.gy : gy);
  B.ground(0, 11, GY);
  st.x = 12;
  const table = R.chunks || [['flat', 1], ['gap', 2], ['spikes', 1.5], ['enemies', 1.5], ['blocks', 1]];
  let cp = false;
  for (const name of (R.open || [])) st.x = runChunk(st, name);
  const secret = secretFor(ctx.id);
  while (st.x < len) {
    const br = rng.int(1, 2); B.ground(st.x, st.x + br - 1, st.gy); st.x += br;
    if (!cp && st.x > len / 2) { B.ground(st.x, st.x + 4, st.gy); B.spawn('checkpoint', st.x + 2, st.gy - 1); st.x += 5; cp = true; continue; }
    const kind = rng.weighted(table);
    st.x = runChunk(st, kind);
    st.gy = clamp(st.gy, GY - 2, GY + 1);
  }
  let x = st.x;
  B.ground(x, x + 3, st.gy); x += 4;
  if (st.gy !== GY) { B.ground(x, x + 1, GY); x += 2; }
  const endX = buildArena(st, x, GY, R.arena || 'hall', secret);
  for (let cx = 0; cx < endX; cx++) B.fill(cx, 0, cx, 2, T.GROUND);
  B.trim(endX);
  resolvePendingReturns(st);
  pickGold(ctx, B);
  const area = B.build({ theme: th, music: R.music || 'castle', water: false, dark: !!R.dark || !!(THEMES[th] || {}).dark, autoscroll: 0, castle: true, gravity: 1, beat: R.bpm ? { bpm: R.bpm } : null, wind: R.wind || null, liquid: R.liquid || null });
  return { area, start: { area: 0, x: 6 * TS + TS / 2, y: GY * TS }, time: 400 };
}
// boss arenas: the floor plan suits each boss
function buildArena(st, x, GY, layout, secret) {
  const { B, ctx, R } = st;
  const arenaX0 = x, arenaW = R.arenaW || (layout === 'man' ? 30 : 26);
  B.ground(arenaX0, arenaX0 + arenaW - 1, GY);
  if (layout === 'hall') {
    for (let q = 0; q < 3; q++) { B.set(arenaX0 + 4 + q, GY - 4, T.SEMI); B.set(arenaX0 + arenaW - 7 + q, GY - 4, T.SEMI); }
  } else if (layout === 'pool') {
    // hot water channels between three islands
    for (const [a, b] of [[6, 8], [17, 19]]) for (let xx = arenaX0 + a; xx <= arenaX0 + b; xx++) { B.clearCol(xx, GY, GY + 1); B.fill(xx, GY + 1, xx, GY + 2, T.WATER); B.fill(xx, GY + 3, xx, B.H - 1, T.GROUND); }
    for (let q = 0; q < 3; q++) { B.set(arenaX0 + 6 + q, GY - 4, T.SEMI); B.set(arenaX0 + 17 + q, GY - 4, T.SEMI); }
  } else if (layout === 'stage') {
    // the DJ booth riser on the right, stair blocks on the left
    for (let q = 0; q < 4; q++) B.set(arenaX0 + 3 + q, GY - 3, T.SEMI);
    for (let q = 0; q < 4; q++) B.set(arenaX0 + 10 + q, GY - 5, T.SEMI);
    for (let q = 0; q < 6; q++) B.set(arenaX0 + arenaW - 9 + q, GY - 4, T.SEMI);
  } else if (layout === 'yard') {
    // stacked crates to climb on, a conveyor floor in the middle
    B.fill(arenaX0 + 3, GY - 2, arenaX0 + 4, GY - 1, T.HARD);
    B.fill(arenaX0 + arenaW - 5, GY - 2, arenaX0 + arenaW - 4, GY - 1, T.HARD);
    for (let q = 9; q < arenaW - 9; q++) B.set(arenaX0 + q, GY, T.CONV_L);
    for (let q = 0; q < 3; q++) B.set(arenaX0 + 11 + q, GY - 5, T.SEMI);
  } else if (layout === 'man') {
    // the pavilion floor, with plywood cover walls to hide behind from the neon flash
    for (const cx of [5, 13, 21]) { B.fill(arenaX0 + cx, GY - 3, arenaX0 + cx + 1, GY - 1, T.HARD); B.prop('coverwall', arenaX0 + cx, GY - 3, 2, 3, 'none'); }
    for (let q = 0; q < 3; q++) { B.set(arenaX0 + 9 + q, GY - 5, T.SEMI); B.set(arenaX0 + 17 + q, GY - 5, T.SEMI); }
  } else if (layout === 'cover') {
    for (const cx of [5, 13, 20]) { B.fill(arenaX0 + cx, GY - 3, arenaX0 + cx + 1, GY - 1, T.HARD); B.prop('coverwall', arenaX0 + cx, GY - 3, 2, 3, 'none'); }
    for (let q = 0; q < 3; q++) B.set(arenaX0 + 9 + q, GY - 5, T.SEMI);
  } else if (layout === 'pages') {
    for (let q = 0; q < 3; q++) { B.set(arenaX0 + 4 + q, GY - 4, T.SEMI); B.set(arenaX0 + 12 + q, GY - 6, T.SEMI); B.set(arenaX0 + arenaW - 7 + q, GY - 4, T.SEMI); }
  }
  const doorX = arenaX0 + arenaW;
  B.ground(doorX, doorX + 14, GY);
  B.fill(doorX, 3, doorX, GY - 1, T.HARD);
  const style = R.boss || 'greeter';
  B.spawn('boss', arenaX0 + arenaW - 7, GY - 1, { world: ctx.w, style, arenaX0, arenaX1: doorX, doorX });
  B.spawn('gate', doorX + 8, GY - 1, {});
  let endX = doorX + 15;
  if (secret) {
    // a hidden way out above the exit: two hops up, then a fake panel hides a ledge with the secret gate
    const sx = doorX + 2;
    for (let q = 0; q < 4; q++) { B.set(sx + q, GY - 3, T.SEMI); B.set(sx + 4 + q, GY - 6, T.SEMI); }
    B.fill(sx + 8, 3, sx + 9, GY - 10, T.FAKE);
    B.fill(sx + 8, GY - 9, sx + 22, GY - 9, T.GROUND);
    B.ground(sx + 8, sx + 22, GY);
    B.fill(sx + 23, 0, sx + 24, B.H - 1, T.GROUND);
    B.spawn('gate', sx + 16, GY - 10, { secret: true, secretWorld: 0 });
    B.spawn('sign', sx + 11, GY - 10, { text: 'The super-secret exit. Somewhere, a page turns...' });
    endX = Math.max(endX, sx + 25);
  }
  return endX;
}

const ARCHETYPES = {
  side: ctx => genStrip(ctx, 'side'),
  auto: ctx => genStrip(ctx, 'auto'),
  cave: ctx => genStrip(ctx, 'cave'),
  sky: ctx => genStrip(ctx, 'sky'),
  water: genWater,
  tower: genTower,
  castle: genCastle,
  haunt: ctx => genHaunt(ctx),
  gift: ctx => genGift(ctx),
  carrier: ctx => genCarrier(ctx)
};
