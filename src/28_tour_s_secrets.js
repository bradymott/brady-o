/* ============================================================
   World tour: secrets, stage A (docs/design/SECRETS_WARPS_SWITCHES.md WP-2; the contracts in
   docs/design/SECRETS_CONTRACTS.md). The save fields, the progress and the maps for Wormholes
   (exits with via: 'warp'), Brady Buttons (Piwi's House Rules) and the bonus lands.

   SAVE: key super-brady-o-world-save-v3 (src/00_core.js; one clean reset, Brady 17 Nov 2026: "wipe my save i dont
   care"; settings and look come over from v2 once). These fields are made the first time TourProgress.data() runs:
     tour.rules     { <n>: { at: '1-4' } }   Brady Buttons pressed (the rule each revoked, and where)
     tour.warpLinks { <cc>: { <levelId>: <fromId> } }  levels reached early through a Wormhole from another land
                    (the map draws a trail from that land's airstrip to them, so Brady is never stranded)
     tour.arrive    { cc, at, from } | null   a Wormhole arrival the map has not played yet (consumed once)
     tour.hop       { cc, from, to } | null    an in-land Wormhole hop the overworld has not played yet
   Wormholes taken are the ordinary Save.data.exits[id][key]; bonus lands open through tour.lands (as Antarctica
   does) and bonus levels through Save.data.unlocked.

   PROGRESS: TourProgress.exit learns warp exits. In-land: a gold trail with the warp flag (the overworld then
   hops Brady through the wormhole instead of walking him). Another land: the target and its land unlock
   (nothing earlier is marked done), its secret stop is revealed there, and a 'warp' reveal plays on the world
   route map: a wormhole spins across the globe, then Brady pops out at the target stop.

   MAPS: TourGraph.edges gains the warp links; the overworld and the route map draw the wormhole trails and
   the badges through the owDraw / routeDraw hook lists (call sites added here by wrapping, so the map
   agent's files stay as they are).
   ============================================================ */

/* ---------- the save fields ---------- */
{
  const d0 = TourProgress.data;
  TourProgress.data = function () {
    const T = d0.call(this);
    if (!T.rules || typeof T.rules !== 'object') T.rules = {};
    if (!T.warpLinks || typeof T.warpLinks !== 'object') T.warpLinks = {};
    if (T.arrive === undefined) T.arrive = null;
    if (T.hop === undefined) T.hop = null;
    return T;
  };
}

/* ---------- bonus lands: their own route stop, their own difficulty ---------- */
// a country file adds its stop before Tour.country (bonus lands never edit TOUR_ROUTE):
//   Tour.addStop({ id, world, name, lon, lat, secret: true, bonus: true, d0, pin })
Tour.addStop = function (s) {
  if (this.stops[s.id]) return this.stops[s.id];
  TOUR_ROUTE.push(s); this.stops[s.id] = s;
  return s;
};
{
  const df0 = Tour.difficulty;
  Tour.difficulty = function (w, i) {
    const C = this.byWorld[w];
    if (C && C.d0 != null) return clamp(C.d0 + (i - 1) * 0.03, 0, 0.95);
    return df0.call(this, w, i);
  };
}

/* ---------- Wormholes: the exit kind ---------- */
// player-facing: WORMHOLE; code: via 'warp' (SECRETS_CONTRACTS §4). A warp clears its level (marksDone).
TourHooks.exitKind('warp', { title: 'WORMHOLE!', marksDone: true });

const TourSecrets = {
  // is exit `key` of level `id` a Wormhole?
  isWarp(id, key) { const L = Tour.specOf(id), ex = L && L.exits[key]; return !!(ex && ex.via === 'warp'); },
  // every Wormhole of the game: [{ id, key, to, label, cc, toCc }]
  warps() {
    if (this._warps) return this._warps;
    const out = [];
    for (const w of Tour.worldList()) {
      const C = Tour.byWorld[w];
      C.levels.forEach((L, k) => { for (const key in L.exits) { const ex = L.exits[key]; if (!ex || ex.via !== 'warp') continue; const tg = Tour.target(ex.to, C); out.push({ id: w + '-' + (k + 1), key, to: tg.id, label: ex.label || '', cc: C.id, toCc: tg.cc, needs: ex.needs || null }); } });
    }
    return (this._warps = out);
  },
  // has Brady taken this Wormhole (an entry of warps())?
  isTaken(w) { const E = Save.data.exits && Save.data.exits[w.id]; return !!(E && E[w.key]); },
  // the Wormholes Brady has taken (a new list: not for per-frame code, which loops warps() with isTaken)
  taken() { return this.warps().filter(w => this.isTaken(w)); },
  // what a warp exit opens (called from TourProgress.exit after the ordinary bookkeeping): adds to `out`
  open(id, key, ex, out) {
    const C = Tour.countryOf(id), T = TourProgress.data(), tg = Tour.target(ex.to, C);
    if (!C || tg.kind !== 'level' && tg.kind !== 'node') return;
    const TC = Tour.countryOf(tg.id), TL = Tour.specOf(tg.id); if (!TC || !TL) return;
    Save.data.unlocked[tg.id] = true;
    const queue = r => { out.push(r); if (!T.pending.some(q => JSON.stringify(q) === JSON.stringify(r))) T.pending.push(r); };
    if (TC === C) {
      // the same land: a gold trail with the warp flag (the overworld hops Brady through it)
      const from = +id.split('-')[1] - 1, to = +tg.id.split('-')[1] - 1;
      let r = out.find(q => q.kind === 'path' && q.cc === C.id && q.from === from && q.to === to);
      if (r) r.warp = true;
      else if (!T.paths[C.id + ':' + from + '>' + to]) queue({ kind: 'path', cc: C.id, from, to, gold: true, warp: true });
      if (TL.secret && !T.revealed[tg.id] && !out.some(q => q.kind === 'stop' && q.id === tg.id)) queue({ kind: 'stop', cc: C.id, id: tg.id });
      T.hop = { cc: C.id, from: id, to: tg.id };
      return;
    }
    // another land: link the target to that land's airstrip, reveal it there, play the trip on the route map
    const links = T.warpLinks[TC.id] || (T.warpLinks[TC.id] = {});
    links[tg.id] = id;
    if (TL.secret && !T.revealed[tg.id]) queue({ kind: 'stop', cc: TC.id, id: tg.id });
    queue({ kind: 'warp', from: C.id, to: TC.id, id: tg.id, src: id });
    T.arrive = { cc: TC.id, at: tg.id, from: id };
  }
};
// a country added or amended later (a bonus land, a test fixture) refreshes the Wormhole list
{ const am0 = Tour.amend; Tour.amend = function () { TourSecrets._warps = null; return am0.apply(this, arguments); }; }
{
  // runs outside the map graph's own wrapper (which remembers tour.lastExit), so lastExit is still set
  const ex0 = TourProgress.exit;
  TourProgress.exit = function (id, key) {
    const out = ex0.call(this, id, key);
    const L = Tour.specOf(id), ex = L && L.exits[key || 'main'];
    if (ex && ex.via === 'warp') TourSecrets.open(id, key, ex, out);
    return out;
  };
  // the map's exit pips: a dormant exit (its needs not met) is not counted until it wakes up
  const ef0 = TourProgress.exitsFound;
  TourProgress.exitsFound = function (id) {
    const L = Tour.specOf(id);
    if (!L || !Object.keys(L.exits).some(k => L.exits[k] && L.exits[k].needs)) return ef0.call(this, id);
    const E = (Save.data.exits || {})[id] || {};
    const keys = Object.keys(L.exits).filter(k => (k === 'main' || L.exits[k].to) && (!L.exits[k].needs || TourNeeds.ok(L.exits[k].needs)));
    return { found: keys.filter(k => E[k]).length, total: keys.length };
  };
}

/* ---------- the land graph: warp links from the airstrip ---------- */
{
  const ed0 = TourGraph.edges;
  TourGraph.edges = function (C, nodes) {
    const out = ed0.call(this, C, nodes), T = TourProgress.data(), links = T.warpLinks[C.id];
    // trails made by an in-land Wormhole: flag them so the map draws the wormhole on them
    for (const w of TourSecrets.taken()) {
      if (w.cc !== C.id || w.toCc !== C.id) continue;
      for (const e of out) if ((e.a === w.id && e.b === w.to) || (e.b === w.id && e.a === w.to)) e.warp = true;
    }
    if (links) {
      const by = {}; for (const n of nodes) by[n.key] = n;
      for (const id in links) {
        if (!by[id] || !by.start || out.some(e => (e.a === 'start' && e.b === id) || (e.b === 'start' && e.a === id))) continue;
        out.push({ key: 'start>' + id, a: 'start', b: id, kind: 'warp', gold: true, warp: true, open: true, pending: false, fresh: false, visible: by.start.visible && by[id].visible });
      }
    }
    return out;
  };
}

// a bonus land still being built has no boss yet: its last level is drawn as an ordinary stop, not a fort
{
  const nd0 = TourGraph.nodes;
  TourGraph.nodes = function (C) {
    const out = nd0.call(this, C);
    if (C.bonus) for (const n of out) if (n.boss && n.L && n.L.kind !== 'castle') n.boss = false;
    return out;
  };
}

/* ---------- the hooks' call sites on the maps ---------- */
// owDraw(ow, ctx, vr): the overworld's live layer, in map units, over everything but the HUD
// owTap(ow, tap) -> true: a tap the extras used (before the overworld's own)
// routeDraw(scene, ctx, layer): the world route map, 'under' (with the flight arcs) and 'over'
{
  const ov0 = TourOWPaint.over;
  TourOWPaint.over = function (ctx, ow, vr) { ov0.call(this, ctx, ow, vr); if (TourHooks.owDraw.length) TourHooks.each('owDraw', ow, ctx, vr); };
  const fx0 = TourMapScene.prototype.drawWorldFx;
  TourMapScene.prototype.drawWorldFx = function (ctx, layer) { fx0.call(this, ctx, layer); if (TourHooks.routeDraw.length) TourHooks.each('routeDraw', this, ctx, layer); };
  const rd0 = TourOverworld.prototype.readInput;
  TourOverworld.prototype.readInput = function () {
    const inp = rd0.call(this);
    if (TourHooks.owTap.length && inp.taps.length && !this.menu && !this.reveal && !this.clears) {
      for (let k = inp.taps.length - 1; k >= 0; k--) if (TourHooks.run('owTap', this, inp.taps[k])) inp.taps.splice(k, 1);
    }
    return inp;
  };
}

/* ---------- the overworld: an in-land Wormhole hop, a Wormhole arrival ---------- */
const TourWarpFx = {
  INK: '#1a0e2a',
  // a spinning wormhole mouth: rings of purple and teal round a dark eye. k = 0..1 size, t = time
  vortex(ctx, x, y, r, t, k) {
    if (k <= 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k * 0.62);
    ctx.fillStyle = '#2a1050'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.lineWidth = r * 0.16;
    for (let q = 0; q < 4; q++) {
      const a = t * (3 + q * 0.7) + q * 1.7, rr2 = r * (0.92 - q * 0.2);
      ctx.strokeStyle = q % 2 ? '#3ae8d8' : '#b46aff';
      ctx.beginPath(); ctx.arc(0, 0, rr2, a, a + 4.2); ctx.stroke();
    }
    ctx.fillStyle = '#0a0418'; ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, TAU); ctx.fill();
    ctx.strokeStyle = this.INK; ctx.lineWidth = 1.6 / Math.max(0.3, k); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.restore();
  },
  // little purple sparks drifting along a trail curve (P from TourOW.curve): no allocation
  trailSparks(ctx, P, t, rev) {
    if (!P || !P.pts || P.pts.length < 2) return;
    const n = P.pts.length, step = 5, off = Math.floor(t * 20) % step;
    for (let i = off; i < n; i += step) {
      const p = P.pts[rev ? n - 1 - i : i], tw = 0.5 + 0.5 * Math.sin(t * 6 + i);
      ctx.globalAlpha = 0.5 + 0.45 * tw; ctx.fillStyle = i % 2 ? '#b46aff' : '#3ae8d8';
      ctx.beginPath(); ctx.arc(p[0], p[1] - 3, 1.6 + tw * 1.3, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
};
{
  const OW = TourOverworld.prototype;
  // a hop (in-land Wormhole): after the reveals, Brady spins into a wormhole at the stop he left and pops out at
  // the stop it leads to. An arrival (another land): he pops out of a wormhole at the target stop.
  const up0 = OW.update;
  OW.update = function (dt, inp) {
    const T = TourProgress.data();
    if (!this.hopFx && T.hop && T.hop.cc === this.cc && inp && !this.menu && this.revealQ && !this.revealQ.length && !this.reveal && !this.clears && !this.air && this.iris.t >= this.iris.dur) {
      const H = T.hop; T.hop = null; Save.save();
      const a = this.G.pos[H.from], b = this.G.pos[H.to];
      if (a && b && this.by[H.to]) {
        this.autoTarget = null; const w = this.walker; w.queue = []; w.seg = null;
        this.hopFx = { t: 0, dur: TourKit.reduceMotion() ? 0.4 : 2.0, a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, to: H.to, moved: false };
        TourKit.sfx('portal', 'portal', { vol: 0.6 });
      }
    }
    if (this.hopFx) {
      const F = this.hopFx; this.t += dt; F.t += dt;
      const k = clamp(F.t / F.dur, 0, 1), w = this.walker;
      if (!F.moved && k >= 0.45) { F.moved = true; w.at = F.to; w.x = F.b.x; w.y = F.b.y; Sound.play('portal', { vol: 0.4, pitch: 1.3 }); }
      const tg = k < 0.45 ? F.a : F.b, kk = 1 - Math.exp(-dt * 4);
      this.cam.x = lerp(this.cam.x, tg.x, kk); this.cam.y = lerp(this.cam.y, tg.y - 10, kk); this.clampCam();
      for (const s of this.sparks) { s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; }
      if (k >= 1) { this.hopFx = null; this.scene.toast('WORMHOLE! ' + (this.by[F.to] ? this.levelName(F.to) : '')); this.arrive(); }
      return;
    }
    if (this.emergeFx) { this.emergeFx.t += dt; if (this.emergeFx.t >= this.emergeFx.dur) this.emergeFx = null; }
    return up0.call(this, dt, inp);
  };
  OW.idle = (function (id0) { return function () { return !this.hopFx && id0.call(this); }; })(OW.idle);
  // Brady is drawn smaller (spinning) while he goes into or comes out of a wormhole
  const dw0 = OW.drawWalker;
  OW.drawWalker = function (ctx) {
    const F = this.hopFx, E = this.emergeFx;
    let s = 1, rot = 0;
    if (F) { const k = clamp(F.t / F.dur, 0, 1); s = k < 0.45 ? 1 - clamp(k / 0.35, 0, 1) : clamp((k - 0.55) / 0.3, 0, 1); rot = (1 - s) * 6; }
    else if (E) { s = clamp(E.t / 0.8, 0, 1); rot = (1 - s) * 6; }
    if (s >= 1) return dw0.call(this, ctx);
    if (s <= 0.02) return;
    const w = this.walker;
    ctx.save(); ctx.translate(w.x, w.y - 14); ctx.rotate(rot); ctx.scale(s, s); ctx.translate(-w.x, -(w.y - 14));
    dw0.call(this, ctx); ctx.restore();
  };
  // pop Brady out of a wormhole at stop `key` (a Wormhole from another land landed him here)
  OW.emergeAt = function (key) {
    const p = this.G.pos[key]; if (!p) return false;
    const w = this.walker; w.at = key; w.x = p.x; w.y = p.y; w.queue = []; w.seg = null;
    this.air = null; this.autoTarget = null;
    this.cam.x = p.x; this.cam.y = p.y; this.clampCam();
    this.iris = { t: 0, dur: TourKit.reduceMotion() ? 0.01 : 0.6, open: true, col: '#1a0a30' };
    this.emergeFx = { t: 0, dur: TourKit.reduceMotion() ? 0.3 : 2.2, key };
    const T = TourProgress.data(); (T.panelAt = T.panelAt || {})[this.cc] = key;
    return true;
  };
}
// the overworld extras: the wormhole hop, the arrival, the sparks on wormhole trails, a small wormhole by each
// stop that has one Brady has used
TourHooks.on('owDraw', (ow, ctx) => {
  const t = ow.t;
  for (const e of ow.edges) {
    if (!e.warp || !e.visible || !e.open || e.fresh) continue;
    const P = TourOW.curve(ow.G, e); if (P) TourWarpFx.trailSparks(ctx, P, t, false);
  }
  const F = ow.hopFx;
  if (F) {
    const k = clamp(F.t / F.dur, 0, 1);
    const ka = k < 0.5 ? clamp(k / 0.15, 0, 1) : clamp(1 - (k - 0.5) / 0.15, 0, 1), kb = k < 0.4 ? 0 : k < 0.85 ? clamp((k - 0.4) / 0.15, 0, 1) : clamp(1 - (k - 0.85) / 0.15, 0, 1);
    TourWarpFx.vortex(ctx, F.a.x, F.a.y - 4, 26, t, ka);
    TourWarpFx.vortex(ctx, F.b.x, F.b.y - 4, 26, t, kb);
  }
  const E = ow.emergeFx;
  if (E) { const p = ow.G.pos[E.key]; if (p) { const k = E.t / E.dur; TourWarpFx.vortex(ctx, p.x, p.y - 4, 28, t, k < 0.15 ? k / 0.15 : clamp(1 - (k - 0.55) / 0.3, 0, 1)); } }
  // a small wormhole beside every stop whose Wormhole Brady has taken
  for (const w of TourSecrets.warps()) {
    if (w.cc !== ow.cc || !TourSecrets.isTaken(w)) continue;
    const p = ow.G.pos[w.id], n = ow.by[w.id]; if (!p || !n || !n.visible) continue;
    TourWarpFx.vortex(ctx, p.x + 25, p.y - 18, 8, t + p.x, 1);
  }
});

/* ---------- the route map: wormhole lines between lands, the trip ---------- */
{
  const rk0 = TourMap.routeKind;
  TourMap.routeKind = function (r) { return r.kind === 'warp' || rk0.call(this, r); };
  const S = TourMapScene.prototype;
  const nr0 = S.nextRouteReveal;
  S.nextRouteReveal = function () {
    nr0.call(this);
    const R = this.rReveal;
    if (R && R.r.kind === 'warp') {
      R.banner = 'WORMHOLE!'; R.dur = R.calm ? 0.4 : 2.8;
      const a = Tour.stops[R.r.from], b = Tour.stops[R.r.to];
      if (a && b) R.focus = { lon: (a.lon + b.lon) / 2, lat: (a.lat + b.lat) / 2 };
      this.warpLand = R.r.to;
      TourKit.sfx('portal', 'portal', { vol: 0.7 });
    }
  };
  // the trip is over: Brady pops out in the land the Wormhole leads to (no plane)
  const ur0 = S.updateRoute;
  S.updateRoute = function (dt) {
    if (this.warpLand && this.rRevealQ && !this.rRevealQ.length && !this.rReveal && !this.flight) {
      const id = this.warpLand; this.warpLand = null; this.routeReturn = false; this.flyAfter = null;
      if (Tour.countries[id]) { this.land(id); return; }
    }
    return ur0.call(this, dt);
  };
  const land0 = S.land;
  S.land = function (id) {
    const T = TourProgress.data(), A = T.arrive;
    land0.call(this, id);
    if (A && A.cc === id && this.ow && this.ow.cc === id) {
      T.arrive = null;
      if (this.ow.emergeAt(A.at)) { this.toast('WORMHOLE TO ' + Tour.countries[id].name.toUpperCase() + '!'); TourKit.sfx('portal', 'portal', { vol: 0.6 }); }
      Save.save();
    }
  };
}
TourHooks.on('routeDraw', (scene, ctx, layer) => {
  if (layer !== 'under') return;
  const T = TourProgress.data(), t = scene.t, R = scene.rReveal, live = R && R.r.kind === 'warp' ? R : null;
  for (const cc in T.warpLinks) {
    const L = T.warpLinks[cc];
    for (const id in L) {
      const fromC = Tour.countryOf(L[id]); if (!fromC) continue;
      const a = Tour.stops[fromC.id], b = Tour.stops[cc]; if (!a || !b) continue;
      const x0 = scene.sx(a.lon), y0 = scene.sy(a.lat), x1 = scene.sx(b.lon), y1 = scene.sy(b.lat);
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + Math.hypot(x1 - x0, y1 - y0) * 0.22;
      const drawing = live && live.r.to === cc && live.r.id === id && !live.calm;
      const k = drawing ? clamp(live.t / 1.6, 0, 1) : 1;
      ctx.save(); ctx.lineWidth = 2.5; ctx.setLineDash([2, 7]); ctx.lineDashOffset = -t * 14; ctx.strokeStyle = 'rgba(180,106,255,0.95)';
      ctx.beginPath(); ctx.moveTo(x0, y0);
      for (let q = 1; q <= 24 * k; q++) { const u = q / 24, v = 1 - u; ctx.lineTo(v * v * x0 + 2 * v * u * mx + u * u * x1, v * v * y0 + 2 * v * u * my + u * u * y1); }
      ctx.stroke(); ctx.restore();
      const u = drawing ? k : 0.5, v = 1 - u;
      TourWarpFx.vortex(ctx, v * v * x0 + 2 * v * u * mx + u * u * x1, v * v * y0 + 2 * v * u * my + u * u * y1, drawing ? 13 : 7, t, 1);
    }
  }
});
// (exposed on window.BRADY_TOUR for the browser tests)
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.TourSecrets = TourSecrets; } } catch (e) { /* not in a browser */ }
