/* ============================================================
   Long sessions: what a level, a death or a map visit leaves
   behind must not pile up over an evening of play (Brady's
   "laggy after a couple of levels", "glitchy after a few deaths
   and levels" on his iPhone).
   - Play.onSceneExit (called by Game.setScene, src/99_main.js):
     a level that is left (a death restarts the level with a new
     Play) frees its HUD and light-map canvases at once instead of
     leaving them to the garbage collector.
   - PostFX.glow: the glow sprites are cached per colour string;
     a caller that asks for ever-new colours (the old mushroom
     sparkles: a new hsl() hue every frame, 16 new canvases a
     frame) is capped and the cache freed.
   - SessionStats.snapshot(): the counts tools/sbw_session_test.js
     watches over repeated levels, deaths, bosses, trips and maps.
   ============================================================ */
if (typeof Play !== 'undefined') {
  Play.prototype.onSceneExit = function () {
    for (const k of ['hudC', 'lightCanvas']) { const c = this[k]; if (c) { c.width = 1; c.height = 1; this[k] = null; } }
    this.drawLists = null;
  };
}
if (typeof PostFX !== 'undefined') {
  const glow0 = PostFX.glow;
  let made = 0;
  PostFX.glow = function (col) {
    if (!this.glowCache[col] && ++made > 96) {
      for (const k in this.glowCache) releaseCanvases(this.glowCache[k]);
      this.glowCache = {}; made = 1;
    }
    return glow0.call(this, col);
  };
}

const SessionStats = {
  px(c) { return c && c.width ? c.width * c.height : 0; },
  // canvases (and their pixels) held by a value: a canvas, arrays and plain objects of them, a few levels deep
  held(o, out, depth) {
    out = out || { n: 0, px: 0 }; depth = depth || 0;
    if (!o || depth > 4 || typeof o !== 'object') return out;
    if (typeof HTMLCanvasElement !== 'undefined' && o instanceof HTMLCanvasElement) { if (o.width * o.height > 1) { out.n++; out.px += o.width * o.height; } return out; }
    if (Array.isArray(o)) { for (const v of o) this.held(v, out, depth + 1); return out; }
    if (o instanceof Map) { for (const v of o.values()) this.held(v, out, depth + 1); return out; }
    if (Object.getPrototypeOf(o) !== Object.prototype) return out;
    for (const k in o) if (k !== 'theme' && k !== 'spec') this.held(o[k], out, depth + 1);
    return out;
  },
  snapshot() {
    const s = {}, g = typeof Game !== 'undefined' ? Game.scene : null;
    s.scene = g ? g.constructor.name : null;
    if (typeof Play !== 'undefined' && g instanceof Play) {
      s.state = g.state; s.level = g.id; s.area = g.area ? g.area.idx : null;
      s.ents = g.entities.length; s.parts = g.parts.list.length; s.weather = g.weather ? g.weather.list.length : 0;
      s.rtAreas = g.rt.filter(Boolean).length;
      s.trails = g.area && g.area.trails ? g.area.trails.length : 0;
      // surf cells of the CACHED level that are trail values (3 slick, 4 hot): must stay 0 (they leak into later tries)
      let stuck = 0; for (const a of g.level.areas) if (a.surf) for (let i = 0; i < a.surf.length; i++) if (a.surf[i] === 3 || a.surf[i] === 4) stuck++;
      s.stuckSurf = stuck;
      s.dizzy = +(g.dizzy || 0).toFixed(2); s.lsdK = +(g.lsdK || 0).toFixed(2); s.trip = +(g.trip || 0).toFixed(2); s.tripJoint = +(g.tripJoint || 0).toFixed(2);
      s.hurry = !!g.hurry; s.inkBlots = g.inkBlots ? g.inkBlots.length : 0;
      const p = g.player; if (p) { s.ps = p.state; s.power = p.power; s.fx = p.fx ? Object.keys(p.fx).filter(k => p.fx[k] > 0).join(',') : ''; }
    }
    const add = (name, v) => { const h = this.held(v); s[name + 'N'] = h.n; s[name + 'MP'] = +(h.px / 1e6).toFixed(3); };
    if (typeof BG !== 'undefined') { s.bgEntries = Object.keys(BG.cache).length; add('bg', Object.values(BG.cache).map(b => [b.layers.map(L => L.canvas), b.cel, b.stars, b.clouds.map(c => c.c)])); add('bgFrame', BG.frameCache && BG.frameCache.c); }
    if (typeof TileArt !== 'undefined') { s.tileEntries = Object.keys(TileArt.cache).length; add('tiles', TileArt.cache); }
    if (typeof Ink !== 'undefined') {
      // (older builds have fewer of these: what exists is counted)
      if (Ink.scratch && Ink.scratch.size != null) { s.inkScratch = Ink.scratch.size; s.inkScratchMP = +(Ink.scratchPx / 1e6).toFixed(3); }
      else if (Ink.pool) { const h = this.held(Ink.pool); s.inkScratch = h.n; s.inkScratchMP = +(h.px / 1e6).toFixed(3); }   // (the old grow-only scratch set)
      if (Ink.heldLru) { s.inkHeld = Ink.heldLru.size; s.inkHeldMP = +(Ink.heldPx / 1e6).toFixed(3); }
      if (Ink.memo) { s.inkMemo = Ink.memo.size; s.inkMemoMP = +(Ink.memoPx / 1e6).toFixed(3); }
      if (Ink.boxes) s.inkBoxes = Ink.boxes.size; if (Ink.reach) s.inkReach = Ink.reach.size;
    }
    const IC = typeof window !== 'undefined' && window.BRADY_INKCACHE;   // (src/30_tour_sprites.js keeps it in its own scope)
    if (IC) { s.inkCache = IC.map.size; add('inkCache', [...IC.map.values()].map(e => e.c)); s.inkCacheBakes = IC.bakes || 0; }
    if (typeof PostFX !== 'undefined') {
      s.glows = Object.keys(PostFX.glowCache).length;
      add('postfx', ['tmp', 'bloomA', 'bloomB', 'bloomC', 'tripWarp', 'tripSmall', 'tripSmoke', 'shroomWob'].map(k => PostFX[k]));
    }
    if (typeof SpriteCache !== 'undefined') s.spriteCache = Object.keys(SpriteCache.map).length;
    if (typeof LevelCache !== 'undefined') s.levelCache = Object.keys(LevelCache).length;
    if (typeof Atlas !== 'undefined') { s.atlases = Object.keys(Atlas.atlases).length; s.atlasMB = Atlas.decodedMB(); s.atlasListeners = Atlas.listeners.length; }
    if (typeof TourOverworld !== 'undefined') { const o = TourOverworld.owner; add('owCache', [o && o.cache && o.cache.cv, TourOverworld.spare]); }
    if (typeof TourMapKeys !== 'undefined') s.mapTaps = TourMapKeys.taps ? TourMapKeys.taps.length : 0;
    if (typeof TripFX !== 'undefined') s.tripFrames = TripFX.frames.length;
    if (typeof Game !== 'undefined') { add('vignette', Game.vignette); s.canvasMP = +(this.px(Game.canvas) / 1e6).toFixed(3); s.rows = +Game.rows.toFixed(2); s.errors = Math.max(Game.errors || 0, window.__sbwErrors || 0); }
    if (typeof entityFault !== 'undefined' && entityFault.seen) s.faultKinds = Object.keys(entityFault.seen).length;
    if (typeof Input !== 'undefined') { s.touches = Input.touches.size; s.uiTaps = Input.taps.length; }
    if (typeof TourPicker !== 'undefined') s.pickerHeld = TourPicker.touchId != null;
    return s;
  },
  // for the test: a few tiles of an enemy's slime / coffee trail under Brady (src/28_tour_i_behave.js TourTrails)
  layTrail(g, kind, n) {
    if (typeof TourTrails === 'undefined' || !g || !g.player) return 0;
    const p = g.player, ty = Math.floor((p.y + p.h + 2) / TS), tx0 = Math.floor(p.cx / TS);
    let k = 0; for (let i = -(n || 3); i <= (n || 3); i++) { TourTrails.lay(g, tx0 + i, ty, kind || 'slime', 30); k++; }
    return g.area.trails ? g.area.trails.length : 0;
  }
};
try { window.BRADY_SESSION = SessionStats; } catch (e) { /* not in a browser */ }
