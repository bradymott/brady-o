/* ============================================================
   SUPER BRADY-O WORLD: the world tour.
   Core data model and registry. Country files (29_tour_<cc>.js)
   call Tour.country({...}) with their levels, theme, enemies,
   set pieces, boss, music and signature power-up.
   See docs/WORLD_TOUR_GUIDE.md.
   ============================================================ */

// Every stop on the tour, in route order. A stop becomes playable when its
// country file registers it; until then the map shows it "under construction".
// world: the level-id prefix ("7-3" = Paris, level 3). lon/lat place the pin on the map.
const TOUR_ROUTE = [
  { id: 'mx', world: 1, name: 'Mexico', lon: -99.1, lat: 19.4 },
  { id: 'ec', world: 2, name: 'Ecuador', sub: 'and the Galápagos', lon: -78.5, lat: -0.9 },
  { id: 'br', world: 3, name: 'Brazil', lon: -43.2, lat: -22.9 },
  { id: 'mz', world: 4, name: 'Mozambique', lon: 35.5, lat: -18.6 },
  { id: 'ma', world: 5, name: 'Morocco', lon: -7.0, lat: 31.6 },
  { id: 'es', world: 6, name: 'Valencia', sub: 'Spain', lon: -0.4, lat: 39.5 },
  { id: 'fr', world: 7, name: 'Paris', sub: 'France', lon: 2.35, lat: 48.86 },
  { id: 'nl', world: 8, name: 'Amsterdam', sub: 'the Netherlands', lon: 4.9, lat: 52.37, label: 'up' },
  { id: 'id', world: 9, name: 'Bali', sub: 'Indonesia', lon: 115.2, lat: -8.4 },
  { id: 'vn', world: 10, name: 'Vietnam', lon: 105.8, lat: 18.0 },
  { id: 'jp', world: 11, name: 'Japan', lon: 138.6, lat: 36.0 },
  { id: 'np', world: 12, name: 'Nepal', sub: 'the Himalayas', lon: 85.3, lat: 27.7, finale: true },
  { id: 'aq', world: 13, name: 'Antarctica', lon: -62, lat: -70, secret: true },
  { id: 'w22', world: 22, name: 'World 22', lon: -128, lat: -24, secret: true }
];

// Level styles: each level picks one so a country's levels play differently.
//   run    side-scroller          auto   auto-scroll chase       ride   ride a moving vehicle
//   swim   underwater             climb  vertical climb          castle boss fortress (arena at the end)
// decor that glows in dark levels: kind -> [radius, color, y offset]
const TOUR_DECOR_LIGHTS = {};
// art for timed platforms made with st.B.beat(..., kind): kind -> fn(ctx, pad, on, warn, t), drawn in a 32x32 tile box
const TOUR_BEAT_ART = {};
const TOUR_STYLE_PLAN = { run: 'ow', night: 'ow', auto: 'auto', ride: 'auto', swim: 'water', climb: 'tower', castle: 'castle', puzzle: 'under' };

const Tour = {
  route: TOUR_ROUTE,
  stops: {},          // id -> route stop
  countries: {},      // id -> registered country definition
  byWorld: {},        // world number -> country
  pieces: {},         // set pieces: 'flat', 'gap', ... and '<cc>.<name>' for country pieces
  powers: {},         // signature power-ups by id
  enemyInfo: {},      // spawn type -> { place }
  bosses: {},         // boss style -> info

  /* ---------- registration ---------- */
  // def: see docs/WORLD_TOUR_GUIDE.md. Required: id, levels (5), theme(s), enemies, boss.
  country(def) {
    const stop = this.stops[def.id];
    if (!stop) { console.warn('Tour.country: unknown stop', def.id); return null; }
    const C = Object.assign({}, stop, def);
    C.world = stop.world;
    C.levels = (def.levels || []).map((L, k) => Object.assign({ index: k + 1, style: 'run' }, L));
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
    this.countries[C.id] = C;
    this.byWorld[C.world] = C;
    // the engine's world table (names, plan, kinds) used by the HUD, menus and saves
    WORLDS[C.world] = {
      set: 'world', tour: C.id, label: String(C.world), name: C.name, theme: C.levels[0] && C.levels[0].theme,
      secret: !!C.secret, plan: C.levels.map(L => TOUR_STYLE_PLAN[L.style] || 'ow'),
      kinds: C.levels.map(L => L.style === 'castle' ? 'castle' : 'level'), names: C.levels.map(L => L.name), pool: []
    };
    this.rebuildOrder();
    return C;
  },
  // a boss: { id, name, hp, dims:[w,h], floats, music, brain: { update(b,dt), hurt(b), draw(b,ctx,t), ... } }
  boss(B) {
    BOSS_INFO[B.id] = { name: B.name, hp: B.hp || 4, dims: B.dims || [64, 80], floats: !!B.floats, music: B.music || null, country: B.country || null };
    BOSS_BRAINS[B.id] = B.brain;
    this.bosses[B.id] = B;
  },
  piece(name, fn) { this.pieces[name] = fn; },
  rebuildOrder() {
    WORLD_ORDER.length = 0;
    for (const s of TOUR_ROUTE) if (this.countries[s.id]) WORLD_ORDER.push(s.world);
  },

  /* ---------- queries ---------- */
  built(id) { return !!this.countries[id]; },
  countryOf(levelId) { const w = +String(levelId).split('-')[0]; return this.byWorld[w] || null; },
  levelSpec(w, i) { const C = this.byWorld[w]; return C ? C.levels[i - 1] || null : null; },
  mainCountries() { return TOUR_ROUTE.filter(s => !s.secret && this.countries[s.id]).map(s => this.countries[s.id]); },
  // every playable world number, route order (secret lands last)
  worldList() { return TOUR_ROUTE.filter(s => this.countries[s.id]).map(s => s.world); },
  levelIds(C) { return C.levels.map((L, k) => C.world + '-' + (k + 1)); },
  allLevelIds() { const out = []; for (const w of this.worldList()) for (const id of this.levelIds(this.byWorld[w])) out.push(id); return out; },
  firstLevel() { const m = this.mainCountries()[0]; return m ? m.world + '-1' : '1-1'; },
  isFinale(id) {
    const C = this.countryOf(id); if (!C || C.secret) return false;
    const mains = this.mainCountries();
    // the tour ends at Nepal; until Nepal is built, the last built country's castle stands in
    const last = mains[mains.length - 1];
    return C === last && +id.split('-')[1] === C.levels.length && C.id === 'np';
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
  levelLine(C, i) { const L = C.levels[i - 1]; return L ? (L.gimmick || '') : ''; }
};
for (const s of TOUR_ROUTE) Tour.stops[s.id] = s;

/* ---------- progression ---------- */
// Save.data.tour = { at: country id Brady is in, seen: {cc: true}, freed: {cc: true} (landmarks restored) }
const TourProgress = {
  data() { const d = Save.data; if (!d.tour) d.tour = { at: null, seen: {}, freed: {}, lands: {} }; return d.tour; },
  isDone(id) { return !!Save.data.done[id]; },
  countryDone(C) { return Tour.levelIds(C).every(id => Save.data.done[id]); },
  bossDone(C) { return !!Save.data.done[C.world + '-' + C.levels.length]; },
  countryUnlocked(C) {
    if (!C) return false;
    if (C.secret) return !!this.data().lands[C.id] || Tour.levelIds(C).some(id => Save.data.unlocked[id]);
    const prev = Tour.prevCountry(C);
    return !prev || this.bossDone(prev) || Tour.levelIds(C).some(id => Save.data.unlocked[id]);
  },
  isUnlocked(id) {
    if (Save.data.unlocked[id]) return true;
    const C = Tour.countryOf(id); if (!C) return false;
    const i = +id.split('-')[1];
    if (!this.countryUnlocked(C)) return false;
    return i === 1 || !!Save.data.done[C.world + '-' + (i - 1)];
  },
  // called by Play when a level is cleared; returns what opened (for the map)
  complete(id, secret) {
    const C = Tour.countryOf(id); if (!C) return null;
    const T = this.data(), i = +id.split('-')[1], out = { id };
    T.at = C.id;
    if (i < C.levels.length) Save.data.unlocked[C.world + '-' + (i + 1)] = true;
    if (i === C.levels.length) {
      T.freed[C.id] = true;
      const N = Tour.nextCountry(C);
      if (N && !C.secret) { Save.data.unlocked[N.world + '-1'] = true; out.nextCountry = N.id; }
    }
    const L = C.levels[i - 1];
    if (secret && L && L.secret && L.secret.to) {
      const S = Tour.countries[L.secret.to];
      T.lands[L.secret.to] = true; out.secretLand = L.secret.to;
      if (S) Save.data.unlocked[S.world + '-1'] = true;
    }
    return out;
  },
  goldCount(id) { const g = Save.data.gold[id]; return g ? g.filter(Boolean).length : 0; },
  countryGold(C) { let n = 0; for (const id of Tour.levelIds(C)) n += this.goldCount(id); return n; },
  totals() {
    let done = 0, total = 0, gold = 0, goldTotal = 0;
    for (const w of Tour.worldList()) for (const id of Tour.levelIds(Tour.byWorld[w])) { total++; goldTotal += 3; if (Save.data.done[id]) done++; gold += this.goldCount(id); }
    return { done, total, gold, goldTotal };
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
