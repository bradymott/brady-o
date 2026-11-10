/* ============================================================
   SUPER BRADY-O WORLD: the world tour.
   Core data model and registry. Country files (29_tour_<cc>.js)
   call Tour.country({...}) with their levels, theme, enemies,
   set pieces, boss, music and signature power-up.
   See docs/WORLD_TOUR_GUIDE.md and docs/design/LEVEL_OVERHAUL.md §7
   (the v2 spec: levels made of areas, exits, stamps, houses).
   ============================================================ */

// Every stop on the tour, in route order. A stop becomes playable when its
// country file registers it; until then the map shows it "under construction".
// world: the level-id prefix ("7-3" = France, level 3). lon/lat place the pin on the map.
const TOUR_ROUTE = [
  { id: 'mx', world: 1, name: 'Mexico', lon: -99.1, lat: 19.4 },
  { id: 'ec', world: 2, name: 'Ecuador', sub: 'and the Galápagos', lon: -78.5, lat: -0.9 },
  { id: 'br', world: 3, name: 'Brazil', lon: -43.2, lat: -22.9 },
  { id: 'mz', world: 4, name: 'Mozambique', lon: 35.5, lat: -18.6 },
  { id: 'ma', world: 5, name: 'Morocco', lon: -7.0, lat: 31.6 },
  { id: 'es', world: 6, name: 'Spain', lon: -0.4, lat: 39.5 },
  { id: 'fr', world: 7, name: 'France', lon: 2.35, lat: 48.86 },
  { id: 'nl', world: 8, name: 'Amsterdam', sub: 'the Netherlands', lon: 4.9, lat: 52.37, label: 'up' },
  { id: 'id', world: 9, name: 'Bali', sub: 'Indonesia', lon: 115.2, lat: -8.4 },
  { id: 'vn', world: 10, name: 'Vietnam', lon: 105.8, lat: 18.0 },
  { id: 'jp', world: 11, name: 'Japan', lon: 138.6, lat: 36.0 },
  { id: 'np', world: 12, name: 'Nepal', sub: 'the Himalayas', lon: 85.3, lat: 27.7, finale: true },
  { id: 'aq', world: 13, name: 'Antarctica', lon: -62, lat: -70, secret: true },
  { id: 'w22', world: 22, name: 'World 22', lon: -128, lat: -24, secret: true }
];

// Level styles (legacy specs): each level picks one so a country's levels play differently.
//   run    side-scroller          auto   auto-scroll chase       ride   ride a moving vehicle
//   swim   underwater             climb  vertical climb          castle boss fortress (arena at the end)
// decor that glows in dark levels: kind -> [radius, color, y offset]
const TOUR_DECOR_LIGHTS = {};
// art for timed platforms made with st.B.beat(..., kind): kind -> fn(ctx, pad, on, warn, t), drawn in a 32x32 tile box
const TOUR_BEAT_ART = {};
// country looks for library objects (§6.2): skin name -> fn(ctx, e, t)
const TOUR_SKINS = {};
const TOUR_STYLE_PLAN = { run: 'ow', night: 'ow', auto: 'auto', ride: 'auto', swim: 'water', climb: 'tower', castle: 'castle', puzzle: 'under' };
// a v2 level's generator -> the engine's level type (camera hints, intro line)
const TOUR_GEN_PLAN = { strip: 'ow', layered: 'ow', islands: 'sky', shaft: 'tower', room: 'under', maze: 'under', rail: 'auto', ride: 'auto', swim: 'water', climb: 'tower', rise: 'tower', dig: 'under', arena: 'castle' };
// legacy style -> v2 generator
const TOUR_STYLE_GEN = { run: 'strip', night: 'strip', auto: 'strip', castle: 'strip', ride: 'ride', swim: 'swim', climb: 'climb' };

const Tour = {
  route: TOUR_ROUTE,
  stops: {},          // id -> route stop
  countries: {},      // id -> registered country definition
  byWorld: {},        // world number -> country
  pieces: {},         // set pieces: 'flat', 'gap', ... and '<cc>.<name>' for country pieces
  powers: {},         // signature power-ups by id
  enemyInfo: {},      // spawn type -> { place }
  bosses: {},         // boss style -> info
  stamps: {},         // ASCII stamps: '<cc>.<name>' (country) or '<name>' (shared)
  problems: [],       // spec mistakes found while registering (reported by tools/validate_levels.js --rules)

  /* ---------- registration ---------- */
  // def: see docs/WORLD_TOUR_GUIDE.md and LEVEL_OVERHAUL.md §7.2. Required: id, levels, theme(s), enemies, boss.
  country(def) {
    const stop = this.stops[def.id];
    if (!stop) { console.warn('Tour.country: unknown stop', def.id); return null; }
    const C = Object.assign({}, stop, def);
    C.world = stop.world;
    C.colors = Object.assign({ a: '#ff4f8a', b: '#38c8ff', c: '#ffd84a' }, def.colors || {});
    C.music = Object.assign({ level: 'w5', boss: 'boss', map: null }, def.music || {});
    // themes go straight into the shared theme table
    if (def.themes) for (const k in def.themes) THEMES[k] = def.themes[k];
    if (def.painters) Object.assign(BGPaint, def.painters);
    if (def.dyn) Object.assign(BGDyn, def.dyn);
    if (def.decor) Object.assign(Decor, def.decor);
    if (def.decorLights) Object.assign(TOUR_DECOR_LIGHTS, def.decorLights);
    if (def.beatArt) Object.assign(TOUR_BEAT_ART, def.beatArt);
    if (def.platforms) Object.assign(PlatformArt, def.platforms);
    // enemies: spawn type -> class (or a factory)
    if (def.enemies) for (const k in def.enemies) {
      const e = def.enemies[k];
      ENTITY_TYPES[k] = e.cls || e;
      this.enemyInfo[k] = { place: e.place || 'walk', country: C.id };
    }
    if (def.entities) Object.assign(ENTITY_TYPES, def.entities);
    if (def.pieces) for (const k in def.pieces) this.pieces[C.id + '.' + k] = def.pieces[k];
    if (def.boss) this.boss(def.boss);
    if (def.bosses) for (const b of def.bosses) this.boss(b);
    if (def.power) TourPowers.register(def.power);
    if (def.tracks) for (const k in def.tracks) Sound.addTrack && Sound.addTrack(k, def.tracks[k]);
    C.stamps = {}; C.skins = {}; C.houses = []; C.map = { fort: null, start: [0, 0] };
    this.countries[C.id] = C;
    this.byWorld[C.world] = C;
    this.amend(C.id, { stamps: def.stamps, skins: def.skins, houses: def.houses, map: def.map, levels: def.levels || [] }, true);
    this.rebuildOrder();
    return C;
  },
  /* Tour.amend(cc, { stamps, skins, houses, map, levels }): add to (or replace parts of) a registered country from
     a second file, e.g. 29_tour_<cc>_levels.js. levels: specs with n (1-based) replace the level with that number or
     append it. Used by Tour.country itself with whole: true (the whole list). */
  amend(cc, patch, whole) {
    const C = this.countries[cc]; if (!C) { console.warn('Tour.amend: unknown country', cc); return null; }
    patch = patch || {};
    if (patch.stamps) for (const k in patch.stamps) { C.stamps[k] = patch.stamps[k]; this.stamps[cc + '.' + k] = patch.stamps[k]; }
    if (patch.skins) { Object.assign(C.skins, patch.skins); Object.assign(TOUR_SKINS, patch.skins); }
    if (patch.map) Object.assign(C.map, patch.map);
    if (patch.houses) for (const h of patch.houses) {
      const H = Object.assign({ kind: 'stand', name: h.id, stock: [] }, h, { house: true });
      const k = C.houses.findIndex(x => x.id === H.id);
      if (k >= 0) C.houses[k] = H; else C.houses.push(H);
    }
    if (patch.levels) {
      const list = whole ? [] : C.levels.slice();
      patch.levels.forEach((L, k) => {
        const pos = whole ? k : (L.n ? L.n - 1 : list.length);
        if (!whole && !L.n) this.problems.push(cc + ': Tour.amend level without n');
        list[pos] = L;
      });
      C.levels = list.map((L, k) => this.normLevel(C, L, k));
      this.finishLevels(C);
      if (typeof LevelCache !== 'undefined') for (const id of this.levelIds(C)) delete LevelCache[id];
    }
    return C;
  },
  // a level spec in its normal form: index/n, arch, secret (a secret level), exits, legacy fields mapped (§7.6)
  normLevel(C, L, k) {
    const S = Object.assign({ index: k + 1 }, L);
    S.n = k + 1;
    if (L.n != null && L.n !== k + 1) this.problems.push(`${C.world}-${k + 1}: n is ${L.n} but the level is number ${k + 1}`);
    // legacy secret exit: secret: { to: 'aq', sign, need } + a 'secret' piece -> exits.secret to the land
    S.legacySecret = L.secret && typeof L.secret === 'object' ? L.secret : (L.legacySecret || null);
    S.secret = L.secret === true;
    if (!S.areas) S.style = L.style || 'run';
    S.v2 = !!S.areas;
    const ex = L.exits || {};
    S.exits = {};
    S.exits.main = Object.assign({}, ex.main || {});
    if (ex.secret) S.exits.secret = Object.assign({}, ex.secret);
    else if (S.legacySecret && S.legacySecret.to) S.exits.secret = { to: 'land:' + S.legacySecret.to, need: S.legacySecret.need || 0, sign: S.legacySecret.sign };
    for (const key in ex) if (key !== 'main' && key !== 'secret') S.exits[key] = Object.assign({}, ex[key]);
    // the kind of level, for the HUD, the intro and the map
    S.kind = (S.style === 'castle' || S.arch === 'lair' || (S.v2 && S.areas.some(a => a.gen === 'arena' || a.role === 'arena'))) ? 'castle' : 'level';
    return S;
  },
  // after the level list changes: main count, default exits, the engine's world table
  finishLevels(C) {
    let main = 0, seenSecret = false;
    C.levels.forEach((L, k) => {
      if (L.secret) seenSecret = true;
      else { main++; if (seenSecret) this.problems.push(`${C.world}-${k + 1}: a main level after a secret level (secret levels come after the boss)`); }
    });
    C.mainCount = main;
    C.levels.forEach((L, k) => {
      const i = k + 1, m = L.exits.main;
      if (!('to' in m)) m.to = L.secret ? null : i < C.mainCount ? C.world + '-' + (i + 1) : (C.secret ? null : 'country:next');
    });
    if (C.levels.length > C.mainCount + 0 && C.levels.some((L, k) => k >= 5 && !L.secret) && !C.secret) this.problems.push(`${C.id}: more than 5 main levels (extras need secret: true)`);
    // the engine's world table (names, plan, kinds) used by the HUD, menus and saves
    WORLDS[C.world] = {
      set: 'world', tour: C.id, label: String(C.world), name: C.name, theme: C.levels[0] && (C.levels[0].theme || (C.levels[0].areas && C.levels[0].areas[0].theme)),
      secret: !!C.secret, plan: C.levels.map(L => L.v2 ? TOUR_GEN_PLAN[L.areas[0].gen] || 'ow' : TOUR_STYLE_PLAN[L.style] || 'ow'),
      kinds: C.levels.map(L => L.kind), names: C.levels.map(L => L.name), pool: [], mainCount: C.mainCount
    };
  },
  // a boss: { id, name, hp, dims:[w,h], floats, music, brain: { update(b,dt), hurt(b), draw(b,ctx,t), ... } }
  boss(B) {
    BOSS_INFO[B.id] = { name: B.name, hp: B.hp || 4, dims: B.dims || [64, 80], floats: !!B.floats, music: B.music || null, country: B.country || null };
    BOSS_BRAINS[B.id] = B.brain;
    this.bosses[B.id] = B;
  },
  piece(name, fn) { this.pieces[name] = fn; },
  stamp(name, def) { this.stamps[name] = def; },
  rebuildOrder() {
    WORLD_ORDER.length = 0;
    for (const s of TOUR_ROUTE) if (this.countries[s.id]) WORLD_ORDER.push(s.world);
  },

  /* ---------- queries ---------- */
  built(id) { return !!this.countries[id]; },
  countryOf(levelId) { const w = +String(levelId).split('-')[0]; return this.byWorld[w] || null; },
  levelSpec(w, i) { const C = this.byWorld[w]; return C ? C.levels[i - 1] || null : null; },
  specOf(id) { const [w, i] = String(id).split('-').map(Number); return this.levelSpec(w, i); },
  mainCountries() { return TOUR_ROUTE.filter(s => !s.secret && this.countries[s.id]).map(s => this.countries[s.id]); },
  // every playable world number, route order (secret lands last)
  worldList() { return TOUR_ROUTE.filter(s => this.countries[s.id]).map(s => s.world); },
  levelIds(C) { return C.levels.map((L, k) => C.world + '-' + (k + 1)); },
  mainIds(C) { return C.levels.slice(0, C.mainCount).map((L, k) => C.world + '-' + (k + 1)); },
  allLevelIds() { const out = []; for (const w of this.worldList()) for (const id of this.levelIds(this.byWorld[w])) out.push(id); return out; },
  firstLevel() { const m = this.mainCountries()[0]; return m ? m.world + '-1' : '1-1'; },
  isBoss(id) { const C = this.countryOf(id); return !!C && +String(id).split('-')[1] === C.mainCount; },
  isFinale(id) {
    const C = this.countryOf(id); if (!C || C.secret) return false;
    const mains = this.mainCountries();
    // the tour ends at Nepal; until Nepal is built, the last built country's castle stands in
    const last = mains[mains.length - 1];
    return C === last && +id.split('-')[1] === C.mainCount && C.id === 'np';
  },
  // the next main country on the route that has been built
  nextCountry(C) {
    const order = TOUR_ROUTE.filter(s => !s.secret).map(s => s.id);
    for (let k = order.indexOf(C.id) + 1; k < order.length; k++) if (this.countries[order[k]]) return this.countries[order[k]];
    return null;
  },
  prevCountry(C) {
    const order = TOUR_ROUTE.filter(s => !s.secret).map(s => s.id);
    for (let k = order.indexOf(C.id) - 1; k >= 0; k--) if (this.countries[order[k]]) return this.countries[order[k]];
    return null;
  },
  difficulty(w, i) {
    const C = this.byWorld[w];
    if (C && C.secret) return 0.85 + i * 0.03;
    const k = TOUR_ROUTE.filter(s => !s.secret).findIndex(s => s.world === w);
    return clamp(0.05 + Math.max(0, k) * 0.075 + (i - 1) * 0.02, 0, 0.95);
  },
  // map/menu helper: a short line about the level
  levelLine(C, i) { const L = C.levels[i - 1]; return L ? (L.gimmick || '') : ''; },
  // a stop on a country panel: levels first, then houses (mapFrom indices count them in that order)
  panelStops(C) { return C.levels.concat(C.houses || []); },
  house(id) { for (const cc in this.countries) { const H = (this.countries[cc].houses || []).find(h => h.id === id); if (H) return { C: this.countries[cc], H, index: this.countries[cc].levels.length + this.countries[cc].houses.indexOf(H) }; } return null; },
  /* parse an exit target: '1-6' (a level), 'node:1-5' (shortcut), 'house:mx-tienda', 'land:aq', 'flight:ma',
     'country:next', null (back to the map) -> { kind, id, cc } */
  target(to, fromC) {
    if (!to || to === 'map') return { kind: 'map' };
    const s = String(to);
    if (/^\d+-\d+$/.test(s)) return { kind: 'level', id: s, cc: (this.countryOf(s) || {}).id };
    const k = s.indexOf(':'), kind = s.slice(0, k), rest = s.slice(k + 1);
    if (kind === 'node') return { kind: 'node', id: rest, cc: (this.countryOf(rest) || {}).id };
    if (kind === 'house') { const h = this.house(rest); return { kind: 'house', id: rest, cc: h ? h.C.id : null }; }
    if (kind === 'land') return { kind: 'land', id: rest, cc: rest };
    if (kind === 'flight') return { kind: 'flight', id: rest, cc: rest };
    if (kind === 'country') { const N = fromC ? this.nextCountry(fromC) : null; return { kind: 'country', id: N ? N.id : null, cc: N ? N.id : null }; }
    return { kind: 'unknown', id: s };
  }
};
for (const s of TOUR_ROUTE) Tour.stops[s.id] = s;

/* ---------- progression (save v2, §3.5) ---------- */
// Save.data.tour = { at, seen, freed, lands, cards, revealed, paths, flights, bottles, lighthouse, houses, pending }
//   revealed: { '1-6': true, 'house:mx-tienda': true }  secret stops already shown on their panel
//   paths:    { 'mx:2>5': true }                         secret trails already drawn (by panel stop index)
//   pending:  [reveal, ...]                              reveals the map has not played yet (§3.6)
const TourProgress = {
  data() {
    const d = Save.data; if (!d.tour) d.tour = { at: null, seen: {}, freed: {}, lands: {} };
    const T = d.tour;
    for (const k of ['seen', 'freed', 'lands', 'revealed', 'paths', 'flights', 'bottles', 'houses']) if (!T[k] || typeof T[k] !== 'object') T[k] = {};
    if (!Array.isArray(T.pending)) T.pending = [];
    if (T.lighthouse == null) T.lighthouse = false;
    if (!d.exits) d.exits = {};
    return T;
  },
  isDone(id) { return !!Save.data.done[id]; },
  countryDone(C) { return Tour.mainIds(C).every(id => Save.data.done[id]); },
  bossDone(C) { return !!Save.data.done[C.world + '-' + C.mainCount]; },
  countryUnlocked(C) {
    if (!C) return false;
    const T = this.data();
    if (C.secret) return !!T.lands[C.id] || Tour.levelIds(C).some(id => Save.data.unlocked[id]);
    const prev = Tour.prevCountry(C);
    return !prev || this.bossDone(prev) || !!T.flights[C.id] || Tour.levelIds(C).some(id => Save.data.unlocked[id]);
  },
  // §3.5: unlocked[id], the first stop of an unlocked country, or the target of an exit already taken
  isUnlocked(id) {
    if (Save.data.unlocked[id]) return true;
    const C = Tour.countryOf(id); if (!C) return false;
    const i = +id.split('-')[1], L = C.levels[i - 1];
    if (!L || !this.countryUnlocked(C)) return false;
    if (i === 1) return true;
    // main levels also open when the main level before them is done (saves from before exits were recorded)
    if (!L.secret && i <= C.mainCount && Save.data.done[C.world + '-' + (i - 1)]) return true;
    return this.exitInto(id);
  },
  // has any taken exit got this level as its target?
  exitInto(id) {
    const E = Save.data.exits || {};
    for (const src in E) {
      const L = Tour.specOf(src); if (!L) continue;
      for (const key in E[src]) {
        if (!E[src][key] || !L.exits[key]) continue;
        const to = L.exits[key].to;
        if (to === id || to === 'node:' + id) return true;
      }
    }
    return false;
  },
  // secret levels and houses show on the panel once revealed (main levels always do)
  isRevealed(idOrHouse) {
    const T = this.data(), s = String(idOrHouse);
    if (/^\d+-\d+$/.test(s)) { const L = Tour.specOf(s); if (!L) return false; return !L.secret || !!T.revealed[s] || !!Save.data.done[s]; }
    const key = s.startsWith('house:') ? s : 'house:' + s;
    return !!T.revealed[key];
  },
  exitsFound(id) {
    const L = Tour.specOf(id), E = (Save.data.exits || {})[id] || {};
    if (!L) return { found: 0, total: 0 };
    const keys = Object.keys(L.exits).filter(k => k === 'main' || L.exits[k].to);
    return { found: keys.filter(k => E[k]).length, total: keys.length };
  },
  // a panel stop index (levels, then houses) for a level id or house id within its country
  stopIndex(C, idOrHouse) {
    const s = String(idOrHouse);
    if (/^\d+-\d+$/.test(s)) return +s.split('-')[1] - 1;
    const id = s.startsWith('house:') ? s.slice(6) : s;
    const k = (C.houses || []).findIndex(h => h.id === id);
    return k < 0 ? -1 : C.levels.length + k;
  },
  /* exit(id, key): Brady left level `id` through exit `key` ('main' | 'secret' | ...). Records Save.data.exits,
     opens what the exit leads to and returns the reveals for the map, in order (§3.6):
     { kind: 'path', cc, from, to, gold }, { kind: 'stop', cc, id }, { kind: 'house', cc, id }, { kind: 'flight', from, to },
     { kind: 'land', id }. They are also queued in tour.pending until the map has played them. */
  exit(id, key) {
    key = key || 'main';
    const C = Tour.countryOf(id); if (!C) return [];
    const T = this.data(), i = +id.split('-')[1], L = C.levels[i - 1];
    if (!L) return [];
    const E = Save.data.exits;
    (E[id] = E[id] || {})[key] = true;
    if (key !== 'main') Save.data.secretExits[id] = true;
    T.at = C.id;
    const ex = L.exits[key] || (key === 'main' ? L.exits.main : null);
    const out = [];
    if (i === C.mainCount && key === 'main') T.freed[C.id] = true;
    if (!ex) return out;
    const tg = Tour.target(ex.to, C), from = i - 1;
    const pathTo = (idx, gold) => { if (idx >= 0 && !T.paths[C.id + ':' + from + '>' + idx]) out.push({ kind: 'path', cc: C.id, from, to: idx, gold: !!gold }); };
    if (tg.kind === 'level') {
      Save.data.unlocked[tg.id] = true;
      const TL = Tour.specOf(tg.id), TC = Tour.countryOf(tg.id);
      if (TL && TL.secret && TC === C) { pathTo(this.stopIndex(C, tg.id), L.secret); if (!T.revealed[tg.id]) out.push({ kind: 'stop', cc: C.id, id: tg.id }); }
    } else if (tg.kind === 'node') {
      Save.data.unlocked[tg.id] = true;
      if (Tour.countryOf(tg.id) === C) pathTo(this.stopIndex(C, tg.id), true);
    } else if (tg.kind === 'house') {
      pathTo(this.stopIndex(C, tg.id), L.secret);
      if (!T.revealed['house:' + tg.id]) out.push({ kind: 'house', cc: C.id, id: tg.id });
    } else if (tg.kind === 'land') {
      const S = Tour.countries[tg.id];
      if (!T.lands[tg.id]) out.push({ kind: 'land', id: tg.id });
      T.lands[tg.id] = true;
      if (S) Save.data.unlocked[S.world + '-1'] = true;
    } else if (tg.kind === 'flight') {
      const S = Tour.countries[tg.id];
      if (!T.flights[tg.id]) out.push({ kind: 'flight', from: C.id, to: tg.id });
      T.flights[tg.id] = true;
      if (S) Save.data.unlocked[S.world + '-1'] = true;
    } else if (tg.kind === 'country') {
      const N = tg.id ? Tour.countries[tg.id] : null;
      if (N) Save.data.unlocked[N.world + '-1'] = true;
    }
    for (const r of out) if (!T.pending.some(q => JSON.stringify(q) === JSON.stringify(r))) T.pending.push(r);
    return out;
  },
  // the map played a reveal: remember it so it never animates again
  revealDone(r) {
    const T = this.data();
    if (r.kind === 'path') T.paths[r.cc + ':' + r.from + '>' + r.to] = true;
    if (r.kind === 'stop') T.revealed[r.id] = true;
    if (r.kind === 'house') T.revealed['house:' + r.id] = true;
    const k = T.pending.findIndex(q => JSON.stringify(q) === JSON.stringify(r));
    if (k >= 0) T.pending.splice(k, 1);
  },
  // called by Play when a level is cleared (legacy entry point): returns what opened (for the map)
  complete(id, secret, key) {
    const C = Tour.countryOf(id); if (!C) return null;
    key = key || (secret ? 'secret' : 'main');
    const reveals = this.exit(id, key), out = { id, key, reveals };
    const i = +id.split('-')[1], L = C.levels[i - 1];
    const tg = L && L.exits[key] ? Tour.target(L.exits[key].to, C) : null;
    if (tg && tg.kind === 'country' && tg.id) out.nextCountry = tg.id;
    if (tg && tg.kind === 'land') out.secretLand = tg.id;
    if (tg && tg.kind === 'flight') out.flight = tg.id;
    return out;
  },
  goldCount(id) { const g = Save.data.gold[id]; return g ? g.filter(Boolean).length : 0; },
  countryGold(C) { let n = 0; for (const id of Tour.levelIds(C)) n += this.goldCount(id); return n; },
  // levels and postcards: hidden lands and unrevealed secret levels stay out of the totals (houses never count)
  totals() {
    let done = 0, total = 0, gold = 0, goldTotal = 0, mainDone = 0, secretDone = 0;
    for (const w of Tour.worldList()) {
      const C = Tour.byWorld[w]; if (C.secret && !this.countryUnlocked(C)) continue;
      Tour.levelIds(C).forEach((id, k) => {
        const L = C.levels[k], isDone = !!Save.data.done[id];
        gold += this.goldCount(id);
        if (L.secret && !this.isRevealed(id)) return;
        total++; goldTotal += 3;
        if (isDone) { done++; if (L.secret) secretDone++; else mainDone++; }
      });
    }
    return { done, total, gold, goldTotal, mainDone, secretDone };
  }
};

/* ---------- small helpers shared by the country files ---------- */
const TourKit = {
  // play a sound if it exists (new names fall back to an existing one)
  sfx(name, fallback, opts) { if ((Sound.sfxNames || []).indexOf(name) >= 0) Sound.play(name, opts); else if (fallback) Sound.play(fallback, opts); },
  say(g, e, text, col) { g.parts.text(e.cx, e.y - 12, text, col || '#ffffff'); },
  near(e, p, dx, dy) { return p && !p.dead && Math.abs(p.cx - e.cx) < dx * TS && Math.abs(p.cy - e.cy) < dy * TS; },
  // a soft drop shadow ellipse under a character
  shadow(ctx, x, y, w) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.22, 0, 0, TAU); ctx.fill(); },
  // two friendly cartoon eyes looking toward dir
  eyes(ctx, x, y, dir, gap, r, angry) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x + s * gap, y, r, r * 1.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x + s * gap + dir * r * 0.35, y + r * 0.15, r * 0.55, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + s * gap + dir * r * 0.35 - r * 0.2, y - r * 0.2, r * 0.18, 0, TAU); ctx.fill();
      if (angry) { ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + s * gap - r, y - r * 1.4 - s * 1.2); ctx.lineTo(x + s * gap + r, y - r * 1.4 + s * 1.2); ctx.stroke(); }
    }
  },
  // two little legs that step while walking
  feet(ctx, x, y, t, col, sp, len, still) {
    const k = still ? 0 : Math.sin(t * 12);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - sp, y - len); ctx.lineTo(x - sp + k * 3, y - Math.max(0, k) * 2);
    ctx.moveTo(x + sp, y - len); ctx.lineTo(x + sp - k * 3, y - Math.max(0, -k) * 2); ctx.stroke();
    ctx.lineCap = 'butt';
  },
  // dizzy stars over a stunned enemy
  dizzy(ctx, x, y, t) {
    for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3; ctx.fillStyle = ['#ffd84a', '#ffffff', '#ff9ad8'][i]; ctx.beginPath(); TourKit.star(ctx, x + Math.cos(a) * 10, y + Math.sin(a) * 3, 3.2, 1.4, 5); ctx.fill(); }
  },
  star(ctx, x, y, r1, r2, n) { for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r2 : r1; if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); },
  reduceMotion() {
    const s = Save.data && Save.data.settings;
    if (s && s.reduceMotion != null) return !!s.reduceMotion;
    try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }
};
