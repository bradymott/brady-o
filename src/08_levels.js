/* ============================================================
   Worlds, level plans and the level generator
   ============================================================ */
const WORLDS = {
  1: { name: 'Packing Night', theme: 'suburbs', pool: ['glump', 'glump', 'rollo', 'flapper'], plan: ['ow', 'under', 'ow', 'ow', 'sky', 'ow', 'auto', 'under', 'ow', 'castle'],
    names: ['Loading the Car', 'Garage Gear Hunt', 'Neighborhood Night Run', 'Rooftop Shortcut', 'Satellite Dish Skyway', 'Sprinkler Sprint', 'Moving Truck Parade', 'Basement Costume Box', 'Last Gas Before the Desert', 'Raccoon in the Garage'] },
  2: { name: 'Reno Supply Run', theme: 'neon', pool: ['glump', 'rollo', 'boomer', 'flapper', 'spiker'], plan: ['ow', 'ow', 'under', 'auto', 'ow', 'sky', 'tower', 'ow', 'auto', 'castle'], gim: ['conveyor', 'turret', 'moving'],
    names: ['Neon Arrival', 'Slot Machine Alley', 'Mega-Mart Aisles', 'Shopping Cart Rampage', 'Buffet Line Brawl', 'Casino Rooftops', 'High-Roller Tower', 'Pawn Shop Pandemonium', 'Midnight Supply Dash', 'The Cart Lord'] },
  3: { name: 'Highway 447', theme: 'highway', pool: ['glump', 'hopper', 'spiker', 'flapper', 'rollo'], plan: ['ow', 'ow', 'sky', 'under', 'ow', 'tower', 'ow', 'auto', 'sky', 'castle'], gim: ['falling', 'spring', 'floating', 'wind'],
    names: ['Leaving Reno', 'Sagebrush Shoulder', 'Telephone Pole Hop', 'Old Mine Shortcut', 'Gas Station Gauntlet', 'Water Tower Climb', 'Roadside Rest Stop', 'Convoy of Burners', 'Billboard Skyline', 'Sheriff Tumbleweed'] },
  4: { name: 'Hot Springs', theme: 'springs', pool: ['glump', 'rollo', 'hopper', 'spiker'], plan: ['water', 'ow', 'water', 'ow', 'under', 'ow', 'water', 'sky', 'water', 'castle'], gim: ['pools'],
    names: ['First Dip', 'Steamy Shoreline', 'Mineral Grotto', 'Terraces of Color', 'Under the Geyser', 'Boardwalk Bounce', 'The Deep Spring', 'Steam Cloud Skyway', 'Glowing Pools', 'The Geyser Guardian'] },
  5: { name: 'Gate Road', theme: 'gate', pool: ['spiker', 'hopper', 'rollo', 'boomer', 'glump'], plan: ['ow', 'auto', 'under', 'ow', 'sky', 'auto', 'ow', 'tower', 'ow', 'castle'], gim: ['crumble', 'crusher', 'wind'],
    names: ['The Line Begins', 'Crawling at 10 MPH', 'Inside the Box Office', 'Ticket Check', 'Flag Line Flyover', 'Dust Convoy', "The Greeters' Bell", 'Lookout Tower', 'Welcome Home', 'Captain Hard-Hat'] },
  6: { name: 'The Esplanade', theme: 'esplanade', pool: ['glump', 'rollo', 'boomer', 'flapper', 'wisp'], plan: ['ow', 'auto', 'under', 'ow', 'tower', 'ow', 'auto', 'ow', 'sky', 'castle'], gim: ['moving', 'turret', 'ember', 'lightning'],
    names: ['First Night Out', 'Hop the Fish Car', 'Inside the Bass Dome', 'Laser Alley', 'Climb the Lighthouse', 'Fire Poi Promenade', 'Disco Bus Parade', 'Neon Bike Jam', 'Lantern Skyway', 'DJ Wub-Lord'] },
  7: { name: 'Theme Camp Row', theme: 'camps', pool: ['glump', 'rollo', 'spiker', 'hopper', 'boomer', 'wisp'], plan: ['ow', 'ow', 'under', 'sky', 'ow', 'tower', 'ow', 'auto', 'sky', 'castle'], gim: ['spring', 'falling', 'floating', 'conveyor'],
    names: ['Bacon & Pancakes Camp', 'Free Hugs Lane', 'The Dome Maze', 'Trampoline Rooftops', 'Tech Bro Turnkey Camp', 'Shade Structure Summit', 'Orgy Dome Detour', 'Pedicab Pileup', 'Kite Flying Fields', 'Grand Witch Moonbeam'] },
  8: { name: 'Deep Playa', theme: 'deepplaya', pool: ['spiker', 'flapper', 'wisp', 'hopper', 'rollo'], plan: ['ow', 'auto', 'tower', 'under', 'ow', 'auto', 'ow', 'sky', 'ow', 'castle'], gim: ['wind', 'lightning', 'crumble', 'moving'],
    names: ['Into the Dark', 'Whiteout Express', 'The Giant Sculpture', 'Inside the Art Bunker', 'Trash Fence Trek', 'Night Art Car Odyssey', 'Lost Bike Graveyard', 'Lantern Release', 'Dust Storm Dawn', 'Dust Devil Diablo'] },
  9: { name: 'The Temple', theme: 'temple', pool: ['glump', 'flapper', 'wisp', 'hopper', 'boomer'], plan: ['ow', 'sky', 'tower', 'under', 'ow', 'auto', 'under', 'tower', 'ow', 'castle'], gim: ['falling', 'spring', 'ember'],
    names: ['Morning Procession', 'Prayer Flag Skyway', 'Temple Spire', 'The Quiet Chamber', 'Message Walls', 'The Slow Parade', 'Candle Catacombs', 'Rafters at Dawn', 'Guru Grove', 'Guru Grifter'] },
  10: { name: 'The Burn', theme: 'burn', pool: ['glump', 'rollo', 'spiker', 'flapper', 'hopper', 'boomer', 'wisp'], plan: ['ow', 'sky', 'tower', 'auto', 'under', 'ow', 'auto', 'tower', 'sky', 'castle'], gim: ['lava', 'crumble', 'ember', 'turret', 'spring', 'moving', 'lightning'],
    names: ['Burn Night', 'Firework Skies', 'Climb the Man', 'Fire Art Car Rally', 'Under the Man', 'Ember Field', 'Circle of Fire', "The Man's Shoulders", 'Smoke & Sparks', 'Lord Buzzkill'] },
  11: { name: 'Sunrise Set', theme: 'sunrise', secret: true, label: 'S', pool: ['glump', 'rollo', 'spiker', 'flapper', 'hopper', 'boomer'], plan: ['ow', 'sky', 'tower', 'auto', 'castle'], gim: ['moving', 'spring', 'conveyor', 'turret'],
    names: ['Dancing at Dawn', 'Cloud Nine', 'Speaker Stack Summit', 'The Sunrise Art Car', 'Bouncer Brutus'] },
  12: { name: 'Trip Dimension', theme: 'trip', secret: true, label: 'Ø', gravity: 0.8, pool: ['glump', 'spiker', 'flapper', 'hopper', 'wisp', 'rollo'], plan: ['ow', 'sky', 'under', 'auto', 'castle'], gim: ['falling', 'crumble', 'moving'],
    names: ['Melting Clocks', 'Kaleidoscope Sky', 'Inside the Mushroom', 'Rainbow Rollercoaster', 'The Trip Lord'] },
  22: { name: 'World 22', theme: 'w22', secret: true, label: '22', pool: ['glump', 'rollo', 'spiker', 'flapper', 'hopper', 'boomer', 'wisp'], plan: ['ow', 'sky', 'tower', 'water', 'castle'], gim: ['moving', 'falling', 'crumble', 'spring', 'ember', 'turret'],
    names: ['Twenty-Two', 'Golden Hour', 'Tape Tower', 'Rewind', 'The Archivist'] }
};
const WORLD_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 22];
const MAIN_WORLDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SECRET_LINKS = {
  '2-2': { kind: 'secretExit', world: 22 },
  '3-5': { kind: 'secretExit', world: 11 },
  '1-4': { kind: 'glitch', world: 12 }
};
const WARP_LOUNGES = { '1-2': [2, 3, 4], '4-5': [5, 6, 7], '7-3': [8, 9] };
// a level's secret exit: a hidden world (Road), or a hidden path on the city map (Brady-O World)
function secretFor(id) {
  if (SECRET_LINKS[id]) return SECRET_LINKS[id];
  if (typeof WORLD3_SECRETS !== 'undefined' && WORLD3_SECRETS[id]) return { kind: 'secretExit', world: 0, city: true };
  return null;
}
const SIGN_TEXTS = [
  'Hydrate or die-drate.',
  'Leave no trace. Except footprints. And maybe glitter.',
  'Lost something? Check Lost & Found. Then check your pockets.',
  'Somewhere, a wall is lying to you.',
  'Legend says there is a world numbered 22.',
  'Stand still long enough and Brady gets bored.',
  'Chinka was here. She left a heart in the dust.',
  'Free hugs ahead. Proceed with caution.',
  'Radical self-reliance means carrying your own snacks.',
  'Up on a porta-potty door to step through. Hold your breath.',
  'The mosquito went that way. Probably.',
  'Welcome home!'
];

function levelDifficulty(w, i) {
  if (w >= 31 && w <= 38) return clamp(0.05 + (w - 31) * 0.11 + (i - 1) * 0.02, 0, 0.92);   // Classic
  if (w === 48) return 0.74 + i * 0.02;                                                     // World: Trash Fence
  if (w === 49) return 0.8 + i * 0.02;                                                      // World: Sunrise Set
  if (w >= 41 && w <= 47) return clamp(0.05 + (w - 41) * 0.12 + (i - 1) * 0.015, 0, 0.9);   // Brady-O World
  if (w === 11) return 0.72 + i * 0.02;
  if (w === 12) return 0.78 + i * 0.02;
  if (w === 22) return 0.9 + i * 0.02;
  return clamp(0.04 + (w - 1) * 0.088 + (i - 1) * 0.012, 0, 1);
}
function levelId(w, i) { return w + '-' + i; }

/* ---------- area builder ---------- */
class AreaBuilder {
  constructor(W, H) {
    this.W = W; this.H = H; this.tiles = new Uint8Array(W * H);
    this.contents = {}; this.spawns = []; this.decor = []; this.ghosts = []; this.springs = [];
    this.goldSpots = []; this.extraLinks = [];
  }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
  set(x, y, t) { if (this.inb(x, y)) this.tiles[y * this.W + x] = t; }
  get(x, y) { return this.inb(x, y) ? this.tiles[y * this.W + x] : (y >= this.H ? T.EMPTY : T.HARD); }
  fill(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, t); }
  ground(x0, x1, top, t) { for (let x = x0; x <= x1; x++) for (let y = top; y < this.H; y++) this.set(x, y, t || T.GROUND); }
  clearCol(x, y0, y1) { for (let y = y0; y <= y1; y++) this.set(x, y, T.EMPTY); }
  item(x, y, it) { this.contents[x + ',' + y] = it; }
  spawn(type, tx, ty, props) { const s = Object.assign({ type, x: tx * TS + TS / 2, y: (ty + 1) * TS }, props || {}); this.spawns.push(s); return s; }
  pickAt(x, y) { if (this.get(x, y) === T.EMPTY) this.set(x, y, T.PICK); }
  picksRow(x0, x1, y) { for (let x = x0; x <= x1; x++) this.pickAt(x, y); }
  picksArc(x0, x1, yb, h) { const n = x1 - x0; for (let x = x0; x <= x1; x++) { const k = n ? (x - x0) / n : 0.5; this.pickAt(x, Math.round(yb - Math.sin(k * Math.PI) * h)); } }
  decorAt(kind, tx, groundTop, seed) { this.decor.push({ kind, x: tx * TS + TS / 2, y: groundTop * TS, seed: seed || 0 }); }
  gold(tx, ty, kind) { this.goldSpots.push({ tx, ty, kind }); }
  surfaceAt(x) { for (let y = 0; y < this.H; y++) { const t = this.get(x, y); if (SOLID[t] || t === T.SEMI) return y; } return -1; }
  // first tile from the top you could stand on (two clear tiles above), so ceilings are skipped
  standAt(x) { for (let y = 2; y < this.H; y++) { const t = this.get(x, y); if ((SOLID[t] || t === T.SEMI) && this.get(x, y - 1) === T.EMPTY && this.get(x, y - 2) === T.EMPTY) return y; } return -1; }
  trim(W2) {
    if (W2 >= this.W) return;
    const nt = new Uint8Array(W2 * this.H);
    for (let y = 0; y < this.H; y++) for (let x = 0; x < W2; x++) nt[y * W2 + x] = this.tiles[y * this.W + x];
    this.tiles = nt; this.W = W2;
  }
  build(props) {
    return Object.assign({ W: this.W, H: this.H, tiles: this.tiles, contents: this.contents, spawns: this.spawns, decor: this.decor, ghosts: this.ghosts, springs: this.springs, links: this.extraLinks }, props);
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

function generateLevel(w, i, attempt) {
  const W = WORLDS[w];
  const id = levelId(w, i);
  const rng = mulberry32(hashStr('brady-o:' + id + ':' + attempt));
  const type = W.plan[i - 1];
  const d = levelDifficulty(w, i);
  const ctx = {
    rng, w, i, id, d, type, world: W, theme: W.theme, gim: W.gim || [], pool: W.pool,
    powerLeft: 2 + (d < 0.3 ? 1 : 0), areas: [], bonusRooms: 0
  };
  let main;
  switch (type) {
    case 'under': main = genUnderground(ctx); break;
    case 'sky': main = genSky(ctx); break;
    case 'water': main = genWater(ctx); break;
    case 'tower': main = genTower(ctx); break;
    case 'castle': main = genCastle(ctx); break;
    case 'auto': main = genSide(ctx, { autoscroll: true }); break;
    default: main = genSide(ctx, {});
  }
  // Slothy naps in a hammock near the start of many Brady-O World levels
  if (W.set === 'world' && ['ow', 'auto', 'sky', 'under'].indexOf(type) >= 0 && (i === 1 || hashStr('slothy:' + id) % 100 < 55)) placeHammock(main.area, main.start);
  const level = {
    id, world: w, index: i, type, name: W.names[i - 1], worldName: W.name,
    areas: [main.area].concat(ctx.areas), start: main.start, time: main.time || 300, d,
    secret: secretFor(id), warps: WARP_LOUNGES[id] || null
  };
  // fix up area indices of bonus rooms (main is 0)
  return level;
}

/* ---------- shared helpers ---------- */
function placeHammock(A, start) {
  const get = (x, y) => (x < 0 || y < 0 || x >= A.W || y >= A.H) ? T.GROUND : A.tiles[y * A.W + x];
  const sx = Math.floor(start.x / TS);
  for (let tx = sx + 3; tx < sx + 10; tx++) {
    for (let y = 3; y < A.H; y++) {
      const t = get(tx, y);
      if (!(SOLID[t] || t === T.SEMI)) continue;
      if (get(tx, y - 1) !== T.EMPTY || get(tx, y - 2) !== T.EMPTY) continue;
      if (SOLID[get(tx - 1, y)] && SOLID[get(tx + 1, y)] && get(tx - 1, y - 1) === T.EMPTY && get(tx + 1, y - 1) === T.EMPTY && get(tx, y - 3) === T.EMPTY) {
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
function pickEnemy(ctx, avoid) {
  const pool = ctx.pool.filter(e => !avoid || avoid.indexOf(e) < 0);
  // early levels lean on the gentle enemies
  if (ctx.d < 0.15) return ctx.rng.chance(0.75) ? 'glump' : pool[0] || 'glump';
  return ctx.rng.pick(pool.length ? pool : ['glump']);
}
function blockContent(ctx, B) {
  const r = ctx.rng();
  if (ctx.powerLeft > 0 && r < 0.22) { ctx.powerLeft--; return 'power'; }
  if (r < 0.32) return 'picks';
  if (r < 0.34 && ctx.d > 0.2) return 'eclipse';
  return 'pick';
}
function addDecor(ctx, B, x0, x1, gy, density) {
  const th = THEMES[B.themeKey || ctx.theme];
  if (!th || !th.decor) return;
  for (let x = x0; x <= x1; x++) {
    if (ctx.rng() < (density || 0.12) && B.get(x, gy - 1) === T.EMPTY && SOLID[B.get(x, gy)]) {
      B.decorAt(ctx.rng.pick(th.decor), x, gy, ctx.rng.int(0, 99));
      x += 2;
    }
  }
}
function placeEnemiesOnFlat(ctx, B, x0, x1, gy, n) {
  const len = x1 - x0 + 1;
  if (len < 3) return;
  const used = new Set();
  for (let k = 0; k < n; k++) {
    let tx = x0 + 1 + ctx.rng.int(0, Math.max(0, len - 3));
    if (used.has(tx) || used.has(tx - 1) || used.has(tx + 1)) continue;
    used.add(tx);
    let type = pickEnemy(ctx);
    if (type === 'boomer') { // turrets need a pedestal
      B.set(tx, gy - 1, T.HARD); B.spawn('boomer', tx, gy - 2); continue;
    }
    if (type === 'flapper') { B.spawn('flapper', tx, gy - 4 - ctx.rng.int(0, 2)); continue; }
    if (type === 'wisp') { B.spawn('wisp', tx, gy - 3); continue; }
    B.spawn(type, tx, gy - 1, { dir: -1 });
  }
}

/* ---------- side-scrolling generator (overworld / autoscroll / castle body) ---------- */
function genSide(ctx, opts) {
  const { rng, d } = ctx;
  const H = 18, GY = 14;
  const len = Math.round(150 + d * 70 + rng.int(0, 30)) + (opts.autoscroll ? 30 : 0);
  const B = new AreaBuilder(len + 60, H);
  B.themeKey = ctx.theme;
  const st = { x: 0, gy: GY, ctx, B, lastHazard: false };
  B.ground(0, 11, GY);
  addDecor(ctx, B, 0, 10, GY, 0.2);
  if (ctx.i === 1) {
    // a hidden cassette near the start of every world's first level
    B.set(6, GY - 4, T.HIDDEN); B.item(6, GY - 4, 'oneup');
  }
  st.x = 12;
  const chunks = sideChunkTable(ctx, opts);
  let n = 0, mid = Math.floor(len * 0.5), checkpointPlaced = false, secretPlaced = false;
  const wantPortal = ctx.type === 'ow' && (rng.chance(0.55) || secretFor(ctx.id));
  while (st.x < len - 34) {
    // breather between chunks
    const br = rng.int(1, 3);
    B.ground(st.x, st.x + br - 1, st.gy);
    st.x += br;
    if (!checkpointPlaced && st.x > mid) {
      B.ground(st.x, st.x + 4, st.gy);
      B.spawn('checkpoint', st.x + 2, st.gy - 1);
      st.x += 5; checkpointPlaced = true;
      continue;
    }
    if (wantPortal && !secretPlaced && st.x > len * 0.25 && rng.chance(0.5)) {
      st.x = chunkSecretPortal(st, secretFor(ctx.id)); secretPlaced = true; continue;
    }
    if (SECRET_LINKS[ctx.id] && SECRET_LINKS[ctx.id].kind === 'glitch' && !st.glitchPlaced && st.x > len * 0.55) {
      st.x = chunkFakeAlcove(st, true); st.glitchPlaced = true; continue;
    }
    let kind = rng.weighted(chunks);
    if (n === 0 && (ctx.i === 1 || ctx.d < 0.1)) kind = 'blocks'; // a friendly opening for each world
    const fn = SIDE_CHUNKS[kind];
    st.opening = n === 0 && kind === 'blocks' && (ctx.i === 1 || ctx.d < 0.1);
    st.x = fn(st);
    st.opening = false;
    n++;
  }
  if (wantPortal && !secretPlaced) st.x = chunkSecretPortal(st, secretFor(ctx.id));
  if (SECRET_LINKS[ctx.id] && SECRET_LINKS[ctx.id].kind === 'glitch' && !st.glitchPlaced) st.x = chunkFakeAlcove(st, true);
  // ending: stairs up then runway and the Encore Gate
  const endX = chunkFinale(st);
  B.trim(endX);
  resolvePendingReturns(st);
  pickGold(ctx, B);
  const area = B.build({
    theme: ctx.theme, music: THEMES[ctx.theme].music, water: false, dark: !!ctx.world.dark,
    autoscroll: opts.autoscroll ? 2.7 + d * 1.4 : 0,
    wind: ctx.gim.indexOf('wind') >= 0 && rng.chance(0.6) && !opts.autoscroll,
    lightning: ctx.gim.indexOf('lightning') >= 0,
    gravity: ctx.world.gravity || 1, camMinY: 0
  });
  return { area, start: { area: 0, x: 6 * TS + TS / 2, y: GY * TS }, time: opts.autoscroll ? 400 : 300 };
}

function sideChunkTable(ctx, opts) {
  const g = ctx.gim, d = ctx.d;
  const t = [['flat', 3], ['gap', 3 + d * 2], ['stairs', 1.5], ['blocks', 3], ['pillars', 2], ['enemies', 2.5 + d], ['step', 2], ['floating', 1 + d * 2], ['spring', 0.7], ['hidden', 0.4]];
  if (d > 0.25) t.push(['alcove', 0.6], ['spikes', 0.6 + d]);
  if (g.indexOf('conveyor') >= 0) t.push(['conveyor', 2.2]);
  if (g.indexOf('turret') >= 0) t.push(['turrets', 1.8]);
  if (g.indexOf('moving') >= 0 || d > 0.3) t.push(['moving', 1.2 + (g.indexOf('moving') >= 0 ? 1.5 : 0)]);
  if (g.indexOf('falling') >= 0) t.push(['falling', 2.2]);
  if (g.indexOf('spring') >= 0) t.push(['spring', 1.6]);
  if (g.indexOf('ice') >= 0) t.push(['ice', 3]);
  if (g.indexOf('icicle') >= 0) t.push(['icicles', 2]);
  if (g.indexOf('crumble') >= 0) t.push(['crumble', 2.2]);
  if (g.indexOf('crusher') >= 0) t.push(['crushers', 1.8]);
  if (g.indexOf('lava') >= 0) t.push(['lava', 2.5]);
  if (g.indexOf('ember') >= 0) t.push(['ember', 1.6]);
  if (g.indexOf('lightning') >= 0) t.push(['lightning', 1.8]);
  if (g.indexOf('pools') >= 0) t.push(['pool', 3]);
  if (g.indexOf('floating') >= 0) t.push(['floating', 2]);
  return t;
}

const SIDE_CHUNKS = {
  flat(st) {
    const { B, ctx } = st; const L = ctx.rng.int(5, 10);
    B.ground(st.x, st.x + L - 1, st.gy);
    if (ctx.rng.chance(0.5)) B.picksRow(st.x + 1, st.x + Math.min(L - 2, 5), st.gy - 3);
    placeEnemiesOnFlat(ctx, B, st.x, st.x + L - 1, st.gy, ctx.rng.chance(0.4 + ctx.d * 0.4) ? 1 : 0);
    addDecor(ctx, B, st.x, st.x + L - 1, st.gy, 0.2);
    return st.x + L;
  },
  gap(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    B.ground(st.x, st.x + 2, st.gy);
    let x = st.x + 3;
    let w = rng.int(2, 2 + Math.round(ctx.d * 2.4));
    if (st.wind) w = Math.min(w, 3);
    let ngy = clamp(st.gy + rng.int(-1, 2), 9, 15);
    if (ngy < st.gy) w = Math.min(w, 3);
    if (rng.chance(0.6)) B.picksArc(x - 1, x + w, Math.min(st.gy, ngy) - 3, 2);
    const lava = ctx.gim.indexOf('lava') >= 0 && rng.chance(0.5);
    if (lava) for (let xx = x; xx < x + w; xx++) B.fill(xx, Math.max(st.gy, ngy) + 1, xx, B.H - 1, T.LAVA);
    if (ctx.d > 0.35 && w >= 3 && rng.chance(0.3)) B.gold(x + Math.floor(w / 2), Math.min(st.gy, ngy) - 1, 'risky');
    x += w;
    st.gy = ngy;
    B.ground(x, x + 2, st.gy);
    return x + 3;
  },
  stairs(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const n = rng.int(3, 4 + Math.round(ctx.d));
    const gap = rng.chance(0.5 + ctx.d * 0.3) ? rng.int(1, 2 + Math.round(ctx.d)) : 0;
    const top = rng.int(1, 2);
    const total = n + top + gap + top + n + 2;
    B.ground(st.x, st.x + total, st.gy);
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
    const { B, ctx } = st; const rng = ctx.rng;
    const L = rng.int(10, 14);
    B.ground(st.x, st.x + L - 1, st.gy);
    const pats = ['B?B?B', '???', 'BB?BB', '?B?', 'B?B', 'BBBBB', '?', 'B??B'];
    const pat = rng.pick(pats);
    const bx = st.x + 2 + rng.int(0, Math.max(0, L - pat.length - 4));
    const by = st.gy - 4;
    let hasQ = false;
    for (let k = 0; k < pat.length; k++) {
      const c = pat[k];
      if (c === '?') { B.set(bx + k, by, T.QBLOCK); B.item(bx + k, by, blockContent(ctx, B)); hasQ = true; }
      else {
        if (rng.chance(0.12)) { B.set(bx + k, by, T.QBRICK); B.item(bx + k, by, rng.chance(0.7) ? 'picks' : (ctx.powerLeft-- > 0 ? 'power' : 'pick')); }
        else B.set(bx + k, by, T.BRICK);
      }
    }
    if (!hasQ && rng.chance(0.5)) { B.set(bx, by, T.QBLOCK); B.item(bx, by, blockContent(ctx, B)); }
    if (rng.chance(0.45) && pat.length >= 3) {
      const ux = bx + 1, uy = by - 4;
      const ulen = Math.min(pat.length, rng.int(2, 4));
      for (let k = 0; k < ulen; k++) {
        if (rng.chance(0.4)) { B.set(ux + k, uy, T.QBLOCK); B.item(ux + k, uy, blockContent(ctx, B)); } else B.set(ux + k, uy, T.BRICK);
      }
      B.picksRow(ux, ux + ulen - 1, uy - 2);
      B.gold(ux + ulen, uy - 2, 'high');
    } else B.picksRow(bx, bx + pat.length - 1, by - 2);
    const nSp = B.spawns.length;
    placeEnemiesOnFlat(ctx, B, st.x, st.x + L - 1, st.gy, rng.int(0, 1 + Math.round(ctx.d)));
    if (st.opening) {
      // friendly opening: one slow enemy at the far end, so the first seconds are safe
      B.spawns.length = nSp;
      B.spawn('glump', st.x + L - 1, st.gy - 1, { dir: -1 });
    }
    addDecor(ctx, B, st.x, st.x + L - 1, st.gy, 0.15);
    return st.x + L;
  },
  pillars(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const n = rng.int(1, 3);
    let x = st.x;
    B.ground(x, x + 1, st.gy); x += 2;
    for (let k = 0; k < n; k++) {
      const h = rng.int(2, 4);
      const overGap = ctx.d > 0.2 && rng.chance(0.35);
      if (overGap) {
        const g1 = rng.int(1, 2), g2 = rng.int(1, 2);
        x += g1;
        B.fill(x, st.gy - h, x + 1, B.H - 1, T.PILLAR);
        if (rng.chance(0.3) && ctx.pool.indexOf('boomer') >= 0) B.spawn('boomer', x, st.gy - h - 1);
        x += 2 + g2;
        B.ground(x, x + 2, st.gy); x += 3;
      } else {
        B.ground(x, x + 1, st.gy);
        B.fill(x, st.gy - h, x + 1, st.gy - 1, T.PILLAR);
        x += 2;
        const sp = rng.int(3, 5);
        B.ground(x, x + sp - 1, st.gy);
        placeEnemiesOnFlat(ctx, B, x, x + sp - 1, st.gy, rng.chance(0.5) ? 1 : 0);
        x += sp;
      }
    }
    return x;
  },
  enemies(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const L = rng.int(9, 14);
    B.ground(st.x, st.x + L - 1, st.gy);
    placeEnemiesOnFlat(ctx, B, st.x, st.x + L - 1, st.gy, rng.int(2, 2 + Math.round(ctx.d * 2)));
    if (rng.chance(0.5)) { const bx = st.x + rng.int(2, L - 4); B.set(bx, st.gy - 4, T.QBLOCK); B.item(bx, st.gy - 4, blockContent(ctx, B)); }
    addDecor(ctx, B, st.x, st.x + L - 1, st.gy, 0.15);
    return st.x + L;
  },
  step(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    let ngy = st.gy + (rng.chance(0.5) ? -rng.int(1, 3) : rng.int(1, 3));
    ngy = clamp(ngy, 9, 15);
    B.ground(st.x, st.x + 2, st.gy);
    st.gy = ngy;
    const L = rng.int(4, 8);
    B.ground(st.x + 3, st.x + 3 + L - 1, st.gy);
    addDecor(ctx, B, st.x + 3, st.x + 3 + L - 1, st.gy, 0.2);
    if (rng.chance(0.4)) placeEnemiesOnFlat(ctx, B, st.x + 3, st.x + 3 + L - 1, st.gy, 1);
    return st.x + 3 + L;
  },
  floating(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    B.ground(st.x, st.x + 2, st.gy);
    let x = st.x + 3;
    const span = rng.int(7, 10 + Math.round(ctx.d * 6));
    const end = x + span;
    let py = st.gy;
    let firstGold = true;
    while (x < end - 3) {
      const g = rng.int(2, 3), w = rng.int(2, 4);
      py = clamp(py + rng.int(-2, 1), st.gy - 4, st.gy);
      x += g;
      const solid = rng.chance(0.35);
      if (solid) B.fill(x, py, x + w - 1, B.H - 1, T.GROUND);
      else for (let k = 0; k < w; k++) B.set(x + k, py, T.SEMI);
      if (rng.chance(0.5)) B.picksRow(x, x + w - 1, py - 2);
      if (firstGold && py < st.gy - 2) { B.gold(x + 1, py - 4, 'high'); firstGold = false; }
      if (w >= 3 && rng.chance(0.3)) B.spawn(pickEnemy(ctx, ['boomer', 'flapper', 'wisp']), x + 1, py - 1);
      x += w;
    }
    x += 2;
    st.gy = clamp(py + rng.int(0, 1), 9, 15);
    if (py - st.gy > 0) st.gy = py; // never land higher than reachable
    B.ground(x, x + 3, st.gy);
    return x + 4;
  },
  spring(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const h = rng.int(6, 7);
    B.ground(st.x, st.x + 9, st.gy);
    B.spawn('spring', st.x + 2, st.gy - 1); B.springs.push([st.x + 2, st.gy - 1]);
    const wx = st.x + 4;
    B.fill(wx, st.gy - h, wx + 1, st.gy - 1, T.HARD);
    B.picksRow(wx - 1, wx + 2, st.gy - h - 3);
    B.gold(wx + 1, st.gy - h - 6, 'high');
    return st.x + 10;
  },
  hidden(st) {
    const { B, ctx } = st;
    const L = 7;
    B.ground(st.x, st.x + L - 1, st.gy);
    const hx = st.x + 3;
    B.set(hx, st.gy - 4, T.HIDDEN); B.item(hx, st.gy - 4, ctx.rng.chance(0.4) ? 'oneup' : 'picks');
    B.decorAt('sign', hx - 2, st.gy); // decorative hint post
    B.decor[B.decor.length - 1].kind = 'flower';
    return st.x + L;
  },
  spikes(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const w = rng.int(3, 3 + Math.round(ctx.d * 2));
    B.ground(st.x, st.x + w + 5, st.gy);
    const sx = st.x + 3;
    for (let k = 0; k < w; k++) B.set(sx + k, st.gy - 1, T.SPIKES);
    if (w > 3 || rng.chance(0.5)) { for (let k = 0; k < Math.min(w, 3); k++) B.set(sx + Math.floor((w - 3) / 2) + k, st.gy - 5, T.SEMI); B.picksRow(sx, sx + w - 1, st.gy - 3); }
    return st.x + w + 6;
  },
  alcove(st) { return chunkFakeAlcove(st, false); },
  conveyor(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    let x = st.x;
    B.ground(x, x + 1, st.gy); x += 2;
    const n = rng.int(2, 3);
    for (let k = 0; k < n; k++) {
      const L = rng.int(4, 7), dirT = rng.chance(0.7) ? T.CONV_L : T.CONV_R;
      B.ground(x, x + L - 1, st.gy);
      for (let q = 0; q < L; q++) B.set(x + q, st.gy, dirT);
      if (rng.chance(0.4)) placeEnemiesOnFlat(ctx, B, x, x + L - 1, st.gy, 1);
      x += L;
      if (k < n - 1) { const g = rng.int(1, 2); x += g; }
    }
    B.ground(x, x + 2, st.gy);
    return x + 3;
  },
  turrets(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const L = rng.int(12, 16);
    B.ground(st.x, st.x + L - 1, st.gy);
    const n = rng.int(1, 2);
    for (let k = 0; k < n; k++) {
      const tx = st.x + 4 + k * 6;
      const h = rng.int(1, 2);
      B.fill(tx, st.gy - h, tx, st.gy - 1, T.HARD);
      B.spawn('boomer', tx, st.gy - h - 1);
    }
    return st.x + L;
  },
  moving(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    B.ground(st.x, st.x + 2, st.gy);
    let x = st.x + 3;
    const vertical = rng.chance(0.35);
    if (vertical) {
      // elevator up to a high ledge
      const hgt = rng.int(5, 7);
      const w = 3;
      B.spawn('mplat', x, st.gy - 1, { pw: 3, ax: 0, ay: -hgt * TS, speed: 1.8 + ctx.d, ox: 0 });
      for (let k = 0; k <= hgt; k++) for (let q = 0; q < w; q++) B.ghosts.push([x - 1 + q, st.gy - 1 - k + 1]);
      x += w + 1;
      const top = st.gy - hgt;
      B.fill(x, top, x + 5, B.H - 1, T.GROUND);
      B.picksRow(x + 1, x + 4, top - 2);
      B.gold(x + 3, top - 5, 'high');
      x += 6;
      B.ground(x, x + 3, st.gy);
      return x + 4;
    }
    const gw = rng.int(7, 10);
    const py = st.gy;
    B.spawn('mplat', x, py - 1, { pw: 3, ax: (gw - 3) * TS, ay: 0, speed: 1.6 + ctx.d * 1.2 });
    for (let k = -1; k < gw + 1; k++) B.ghosts.push([x + k, py]);
    B.picksRow(x + 2, x + gw - 3, py - 3);
    x += gw;
    B.ground(x, x + 3, st.gy);
    return x + 4;
  },
  falling(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    B.ground(st.x, st.x + 2, st.gy);
    let x = st.x + 4;
    const n = rng.int(2, 4);
    let py = st.gy;
    for (let k = 0; k < n; k++) {
      py = clamp(py + rng.int(-1, 1), st.gy - 3, st.gy);
      B.spawn('fplat', x, py - 1, { pw: 2 });
      B.ghosts.push([x - 1, py], [x, py]);
      B.picksRow(x - 1, x, py - 2);
      x += rng.int(3, 4);
    }
    st.gy = clamp(py, st.gy - 3, 15);
    B.ground(x, x + 3, st.gy);
    return x + 4;
  },
  ice(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const L = rng.int(10, 16);
    B.ground(st.x, st.x + L - 1, st.gy);
    for (let k = 0; k < L; k++) B.set(st.x + k, st.gy, T.ICE);
    if (rng.chance(0.6)) { const g = rng.int(2, 3), gx = st.x + Math.floor(L / 2); for (let k = 0; k < g; k++) B.clearCol(gx + k, st.gy, B.H - 1); }
    placeEnemiesOnFlat(ctx, B, st.x + 1, st.x + 5, st.gy, 1);
    B.picksRow(st.x + 2, st.x + L - 3, st.gy - 3);
    return st.x + L;
  },
  icicles(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const L = rng.int(8, 12);
    B.ground(st.x, st.x + L - 1, st.gy);
    const cy = st.gy - 6;
    B.fill(st.x + 1, cy - 1, st.x + L - 2, cy, T.GROUND);
    for (let k = 2; k < L - 2; k += rng.int(2, 3)) B.spawn('icicle', st.x + k, cy + 1, {});
    B.picksRow(st.x + 2, st.x + L - 3, st.gy - 2);
    B.gold(st.x + Math.floor(L / 2), cy - 2, 'high');
    return st.x + L;
  },
  crumble(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    B.ground(st.x, st.x + 2, st.gy);
    const w = rng.int(5, 8);
    const x = st.x + 3;
    for (let k = 0; k < w; k++) B.set(x + k, st.gy, T.CRUMBLE);
    B.picksRow(x, x + w - 1, st.gy - 2);
    B.ground(x + w, x + w + 2, st.gy);
    return x + w + 3;
  },
  crushers(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const L = rng.int(12, 16);
    B.ground(st.x, st.x + L - 1, st.gy);
    for (let k = 3; k < L - 3; k += rng.int(4, 5)) B.spawn('slab', st.x + k, st.gy - 6, {});
    B.picksRow(st.x + 2, st.x + L - 3, st.gy - 1);
    return st.x + L;
  },
  lava(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    B.ground(st.x, st.x + 2, st.gy);
    const w = rng.int(3, 4 + Math.round(ctx.d));
    const x = st.x + 3;
    for (let k = 0; k < w; k++) B.fill(x + k, st.gy + 1, x + k, B.H - 1, T.LAVA);
    if (w >= 4) { B.set(x + Math.floor(w / 2), st.gy - 1, T.HARD); B.set(x + Math.floor(w / 2) - (w % 2 ? 0 : 1), st.gy - 1, T.HARD); B.fill(x + Math.floor(w / 2), st.gy, x + Math.floor(w / 2), B.H - 1, T.HARD); }
    B.spawn('leaper', x + 1, B.H - 2, { lava: true });
    B.picksArc(x, x + w - 1, st.gy - 3, 2);
    B.ground(x + w, x + w + 2, st.gy);
    return x + w + 3;
  },
  ember(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const L = 11;
    B.ground(st.x, st.x + L - 1, st.gy);
    const cx = st.x + 5;
    B.set(cx, st.gy - 4, T.USED);
    B.spawn('emberchain', cx, st.gy - 4, { len: rng.int(3, 4 + Math.round(ctx.d)), speed: (rng.chance(0.5) ? 1 : -1) * (1.6 + ctx.d) });
    return st.x + L;
  },
  lightning(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    const L = rng.int(10, 13);
    B.ground(st.x, st.x + L - 1, st.gy);
    B.spawn('bolt', st.x + Math.floor(L / 2), st.gy - 1, { period: 2.6 + rng() * 1.2, phase: rng() * 2 });
    B.picksRow(st.x + 2, st.x + L - 3, st.gy - 2);
    return st.x + L;
  },
  pool(st) {
    const { B, ctx } = st; const rng = ctx.rng;
    B.ground(st.x, st.x + 2, st.gy);
    const w = rng.int(4, 7), x = st.x + 3, depth = 3;
    for (let k = 0; k < w; k++) { B.ground(x + k, x + k, st.gy + depth); B.fill(x + k, st.gy, x + k, st.gy + depth - 1, T.WATER); }
    B.picksRow(x + 1, x + w - 2, st.gy + 1);
    if (rng.chance(0.5)) B.spawn('leaper', x + 1, st.gy + depth - 1, { lava: false });
    B.ground(x + w, x + w + 2, st.gy);
    return x + w + 3;
  }
};

// raised plateau whose side is a fake wall hiding an alcove
function chunkFakeAlcove(st, glitch) {
  const { B, ctx } = st;
  const L = 10;
  B.ground(st.x, st.x + 2, st.gy);
  const px = st.x + 3, top = st.gy - 3;
  B.ground(px, px + L - 1, top);
  // alcove: two rows tall, four wide, entered through the plateau's left face
  for (let x = px; x < px + 5; x++) for (let y = st.gy - 2; y <= st.gy - 1; y++) B.set(x, y, T.FAKE);
  for (let x = px + 1; x < px + 5; x++) B.set(x, st.gy - 2, T.FAKE);
  if (glitch) {
    B.spawn('portal', px + 3, st.gy - 1, { kind: 'glitch', warpWorld: 12 });
  } else {
    B.picksRow(px + 1, px + 3, st.gy - 1);
    B.gold(px + 4, st.gy - 2, 'hidden');
  }
  B.picksRow(px + 1, px + L - 2, top - 2);
  // step down after plateau
  B.ground(px + L, px + L + 2, st.gy);
  return px + L + 3;
}

// portal (on a high perch) to a bonus room; return portal lands later in the level
function chunkSecretPortal(st, secret) {
  const { B, ctx } = st; const rng = ctx.rng;
  B.ground(st.x, st.x + 7, st.gy);
  const h = rng.int(3, 4);
  const px = st.x + 3;
  B.fill(px, st.gy - h, px + 1, st.gy - 1, T.PILLAR);
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
  const th = themeFor(ctx, 'cave');
  B.themeKey = th;
  B.fill(0, 0, W - 1, 1, T.GROUND);
  B.fill(0, 0, 1, H - 1, T.GROUND); B.fill(W - 2, 0, W - 1, H - 1, T.GROUND);
  B.ground(0, W - 1, 11);
  // pick constellation
  for (let r = 0; r < 3; r++) B.picksRow(O + 4 + r, W - O - 6 - r, 6 + r * 2);
  // ledge with the gold record
  const lx = W - O - 9;
  B.fill(lx, 7, lx + 3, 7, T.SEMI);
  // a couple of mystery blocks
  B.set(O + 8, 7, T.QBLOCK); B.item(O + 8, 7, ctx.powerLeft > 0 ? 'power' : 'picks');
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
  const area = B.build({ theme: th, music: 'underground', water: false, dark: false, autoscroll: 0, bonus: true, gravity: ctx.world.gravity || 1, goldX: (lx + 2) * TS + TS / 2, goldY: 6 * TS, entryX: (O + 3) * TS + TS / 2 });
  if (secretGate) {
    // extend the room to the right with the secret Encore Gate
    const W2 = W + 14;
    const nt = new Uint8Array(W2 * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W2; x++) nt[y * W2 + x] = x < W ? area.tiles[y * W + x] : (y < 2 || y >= 11 || x >= W2 - 2 ? T.GROUND : T.EMPTY);
    area.W = W2; area.tiles = nt;
    area.spawns.push({ type: 'gate', x: (W + 6) * TS, y: 11 * TS, secret: true, secretWorld: secret.world });
    area.spawns.push({ type: 'sign', x: (W + 1) * TS + TS / 2, y: 11 * TS, text: secret.city ? 'Secret exit! A hidden path opens on the city map.' : 'You found a secret exit! A hidden world awaits.' });
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
      if (s > 2 && SOLID[B.get(x, s)] && B.get(x, s - 1) === T.EMPTY && B.get(x, s - 2) === T.EMPTY && B.get(x + 1, s) !== T.EMPTY && SOLID[B.get(x - 1, s)] && B.get(x, s - 3) !== T.SPIKES) { tx = x; sy = s; break; }
    }
    if (tx < 0) { tx = 4; sy = B.standAt(4); }
    pr.room.ret.target = { area: 0, x: tx * TS + TS / 2, y: sy * TS };
    // for the validator: the room's exit links back here
  }
}

function chunkFinale(st) {
  const { B, ctx } = st;
  let x = st.x;
  B.ground(x, x + 3, st.gy); x += 4;
  // staircase up
  const n = 4;
  for (let i = 0; i < n; i++, x++) { B.ground(x, x, st.gy); B.fill(x, st.gy - 1 - i, x, st.gy - 1, T.HARD); }
  B.ground(x, x, st.gy); B.fill(x, st.gy - n, x, st.gy - 1, T.HARD); x++;
  B.gold(x - 1, st.gy - n - 5, 'high');
  // runway
  B.ground(x, x + 16, st.gy);
  B.spawn('gate', x + 7, st.gy - 1, {});
  addDecor(ctx, B, x + 11, x + 15, st.gy, 0.3);
  return x + 17;
}

function pickGold(ctx, B, extra) {
  const rng = ctx.rng;
  // a spot is usable only if it sits in open air
  const okSpot = s => s.tx >= 2 && s.tx <= B.W - 3 && s.ty >= 1 && !SOLID[B.get(s.tx, s.ty)] && B.get(s.tx, s.ty) !== T.LAVA && B.get(s.tx, s.ty) !== T.SPIKES;
  const spots = B.goldSpots.filter(okSpot);
  const chosen = [];
  const bonusSpots = [];
  ctx.areas.forEach((a, k) => { if (a.bonus) bonusSpots.push({ area: k + 1, a }); });
  const byKind = k => spots.filter(s => s.kind === k);
  const take = list => { if (!list.length) return null; const s = list[rng.int(0, list.length - 1)]; spots.splice(spots.indexOf(s), 1); return s; };
  let idx = 0;
  if (bonusSpots.length) {
    const bs = bonusSpots[0];
    bs.a.spawns.push({ type: 'gold', idx: idx++, x: bs.a.goldX, y: bs.a.goldY, kind: 'bonus' });
  }
  const need = () => 3 - idx - chosen.length;
  for (const k of ['hidden', 'risky', 'high']) {
    if (need() <= 0) break;
    const s = take(byKind(k));
    if (s) chosen.push(s);
  }
  while (need() > 0 && spots.length) chosen.push(take(spots));
  // fallback: float a record a few tiles above an open stretch of floor
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

/* ---------- underground ---------- */
function genUnderground(ctx) {
  const { rng, d } = ctx;
  const H = 21, GY = 17, CEIL0 = 4, CEIL1 = 4;
  const warps = WARP_LOUNGES[ctx.id];
  const len = Math.round(130 + d * 60 + rng.int(0, 20));
  const B = new AreaBuilder(len + 100, H);
  const th = themeFor(ctx, 'cave');
  B.themeKey = th;
  const st = { x: 0, gy: GY, ctx, B };
  B.ground(0, 11, GY);
  st.x = 12;
  const table = sideChunkTable(ctx, {}).filter(c => ['floating', 'spring', 'moving', 'lightning', 'pool', 'icicles'].indexOf(c[0]) < 0);
  table.push(['blocks', 3], ['pillars', 2]);
  let cp = false;
  const usecret = secretFor(ctx.id); let usecretPlaced = !(usecret && usecret.kind === 'secretExit');
  while (st.x < len - 30) {
    const br = rng.int(1, 3); B.ground(st.x, st.x + br - 1, st.gy); st.x += br;
    if (!cp && st.x > len / 2) { B.ground(st.x, st.x + 4, st.gy); B.spawn('checkpoint', st.x + 2, st.gy - 1); st.x += 5; cp = true; continue; }
    if (!usecretPlaced && st.x > len * 0.3) { st.gy = clamp(st.gy, 14, 17); st.x = chunkSecretPortal(st, usecret); usecretPlaced = true; continue; }
    const kind = rng.weighted(table);
    st.x = SIDE_CHUNKS[kind](st);
    st.gy = clamp(st.gy, 13, 17);
  }
  // keep the floor from climbing into the ceiling
  let x = st.x;
  B.ground(x, x + 3, st.gy); x += 4;
  if (st.gy !== GY) { st.gy = GY; B.ground(x, x + 2, GY); x += 3; }
  let endX;
  if (warps) {
    // a grand brick staircase up to a hole in the ceiling — the secret route
    const steps = 5;
    B.ground(x, x + steps * 2 + 3, GY);
    for (let i = 0; i < steps; i++) B.fill(x + i * 2, GY - 2 - i * 2, x + i * 2 + 1, GY - 1, T.BRICK);
    const topX = x + steps * 2;
    B.fill(topX, GY - 2 * steps, topX + 1, GY - 1, T.BRICK);
    const holeX = topX;
    B.picksRow(x + 2, topX - 1, GY - 2 * steps - 1);
    x = topX + 4;
    B.ground(x, x + 9, GY);
    B.spawn('gate', x + 5, GY - 1, {});
    const wallX = x + 11;
    B.ground(wallX - 1, wallX + 1, GY);
    B.fill(wallX, CEIL0, wallX + 1, GY - 1, T.GROUND);
    const loungeX = wallX + 2;
    const lw = 8 + warps.length * 6;
    B.ground(loungeX, loungeX + lw, GY);
    B.fill(loungeX + lw, 0, loungeX + lw + 1, H - 1, T.GROUND);
    endX = loungeX + lw + 2;
    // ceiling everywhere, with the hole above the staircase and the drop into the lounge
    for (let cx = 0; cx < endX; cx++) B.fill(cx, CEIL0, cx, CEIL1, T.GROUND);
    for (let cx = holeX; cx < holeX + 2; cx++) B.clearCol(cx, CEIL0, CEIL1);
    for (let cx = loungeX + 1; cx < loungeX + 3; cx++) B.clearCol(cx, CEIL0, CEIL1);
    B.fill(0, 0, 0, CEIL1, T.GROUND);
    // lounge contents
    warps.forEach((wn, k) => {
      const px = loungeX + 6 + k * 6;
      B.spawn('portal', px, GY - 1, { kind: 'warp', warpWorld: wn });
      B.spawn('sign', px, GY - 1, { text: 'WARP TO WORLD ' + wn + ': ' + WORLDS[wn].name.toUpperCase(), label: String(wn), hidden: true });
    });
    B.picksRow(loungeX + 3, loungeX + lw - 2, GY - 5);
    B.picksRow(holeX + 3, loungeX - 3, CEIL0 - 2);
  } else {
    B.ground(x, x + 14, GY);
    B.spawn('gate', x + 7, GY - 1, {});
    endX = x + 15;
    for (let cx = 0; cx < endX; cx++) B.fill(cx, 0, cx, CEIL1, T.GROUND);
  }
  B.trim(endX);
  resolvePendingReturns(st);
  pickGold(ctx, B);
  // strip any structure that pokes into the ceiling band
  const area = B.build({ theme: th, music: 'underground', water: false, dark: !!ctx.world.dark || ctx.w === 9, autoscroll: 0, gravity: ctx.world.gravity || 1 });
  return { area, start: { area: 0, x: 6 * TS + TS / 2, y: GY * TS }, time: 300 };
}

/* ---------- sky ---------- */
function genSky(ctx) {
  const { rng, d } = ctx;
  const H = 18;
  const len = Math.round(140 + d * 60 + rng.int(0, 20));
  const B = new AreaBuilder(len + 40, H);
  B.themeKey = ctx.theme;
  let gy = 12;
  const island = (x0, x1, top, thick) => { B.fill(x0, top, x1, Math.min(H - 1, top + (thick || 3)), T.GROUND); };
  island(0, 9, gy, 3);
  let x = 10;
  let cp = false;
  const hasMoving = ctx.gim.indexOf('moving') >= 0 || d > 0.3;
  const ssecret = secretFor(ctx.id); let ssecretPlaced = !(ssecret && ssecret.kind === 'secretExit');
  const skyPending = { B, pendingReturn: [] };
  while (x < len - 20) {
    if (!ssecretPlaced && x > len * 0.3) {
      // a wide island with a pillar and the secret portal on top
      x += 2; gy = clamp(gy + rng.int(-1, 1), 9, 12);
      const L = 9; island(x, x + L - 1, gy, 3);
      const h = rng.int(3, 4), px = x + 3;
      B.fill(px, gy - h, px + 1, gy - 1, T.PILLAR);
      const roomIdx = 1 + ctx.areas.length;
      const portal = B.spawn('portal', px, gy - h - 1, { kind: 'secret', target: { area: roomIdx, x: 8 * TS + TS / 2, y: 11 * TS } });
      portal.x += TS / 2;
      const room = makeBonusRoom(ctx, roomIdx, ssecret);
      ctx.areas.push(room.area);
      skyPending.pendingReturn.push({ room, minX: x + 22 });
      x += L; ssecretPlaced = true; continue;
    }
    const r = rng();
    const g = rng.int(2, 3 + Math.round(d));
    if (!cp && x > len / 2) {
      x += 2; const L = 7; gy = clamp(gy + rng.int(-1, 1), 8, 13); island(x, x + L - 1, gy, 3); B.spawn('checkpoint', x + 3, gy - 1); x += L; cp = true; continue;
    }
    if (r < 0.35) {
      // floating island
      x += g;
      const ngy = clamp(gy + rng.int(-2, 2), 7, 13);
      gy = ngy;
      const L = rng.int(4, 8);
      island(x, x + L - 1, gy, rng.int(1, 3));
      if (L >= 5) placeEnemiesOnFlat(ctx, B, x, x + L - 1, gy, rng.chance(0.5) ? 1 : 0);
      if (rng.chance(0.5)) B.picksRow(x + 1, x + L - 2, gy - 3);
      addDecor(ctx, B, x, x + L - 1, gy, 0.2);
      if (rng.chance(0.3)) { const bx = x + Math.floor(L / 2); B.set(bx, gy - 4, T.QBLOCK); B.item(bx, gy - 4, blockContent(ctx, B)); }
      x += L;
    } else if (r < 0.55) {
      // cloud stairs
      const n = rng.int(3, 5);
      for (let k = 0; k < n; k++) {
        x += rng.int(2, 3);
        gy = clamp(gy + rng.int(-2, 1), 6, 13);
        const w = rng.int(2, 3);
        for (let q = 0; q < w; q++) B.set(x + q, gy, T.SEMI);
        if (rng.chance(0.5)) B.picksRow(x, x + w - 1, gy - 2);
        if (k === n - 1) B.gold(x + 1, gy - 5, 'high');
        x += w;
      }
    } else if (r < 0.7 && hasMoving) {
      const gw = rng.int(6, 9);
      x += 1;
      B.spawn('mplat', x, gy - 1, { pw: 3, ax: (gw - 3) * TS, ay: 0, speed: 1.6 + d });
      for (let k = -1; k < gw + 1; k++) B.ghosts.push([x + k, gy]);
      B.picksRow(x + 2, x + gw - 3, gy - 3);
      x += gw;
      island(x, x + 3, gy, 2); x += 4;
    } else if (r < 0.82) {
      x += 1;
      const n = rng.int(2, 4);
      for (let k = 0; k < n; k++) { x += rng.int(2, 3); B.spawn('fplat', x, gy - 1, { pw: 2 }); B.ghosts.push([x - 1, gy], [x, gy]); x += 1; }
      x += 2; island(x, x + 3, gy, 2); x += 4;
    } else {
      // spring to a high island
      island(x, x + 3, gy, 2);
      B.spawn('spring', x + 1, gy - 1); B.springs.push([x + 1, gy - 1]);
      const hy = clamp(gy - 6, 3, 9);
      x += 6;
      island(x, x + 4, hy, 1);
      B.picksRow(x, x + 4, hy - 2);
      B.gold(x + 2, hy - 4, 'high');
      x += 5; gy = clamp(hy + 3, 6, 13);
      x += 2; island(x, x + 3, gy, 2); x += 4;
    }
    if (rng.chance(0.25 + d * 0.3)) { B.spawn('flapper', x - 2, gy - 4); }
  }
  x += 2;
  gy = clamp(gy, 8, 12);
  island(x, x + 18, gy, 4);
  B.spawn('gate', x + 10, gy - 1, {});
  B.trim(x + 19);
  resolvePendingReturns(skyPending);
  pickGold(ctx, B);
  const area = B.build({ theme: ctx.theme, music: THEMES[ctx.theme].music, water: false, dark: !!ctx.world.dark, autoscroll: 0, wind: ctx.gim.indexOf('wind') >= 0, lightning: ctx.gim.indexOf('lightning') >= 0, gravity: ctx.world.gravity || 1, sky: true });
  return { area, start: { area: 0, x: 6 * TS + TS / 2, y: 12 * TS }, time: 300 };
}

/* ---------- underwater ---------- */
function genWater(ctx) {
  const { rng, d } = ctx;
  const H = 16, FLOOR = 13;
  const len = Math.round(130 + d * 50 + rng.int(0, 20));
  const B = new AreaBuilder(len + 30, H);
  B.themeKey = ctx.theme;
  B.fill(0, 0, len + 29, 1, T.GROUND);
  B.ground(0, len + 29, FLOOR);
  let x = 12;
  let cp = false;
  while (x < len - 20) {
    const r = rng();
    if (!cp && x > len / 2) { B.spawn('checkpoint', x + 1, FLOOR - 1); x += 6; cp = true; continue; }
    if (r < 0.35) {
      // floor ridge
      const h = rng.int(2, 6), w = rng.int(2, 5);
      B.fill(x, FLOOR - h, x + w - 1, FLOOR, T.GROUND);
      if (rng.chance(0.4)) for (let q = 0; q < w; q++) B.set(x + q, FLOOR - h - 1, T.SPIKES);
      B.picksRow(x, x + w - 1, FLOOR - h - 3);
      x += w + rng.int(3, 6);
    } else if (r < 0.6) {
      // ceiling stalactite
      const h = rng.int(2, 6), w = rng.int(2, 4);
      B.fill(x, 2, x + w - 1, 1 + h, T.GROUND);
      B.picksRow(x, x + w - 1, 3 + h);
      x += w + rng.int(3, 6);
    } else if (r < 0.75) {
      // gate pair forming a tunnel
      const gapTop = rng.int(4, 8), gapH = 4;
      B.fill(x, 2, x + 1, gapTop - 1, T.GROUND);
      B.fill(x, gapTop + gapH, x + 1, FLOOR, T.GROUND);
      B.picksRow(x, x + 1, gapTop + 1);
      if (rng.chance(0.4)) B.gold(x + 1, gapTop + gapH + 1 < FLOOR - 1 ? FLOOR - 1 : gapTop + 2, 'risky');
      x += 2 + rng.int(4, 7);
    } else {
      // open water with creatures
      const L = rng.int(6, 10);
      const n = rng.int(1, 2 + Math.round(d * 2));
      for (let k = 0; k < n; k++) {
        if (rng.chance(0.55)) B.spawn('jelly', x + rng.int(1, L - 2), rng.int(4, 10), { range: rng.int(2, 4) });
        else B.spawn('snapper', x + rng.int(1, L - 2), rng.int(4, 11), {});
      }
      B.picksArc(x + 1, x + L - 2, 9, 3);
      if (rng.chance(0.5)) B.decorAt(rng.pick(['seaweed', 'coral', 'anemone', 'shell']), x + 2, FLOOR);
      x += L;
    }
    for (let k = 0; k < 2; k++) if (rng.chance(0.5)) B.decorAt(rng.pick(['seaweed', 'coral', 'anemone', 'shell']), x - k * 3 - 1, FLOOR, rng.int(0, 99));
  }
  // gold spots: tucked near floor/ceiling
  B.gold(Math.floor(len * 0.3), 2, 'risky');
  B.gold(Math.floor(len * 0.55), FLOOR - 1, 'hidden');
  B.gold(Math.floor(len * 0.8), 2, 'high');
  // clear solid where gold landed
  for (const g of B.goldSpots) { B.set(g.tx, g.ty, T.EMPTY); B.set(g.tx, g.ty + (g.ty < 5 ? 1 : -1), T.EMPTY); }
  B.fill(x, 2, x + 18, FLOOR - 1, T.EMPTY);
  B.ground(x, x + 18, FLOOR);
  B.spawn('gate', x + 10, FLOOR - 1, {});
  B.trim(x + 19);
  B.fill(B.W - 1, 0, B.W - 1, H - 1, T.GROUND);
  pickGold(ctx, B);
  const area = B.build({ theme: ctx.theme, music: 'w6', water: true, dark: false, autoscroll: 0, gravity: 1 });
  return { area, start: { area: 0, x: 6 * TS + TS / 2, y: FLOOR * TS }, time: 300 };
}

/* ---------- vertical tower ---------- */
function genTower(ctx) {
  const { rng, d } = ctx;
  const W = 22, H = Math.round(70 + d * 30);
  const B = new AreaBuilder(W, H);
  B.themeKey = ctx.theme;
  B.fill(0, 0, 1, H - 1, T.GROUND); B.fill(W - 2, 0, W - 1, H - 1, T.GROUND);
  B.ground(0, W - 1, H - 3);
  let y = H - 3;
  let x0 = 7, pw = 6, side = 1;
  let cp = false;
  let steps = 0;
  const midY = Math.floor(H / 2);
  while (y > 12) {
    const dy = rng.int(3, 4);
    const ny = y - dy;
    const w = rng.int(3, 6);
    // next platform: horizontal gap kept within jump range for the rise
    const maxGap = dy === 4 ? 1 : 2;
    const g = rng.int(-1, maxGap);
    let nx = side > 0 ? x0 + pw + g : x0 - g - w;
    if (nx < 2 || nx + w > W - 2) { side = -side; nx = side > 0 ? x0 + pw + g : x0 - g - w; }
    nx = clamp(nx, 2, W - 2 - w);
    const kind = rng();
    if (kind < 0.65) for (let q = 0; q < w; q++) B.set(nx + q, ny, T.SEMI);
    else if (kind < 0.8) { for (let q = 0; q < w; q++) B.set(nx + q, ny, T.BRICK); const qx = nx + rng.int(0, w - 1); B.set(qx, ny, T.QBLOCK); B.item(qx, ny, blockContent(ctx, B)); }
    else if (kind < 0.9 && ctx.gim.indexOf('crumble') >= 0) for (let q = 0; q < w; q++) B.set(nx + q, ny, T.CRUMBLE);
    else for (let q = 0; q < w; q++) B.set(nx + q, ny, T.HARD);
    if (w >= 4 && rng.chance(0.35 + d * 0.2)) B.spawn(pickEnemy(ctx, ['boomer', 'wisp']), nx + 1, ny - 1, { edgeTurn: true });
    if (rng.chance(0.5)) B.picksRow(nx, nx + w - 1, ny - 2);
    if (rng.chance(0.15 + d * 0.15)) B.spawn('flapper', rng.int(4, W - 5), ny - 2);
    if (steps % 5 === 1) B.gold(nx + Math.floor(w / 2), ny - 4, 'high');
    if (!cp && ny < midY) { cp = true; B.spawn('checkpoint', nx + Math.floor(w / 2), ny - 1); }
    // occasional side ledge with a gold record
    if (steps % 6 === 3) {
      const gx = side > 0 ? 2 : W - 4;
      B.set(gx, ny - 1, T.HARD); B.set(gx + 1, ny - 1, T.HARD);
      B.gold(gx + (side > 0 ? 0 : 1), ny - 3, 'risky');
    }
    x0 = nx; pw = w; y = ny; steps++;
    if (nx <= 4) side = 1; else if (nx + w >= W - 5) side = -1; else if (rng.chance(0.3)) side = -side;
  }
  // summit
  const top = y - 3;
  B.fill(2, top, W - 3, top, T.HARD);
  // openings so the player can reach the summit from the last platform
  const ox = clamp(x0 + 1, 3, W - 5);
  B.set(ox, top, T.SEMI); B.set(ox + 1, top, T.SEMI); B.set(ox - 1, top, T.SEMI);
  B.spawn('gate', Math.floor(W / 2), top - 1, {});
  pickGold(ctx, B);
  const rising = (ctx.w === 9 || ctx.w === 10 || ctx.w === 22) ? { delay: 4, speed: 0.8 + d * 0.35 } : null;
  const area = B.build({ theme: ctx.theme, music: THEMES[ctx.theme].music, water: false, dark: !!ctx.world.dark, autoscroll: 0, tower: true, risingLava: rising, gravity: ctx.world.gravity || 1 });
  return { area, start: { area: 0, x: 5 * TS, y: (H - 3) * TS }, time: 400 };
}

/* ---------- castle / fortress ---------- */
function genCastle(ctx) {
  const { rng, d } = ctx;
  const H = 18, GY = 14;
  const len = Math.round(100 + d * 50 + rng.int(0, 20));
  const B = new AreaBuilder(len + 80, H);
  const th = themeFor(ctx, 'fort');
  B.themeKey = th;
  const st = { x: 0, gy: GY, ctx, B };
  B.ground(0, 11, GY);
  st.x = 12;
  const table = [['flat', 1], ['lava', 3], ['ember', 2.5], ['crushers', 1.5 + d], ['stairs', 1], ['enemies', 1.5], ['spikes', 1.5], ['blocks', 1]];
  if (d > 0.4) table.push(['moving', 1.5], ['falling', 1]);
  const lavaCtx = Object.assign({}, ctx, { gim: ctx.gim.concat(['lava']) });
  st.ctx = lavaCtx;
  let cp = false;
  while (st.x < len) {
    const br = rng.int(1, 2); B.ground(st.x, st.x + br - 1, st.gy); st.x += br;
    if (!cp && st.x > len / 2) { B.ground(st.x, st.x + 4, st.gy); B.spawn('checkpoint', st.x + 2, st.gy - 1); st.x += 5; cp = true; continue; }
    const kind = rng.weighted(table);
    st.x = SIDE_CHUNKS[kind](st);
    st.gy = clamp(st.gy, 12, 15);
  }
  // boss arena
  let x = st.x;
  B.ground(x, x + 3, st.gy); x += 4;
  if (st.gy !== GY) { B.ground(x, x + 1, GY); x += 2; }
  const arenaX0 = x, arenaW = 24;
  B.ground(arenaX0, arenaX0 + arenaW - 1, GY);
  // two side platforms in the arena
  for (let q = 0; q < 3; q++) { B.set(arenaX0 + 4 + q, GY - 4, T.SEMI); B.set(arenaX0 + arenaW - 7 + q, GY - 4, T.SEMI); }
  const doorX = arenaX0 + arenaW;
  B.ground(doorX, doorX + 14, GY);
  B.fill(doorX, 3, doorX, GY - 1, T.HARD);
  B.spawn('boss', arenaX0 + arenaW - 6, GY - 1, { world: ctx.w, arenaX0, arenaX1: doorX, doorX });
  B.spawn('gate', doorX + 8, GY - 1, {});
  const endX = doorX + 15;
  // ceiling band
  for (let cx = 0; cx < endX; cx++) B.fill(cx, 0, cx, 2, T.GROUND);
  B.trim(endX);
  pickGold(ctx, B);
  const area = B.build({ theme: th, music: 'castle', water: false, dark: THEMES[th].dark, autoscroll: 0, castle: true, gravity: ctx.world.gravity || 1 });
  return { area, start: { area: 0, x: 6 * TS + TS / 2, y: GY * TS }, time: 400 };
}
