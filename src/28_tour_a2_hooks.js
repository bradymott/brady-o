/* ============================================================
   World tour: the secrets contracts (docs/design/SECRETS_WARPS_SWITCHES.md §5,
   the exact API in docs/design/SECRETS_CONTRACTS.md). The one place the engine
   calls out to the secret-room types (WP-4), the backstage seams and the
   warps (WP-3), the buttons and their rules (WP-5) and the map extras
   (WP-2). With nothing registered, every call site is a no-op and the game
   plays exactly as before.
   This file sorts before 28_tour_a_core.js: it defines objects only and never
   touches Tour, Save or the engine at load. Everything is called at run time.
   ============================================================ */

/* ---------- TourHooks: named lists of handlers ----------
   run(name, ...args): handlers in order, the first truthy return wins (and is returned); null if none.
   each(name, ...args): every handler, results ignored.
   A handler that throws is logged once (console.error, window.__sbwErrors) and skipped, so a broken extra never
   stops a frame. Register with TourHooks.on(name, fn); remove with TourHooks.off(name, fn).
   Every engine call site is guarded with `typeof TourHooks !== 'undefined'` and a length check. */
const TourHooks = {
  // the player and the play loop (src/11_player.js, src/12_play.js)
  offEdge: [],        // (play, player, side, seam) -> true when the handler took Brady through the seam (WP-3)
  playerDie: [],      // (play, player, reason) -> true to cancel this death (soft catches, WP-4's hourglass)
  playUpdate: [],     // (play, dt) every frame in Play.update, after the player moved and collided
  areaLoaded: [],     // (play, area) at the end of every Play.loadArea (room clocks arm, timers re-base)
  camera: [],         // (play, dt) at the end of Play.updateCamera: may set play.camX / play.camY (TourHooks.peek)
  entityDraw: [],     // (play, ctx, e) -> true when the handler drew e itself (hats, dancing: WP-5). ctx is saved/restored
  afterEntities: [],  // (play, ctx, layers) after the entity layers and Brady, world transform set (overlays)
  levelClear: [],     // (play, gate) right after a level is cleared and recorded (a warp's transit, WP-3)
  resultsTitle: [],   // (play) -> a string for the results title (default: the exit kind's title, then the engine's)
  // menus (src/13_ui.js)
  pausePages: [],     // (play) -> { label, fn, size? } | null: one extra full-width row in the pause menu (WP-5's page)
  settings: [],       // (scene) -> { label, value, fn } | null: one extra row in Settings (WP-5's effects switch)
  // the maps: the call sites belong to WP-2 (28_tour_fd_overworld.js, 28_tour_f_map.js)
  owDraw: [], owTap: [], routeDraw: [],
  // the treasure-map peek (WP-4 fills it): (play, x, y, secs) -> pans the camera to (x, y) and back
  peek: null,

  on(name, fn) { (this[name] || (this[name] = [])).push(fn); return fn; },
  off(name, fn) { const L = this[name]; if (L) { const k = L.indexOf(fn); if (k >= 0) L.splice(k, 1); } },
  run(name, ...a) {
    const L = this[name];
    if (!L || !L.length) return null;
    for (let k = 0; k < L.length; k++) {
      let r;
      try { r = L[k](...a); } catch (err) { this.fault(name, err); continue; }
      if (r) return r;
    }
    return null;
  },
  each(name, ...a) {
    const L = this[name];
    if (!L || !L.length) return;
    for (let k = 0; k < L.length; k++) { try { L[k](...a); } catch (err) { this.fault(name, err); } }
  },
  fault(name, err) {
    try {
      if (typeof window !== 'undefined') window.__sbwErrors = (window.__sbwErrors || 0) + 1;
      const key = name + ': ' + String(err && err.message || err), seen = this.faults || (this.faults = {});
      if (!seen[key]) { seen[key] = 1; console.error('TourHooks ' + key, err); }
    } catch (e2) { /* never throw from here */ }
  },

  /* ---------- engine helpers (the call sites use these, not the lists directly) ---------- */
  // Player.update: a seam on this area's edge, crossed this frame, whose needs are met -> offEdge handlers
  offEdgeCheck(play, p, inp) {
    const A = play.area, s = TourSeams.hit(A, p, inp ? (inp.left ? -1 : inp.right ? 1 : 0) : 0);
    if (!s || !TourNeeds.ok(s.needs)) return false;
    return !!this.run('offEdge', play, p, s.side, s);
  },
  // Play.draw: draw one entity, letting an entityDraw handler wrap it
  drawEntity(play, ctx, e) {
    const L = this.entityDraw;
    for (let k = 0; k < L.length; k++) {
      let drew = false;
      ctx.save();
      try { drew = !!L[k](play, ctx, e); } catch (err) { this.fault('entityDraw', err); }
      ctx.restore();
      if (drew) return;
    }
    e.draw(ctx, play.t);
  },

  /* ---------- secret-room types (WP-4) ----------
     TourHooks.room(type, def): def = {
       spec(A, ctx)  -> optional: a rewritten area spec before the gen runs (keep A.id; e.g. hourglass -> gen 'rise')
       build(ctx, A, built) -> optional: after the gen; built = { area, anchors, B } (push spawns, set area fields)
       timed: true   -> optional: documentation flag (the validator does not simulate the clock; §2 rooms)
     }
     The area keeps area.roomType = A.room. 'pantry' (today's shelf room) needs no def. */
  rooms: {},
  room(type, def) { this.rooms[type] = def || {}; return this.rooms[type]; },
  ROOM_TYPES: ['pantry', 'closing', 'fairground', 'bouncy', 'evidence', 'recipe', 'topsy', 'hourglass', 'treasure'],
  // generateV2: the area spec the gen should see (the same object when there is no registered room type)
  roomSpec(A, ctx) {
    if (!A || !A.room || A.room === 'pantry') return A;
    const def = this.rooms[A.room];
    if (!def) { if (ctx && ctx.problems) ctx.problems.push(`area ${A.id}: room type '${A.room}' is not registered (built as a plain room)`); return A; }
    if (!def.spec) return A;
    const A2 = def.spec(A, ctx) || A;
    if (A2 !== A && A2.id !== A.id) A2.id = A.id;
    return A2;
  },
  roomBuilt(A, ctx, built) {
    const def = A && A.room && this.rooms[A.room];
    if (def && def.build) def.build(ctx, A, built);
  },

  /* ---------- exit kinds (WP-3: 'warp') ----------
     exits.<key>.via names a kind: TourHooks.exitKind('warp', { title: 'WORMHOLE!', marksDone: true }).
     title: the results title for that exit; marksDone (default true): whether taking it sets Save.data.done[id]. */
  exitKinds: {},
  exitKind(via, def) { this.exitKinds[via] = def || {}; return this.exitKinds[via]; },
  exitSpec(level, key) { const ex = level && (level.exits || (level.design && level.design.exits)); return (ex && ex[key || 'main']) || null; },
  kindOf(level, key) { const ex = this.exitSpec(level, key); return ex && ex.via ? this.exitKinds[ex.via] || null : null; },
  marksDone(level, key) { const k = this.kindOf(level, key); return !(k && k.marksDone === false); },
  titleFor(play) {
    const r = this.run('resultsTitle', play);
    if (r) return String(r);
    const k = play && play.level && this.kindOf(play.level, play.exitKey);
    return k && k.title ? k.title : null;
  }
};

/* ---------- TourNeeds: 'rule:<n>' (that rule revoked) and 'rules:<k>' (any k rules revoked) ----------
   needs may be a string or an array of strings (all must hold). The rule set is a Set or array of rule numbers,
   or 'all' (the validator's "rules on" pass). In the game the set is Save.data.tour.rules (WP-2's save field:
   { <n>: { at } }); TourNeeds.provider can replace that. */
const TourNeeds = {
  provider: null,
  valid(needs) {
    if (!needs) return true;
    return [].concat(needs).every(n => typeof n === 'string' && /^rules?:\d+$/.test(n));
  },
  met(needs, rules) {
    if (!needs) return true;
    if (rules === 'all') return true;
    // any Set-like (a Set from another realm too: the node tests), else an array or a single rule number
    const S = rules && typeof rules.has === 'function' ? rules : new Set([].concat(rules || []).map(Number));
    return [].concat(needs).every(n => {
      const m = /^(rules?):(\d+)$/.exec(String(n));
      if (!m) return false;
      return m[1] === 'rule' ? S.has(+m[2]) : S.size >= +m[2];
    });
  },
  revoked() {
    if (this.provider) return this.provider();
    const T = typeof Save !== 'undefined' && Save.data && Save.data.tour, R = T && T.rules;
    return new Set(R && typeof R === 'object' ? Object.keys(R).map(Number) : []);
  },
  ok(needs) { return !needs || this.met(needs, this.revoked()); },
  // does a built level use needs anywhere (exits, spawns, locks, seams)? validate_levels runs such a level twice
  inLevel(level) {
    const ex = level.exits || {};
    if (Object.keys(ex).some(k => ex[k] && ex[k].needs)) return true;
    return level.areas.some(a => a.needs || a.spawns.some(s => s.needs) || (a.locks || []).some(L => L.needs) || (a.seams || []).some(s => s.needs));
  }
};

/* ---------- TourSeams: invisible spans on an area's edge that lead to another area ----------
   A built area may carry area.seams = [{ side: 'top' | 'bottom' | 'left' | 'right', a, b, toRef, target, needs }]:
   a..b is the tile span along that edge (columns for top/bottom, rows for left/right), target { area, x, y } is
   resolved by generateV2 from toRef ('area@anchor', like door refs). The geometry below is shared by the game and
   the validator, so both agree on what "crossing" means:
     top:    the whole body is above y = 0 (b.y + b.h < 0), its centre column inside the span
     bottom: the body's top is past the last row (b.y > H * TS - 8), its centre column inside the span; this is
             checked before the pit death line
     left:   pressing left (push < 0) against x = 0, the body's centre row inside the span
     right:  pressing right (push > 0) against the right edge, the body's centre row inside the span */
const TourSeams = {
  SIDES: { top: true, bottom: true, left: true, right: true },
  // spawn types that count as an Under-Stage pit's tell (a spawn with tell: true counts too)
  TELLS: { tourCrashMat: true },
  norm(s) {
    const o = { side: s.side, a: Math.min(s.a, s.b), b: Math.max(s.a, s.b), toRef: s.toRef || s.to || null };
    if (s.needs) o.needs = s.needs;
    if (s.tell) o.tell = s.tell;
    return o;
  },
  // record a seam on an AreaBuilder (pieces and the stamp legend use this); generateV2 moves it onto the area
  add(B, s) { const o = this.norm(s); (B.seams || (B.seams = [])).push(o); return o; },
  // an area spec's return seam: back: { side, span: [a, b], to, needs, tell } (tell: the pit's tell is drawn by the room)
  fromBack(back) { return back ? this.norm({ side: back.side, a: back.span[0], b: back.span[1], to: back.to, needs: back.needs, tell: back.tell }) : null; },
  hit(area, b, push) {
    const S = area.seams;
    if (!S) return null;
    const W = area.W * TS, H = area.H * TS;
    for (const s of S) {
      let along;
      if (s.side === 'top') { if (!(b.y + b.h < 0)) continue; along = b.x + b.w / 2; }
      else if (s.side === 'bottom') { if (!(b.y > H - 8)) continue; along = b.x + b.w / 2; }
      else if (s.side === 'left') { if (!(push < 0 && b.x <= 1)) continue; along = b.y + b.h / 2; }
      else if (s.side === 'right') { if (!(push > 0 && b.x + b.w >= W - 1)) continue; along = b.y + b.h / 2; }
      else continue;
      const t = Math.floor(along / TS);
      if (t >= s.a && t <= s.b) return s;
    }
    return null;
  },
  // the validator's standing spots: on the edge column, the body's centre row inside a side seam's span
  nodeHit(area, tx, ty, D) {
    const S = area.seams;
    if (!S) return null;
    const row = Math.floor((ty * TS - D.h / 2) / TS);
    for (const s of S) {
      if (s.side === 'left' ? tx !== 0 : s.side === 'right' ? tx !== area.W - 1 : true) continue;
      if (row >= s.a && row <= s.b) return s;
    }
    return null;
  },
  // the validator's swimming cells (water areas, water lines): a cell on the edge inside a seam's span
  cellHit(area, x, y) {
    const S = area.seams;
    if (!S) return null;
    for (const s of S) {
      if (s.side === 'bottom' && y === area.H - 1 && x >= s.a && x <= s.b) return s;
      if (s.side === 'top' && y <= 1 && x >= s.a && x <= s.b) return s;
      if (s.side === 'left' && x === 0 && y >= s.a && y <= s.b) return s;
      if (s.side === 'right' && x === area.W - 1 && y >= s.a && y <= s.b) return s;
    }
    return null;
  },
  // flip seams with a mirrored area (tourMirrorArea)
  mirror(area) {
    for (const s of area.seams || []) {
      if (s.side === 'left') s.side = 'right';
      else if (s.side === 'right') s.side = 'left';
      else { const a = area.W - 1 - s.b, b = area.W - 1 - s.a; s.a = a; s.b = b; }
    }
  },
  key(area, s) { return (area.aid || ('area' + area.idx)) + '/' + s.side; }
};
// (exposed on window.BRADY_TOUR at the end of 28_tour_j_stamps.js: 28_tour_g_story.js creates that object later)
