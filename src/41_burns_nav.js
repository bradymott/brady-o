/* ============================================================
   BRADY GOES TO BURNING MAN — getting around: the guide arrow, the pause-menu map page, RUN,
   the "camera behind Brady" setting and the e-bike (docs/BURNS_GUIDE.md §10.1).
   - Guide arrow (pause menu GUIDE ARROW, saved as settings.guide): a glowing arrow on the ground in front of Brady
     pointing at the current objective, its name and distance, and a ring + beam at the spot. Where it points:
     def.guide(g) if the world has one (BurnsNav.guides[worldId] works too), else the engine's reading of the
     missions (BurnsNav.defaultTargets). Sprites only: no extra draw calls.
   - Map page: worlds with def.cityMap (the open city) get a full-screen map in the pause menu.
   - RUN: a touch button (tap: on until Brady stops) and Shift (hold). x1.4 on-foot speed.
   - Camera behind Brady (settings.follow): the camera turns to face where he faces or rides.
   - E-bike (key item 'ebike'): in open worlds the BIKE button summons it instead of the yellow bike (settings.ride).
   The engine calls in through `typeof BurnsNav` guards (Art Cart bundles the engine without this file).
   ============================================================ */

const BURNS_NAV = {
  runMul: 1.4,                                   // RUN: 7.6 -> 10.6 m/s
  ebike: { maxSpeed: 18, accel: 10, turn: 2.8 }, // the yellow bike: 12.5, 9, 3.2
  col: [0.3, 0.95, 1], hex: '#4cf2ff',           // the guide's colour
  arrive: 4                                      // m: closer than this, the arrow hides (the ring stays)
};

const BurnsNav = {
  guides: {},     // worldId -> fn(g): the same contract as def.guide, for worlds wired from outside their own file
  shift: false,
  /* ---------- settings (Save.data.burns.settings) ---------- */
  on(k) { const s = BurnsSave.get().settings; return k === 'ride' ? s.ride !== 'bike' : !!s[k]; },
  toggle(k) {
    const s = BurnsSave.get().settings;
    if (k === 'ride') s.ride = s.ride === 'bike' ? 'ebike' : 'bike'; else s[k] = !s[k];
    BurnsSave.save(); burnsSfx('select');
  },
  settingsRows(g, add) {
    add('GUIDE ARROW', this.on('guide') ? 'ON' : 'OFF', () => this.toggle('guide'));
    add('CAMERA BEHIND BRADY', this.on('follow') ? 'ON' : 'OFF', () => this.toggle('follow'));
    if (BurnsSave.hasItem('ebike')) add('CITY BIKE', this.on('ride') ? 'E-BIKE' : 'YELLOW BIKE', () => this.toggle('ride'));
  },
  /* ---------- where to go ----------
     A target is {x, z, y?, label?, col?, story?}. def.guide(g) / mission guide may return a point, [x, z], an actor,
     an actor id, an array of those, null (nothing to go to) or undefined (use the engine's default). */
  pt(g, v, label) {
    if (!v) return null;
    if (typeof v === 'string') { const a = g.actor(v); return a && !a.removed && !a.hidden ? { x: a.x, z: a.z, y: a.y, label: label || a.def.name } : null; }
    if (Array.isArray(v)) return typeof v[0] === 'number' ? { x: v[0], z: v[1], label } : null;
    if (v.def && v.ch && v.x !== undefined) return { x: v.x, z: v.z, y: v.y, label: label || v.def.name };
    if (typeof v.x === 'number' && typeof v.z === 'number') return { x: v.x, z: v.z, y: v.y, label: v.label || label, col: v.col, story: v.story };
    return null;
  },
  list(g, v, label) {
    if (!v) return [];
    if (Array.isArray(v) && typeof v[0] !== 'number') return v.map(q => this.pt(g, q, label)).filter(Boolean);
    const q = this.pt(g, v, label); return q ? [q] : [];
  },
  near(g, arr) { const p = g.player; return arr.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)); },
  // one mission's go-to spots, best first
  missionTargets(g, m) {
    const d = m.def, name = (d.short || d.name || '').toUpperCase();
    if (d.guide !== undefined) { const v = typeof d.guide === 'function' ? d.guide(g, m) : d.guide; if (v !== undefined) return this.list(g, v, name); }
    if (m.data && m.data.guide) return this.list(g, m.data.guide, name);
    if (d.type === 'talk' && d.target) return this.list(g, d.target, name);
    if (m.data && m.data.marker) { const r = this.list(g, m.data.marker, name); if (r.length) return r; }
    if ((d.type === 'collect' || d.type === 'find') && g.pickups) {
      const r = g.pickups.items.filter(P => !P.taken && !P.spare && P.mission === m.id && !(P.hidden && !(g.player.power === 'lsd'))).map(P => ({ x: P.x, z: P.z, y: P.y0, label: P.label || name }));
      if (r.length) return this.near(g, r).slice(0, 3);
    }
    if (d.type === 'defeat') {
      const r = g.actors.filter(a => !a.removed && !a.hidden && !a.defeated && !a.friendly && (!d.tag || a.def.tag === d.tag)).map(a => ({ x: a.x, z: a.z, y: a.y, label: name }));
      if (r.length) return this.near(g, r).slice(0, 3);
    }
    if (d.type === 'escort' && d.companion) { const a = g.actor(d.companion), p = g.player; if (a && Math.hypot(a.x - p.x, a.z - p.z) > 18) return [{ x: a.x, z: a.z, label: 'WAIT FOR ' + (a.def.name || 'YOUR BUDDY') }]; }
    if (d.target && typeof d.target === 'object') return this.list(g, d.target, name);
    for (const a of g.actors) if (!a.removed && !a.hidden && (d.talkTo === a.id)) return this.list(g, a, name);
    if (d.marker) return this.list(g, d.marker, name);
    if (d.giver) return this.list(g, d.giver, name);
    return [];
  },
  // the engine's default: a Burn Token on the ground, then the tracked mission, other active main missions, active side
  // quests, then the nearest '!' with a main mission to give
  defaultTargets(g) {
    const out = [], p = g.player, M = g.missions;
    if (g.pickups) for (const P of g.pickups.items) if (!P.taken && !P.spare && P.base === 'token' && Math.hypot(P.x - p.x, P.z - p.z) < 120) out.push({ x: P.x, z: P.z, y: P.y0, label: 'BURN TOKEN', col: '#ffd84a' });
    const act = M.active(), tr = M.tracked && M.get(M.tracked);
    const order = [];
    if (tr && tr.state === 'active') order.push(tr);
    for (const m of act) if (order.indexOf(m) < 0 && !m.def.side) order.push(m);
    for (const m of act) if (order.indexOf(m) < 0) order.push(m);
    for (const m of order) {
      const t = this.missionTargets(g, m); if (!t.length) continue;
      for (const q of t) { q.mission = m.id; if (out.length) q.sec = true; out.push(q); }
    }
    if (!out.length && !(g.boss && g.boss.active && !g.boss.defeated)) {
      const giv = [];
      for (const m of M.list) {
        if (m.state !== 'available' || m.def.side || m.def.secret || m.def.start === 'auto' || m.def.start === 'trigger') continue;
        const a = m.def.giver && g.actor(m.def.giver);
        if (a && !a.removed && !a.hidden) giv.push({ x: a.x, z: a.z, y: a.y, label: 'TALK TO ' + (a.def.name || 'THEM'), mission: m.id });
        else if (!m.def.giver && m.def.marker) giv.push(Object.assign(this.pt(g, m.def.marker, (m.def.short || m.def.name || '').toUpperCase()) || {}, { mission: m.id }));
      }
      const ok = giv.filter(q => q.x !== undefined);
      if (ok.length) { this.near(g, ok); ok.forEach((q, i) => { if (i) q.sec = true; out.push(q); }); }
    }
    return out;
  },
  targets(g) {
    if (!g.missions || !g.player) return [];
    const fn = g.def.guide || this.guides[g.worldId];
    if (fn) { try { const v = fn(g); if (v !== undefined) return this.list(g, v); } catch (e) { if (!this._err) { this._err = true; console.error('burns guide', e); } } }
    return this.defaultTargets(g);
  },
  // g.navGuide: the arrow's target this step ({x, z, label, dist, yaw}); g.navTargets: everything worth highlighting
  refresh(g) {
    g.navTargets = this.targets(g);
    const T = g.navTargets[0];
    g.navT0 = T ? { x: T.x, z: T.z, y: T.y, label: T.label || 'GO HERE', col: T.col, story: T.story } : null;
  },
  /* ---------- per simulation step (before Brady moves) ---------- */
  step(g, dt) {
    const p = g.player, I = Input, hsp = Math.hypot(p.vx, p.vz);
    // RUN: the touch button latches it until Brady stops; Shift runs while held
    const locked = p.locked || !!g.cine || g.dialog.open || p.dead;
    if (I.hudPressed.run && !locked) { g.runLatch = !g.runLatch; g.runIdle = 0; burnsSfx('select', { vol: 0.5 }); }
    if (g.runLatch) {
      g.runIdle = p.inp.mag < 0.12 && hsp < 1.2 ? (g.runIdle || 0) + dt : 0;
      if (g.runIdle > 0.6 || p.vehicle || locked) g.runLatch = false;
    }
    const run = !p.vehicle && !locked && (g.runLatch || this.shift) && p.inp.mag > 0.3;
    p.runK = run ? BURNS_NAV.runMul : 1;
    g.running = run;
    if (run && p.grounded && hsp > 8.5 && Math.random() < dt * 9) g.fx.dust(p.x - p.vx * 0.05, p.y + 0.05, p.z - p.vz * 0.05, 1);
    // the e-bike stands in for the yellow bike in open worlds
    this.bikeSwap(g);
    const v = p.vehicle;
    if (v && v.ebike && !g._eOn) { g._eOn = true; burnsSfx('ebike_on', { pitch: 1.6, vol: 0.5 }, 'powerup'); if (!BurnsSave.flag(0, 'ebikeRode')) { BurnsSave.flag(0, 'ebikeRode', true); g.toast('E-BIKE! HOLD THE STICK AND HANG ON'); } }
    if (!(v && v.ebike)) g._eOn = false;
    // the guide: targets four times a second, the bearing every step
    if (this.on('guide') && g.state === 'play') {
      g.navTT = (g.navTT || 0) - dt;
      if (g.navTT <= 0) { g.navTT = 0.25; this.refresh(g); }
      const T = g.navT0;
      if (T) { const dx = T.x - p.x, dz = T.z - p.z; g.navGuide = { x: T.x, z: T.z, y: T.y, label: T.label, col: T.col, story: T.story, dist: Math.hypot(dx, dz), yaw: Math.atan2(dx, dz) }; }
      else g.navGuide = null;
    } else g.navGuide = null;
  },
  /* ---------- the RUN button ---------- */
  layout(g, r, lefty) {
    const H = g.hudBtns, b = H.bike;
    H.run = { id: 'run', x: b.x + (lefty ? 1 : -1) * r * 1.35, y: b.y + r * 0.3, r: r * 0.55 };
  },
  hudList(g, list) { const p = g.player; if (g.hudBtns.run && p && !p.vehicle && !g.cine) list.push(g.hudBtns.run); },
  drawControls(ctx, g, btn) {
    const R = g.hudBtns && g.hudBtns.run; if (!R || !Input.hud || Input.hud.indexOf(R) < 0) return;
    btn(R, !!g.runLatch || Input.hudHeld.run, 'RUN', g.runLatch ? '#ff9a2a' : '#6a5a9a', g.runLatch ? 'ON' : undefined);
  },
  /* ---------- the camera behind Brady (setting) ----------
     Swings behind his facing (or the vehicle's) at a rate scaled by how much he moves away from the camera, so running
     sideways makes a slow wide turn instead of a spin, running at the camera holds it, and standing still settles behind
     him after half a second. Manual orbiting wins for a second; cutscenes, boss framing and first person never get here. */
  followCam(g, fdt) {
    if (!this.on('follow') || g.camMode === 'first') return false;
    if (g.dialog.open || g.time - g.lastManual < 1.0) return true;
    const p = g.player, veh = p.vehicle, hsp = Math.hypot(p.vx, p.vz);
    const want = veh ? veh.yaw : p.yaw, fwd = Math.cos(BurnsM.wrap(want - g.camYaw));
    let k;
    if (veh) { k = 2.2 * clamp((fwd + 0.5) / 1.2, 0.15, 1); g._still = 0; }
    else if (hsp > 0.8 && p.inp.mag > 0.1) { g._still = 0; k = fwd < -0.4 ? 0 : 2.0 * clamp((fwd + 0.25) / 1.0, 0.2, 1); }
    else { g._still = (g._still || 0) + fdt; k = g._still > 0.5 ? 1.5 : 0; }
    g.camYaw = BurnsM.dampAngle(g.camYaw, want, k, fdt);
    g.camPitch = BurnsM.damp(g.camPitch, g.camMode === 'far' ? 0.5 : g.camMode === 'close' ? 0.17 : veh ? 0.28 : 0.3, 0.8, fdt);
    return true;
  },
  /* ---------- the e-bike ---------- */
  bikeSwap(g) {
    if (!g.bike || g.bike.rider) return;
    const want = !!(g.def.open && BurnsSave.hasItem('ebike') && this.on('ride'));
    if (!!g.bike.ebike === want) return;
    if (want) { g._yBike = g.bike; g.bike = g._eBike || (g._eBike = this.makeEBike(g)); }
    else if (g._yBike) g.bike = g._yBike;
  },
  makeEBike(g) {
    const v = new BurnsVehicle(g, 'bike', { col: '#ffd21a', visible: false });
    v.model = BurnsEBikeModel.build(); v.bones = new Float32Array(v.model.nb * 12);
    v.maxSpeed = BURNS_NAV.ebike.maxSpeed; v.accel = BURNS_NAV.ebike.accel; v.turn = BURNS_NAV.ebike.turn; v.ebike = true;
    return v;
  },
  // a point on a bike in world space (local x right, y up, z forward)
  onBike(v, lx, ly, lz) { const c = Math.cos(v.yaw), s = Math.sin(v.yaw); return [v.x + lx * c + lz * s, v.y + ly, v.z - lx * s + lz * c]; },
  /* ---------- 3D: the guide arrow, the target ring, the e-bike's lights (sprites) ---------- */
  drawSprites(g, R) {
    const S = BURNS_SPRITES.R, t = g.time, p = g.player, night = R.night || 0;
    for (const v of [g._eBike]) {
      if (!v || !(v.rider || v.show)) continue;
      const pul = 0.8 + 0.2 * Math.sin(t * 3);
      const b = this.onBike(v, 0, 0.56, 0.02), h = this.onBike(v, 0, 0.98, 0.7);
      R.bbs.bb(b[0], b[1], b[2], 0.55, 0.55, S.glow, BURNS_NAV.col, 0.55 * pul, true);
      R.bbs.bb(h[0], h[1], h[2], 0.7 + night * 0.6, 0.7 + night * 0.6, S.glow, [1, 0.97, 0.9], 0.8, true);
      if (night > 0.3) { const f = this.onBike(v, 0, 0.05, 4.2); R.flat.flat(f[0], f[1], f[2], 2.6, 6.5, v.yaw + Math.PI, S.beam, [0.85, 0.95, 1], 0.28 * night, true); g.pointLight(h[0], h[1] + 0.3, h[2], 9, [0.7, 0.95, 1], 0.9); }
      if (v.rider && Math.abs(v.speed) > 9) for (let i = 1; i < 6; i++) { const q = this.onBike(v, 0, 0.5, -0.5 - i * 0.55); R.bbs.bb(q[0], q[1], q[2], 0.35, 0.35, S.glow, BURNS_NAV.col, (1 - i / 6) * 0.35, true); }
    }
    const G = g.navGuide; if (!G || g.cine || g.state !== 'play') return;
    const col = G.col ? burnsRGBf(G.col) : BURNS_NAV.col, pul = 0.78 + 0.22 * Math.sin(t * 5);
    if (G.dist > BURNS_NAV.arrive) {
      const veh = p.vehicle, ahead = veh ? (veh.kind === 'car' ? 7 : 3.4) : g.camMode === 'first' ? 3 : 1.75, len = veh ? (veh.kind === 'car' ? 3.4 : 2.1) : 1.45;
      const ax = p.x + Math.sin(G.yaw) * ahead, az = p.z + Math.cos(G.yaw) * ahead;
      const gy = g.world.surface(ax, az, p.y + 1.2, 0.2, BURNS_SURF).y;
      R.flat.flat(ax, gy + 0.05, az, len * 0.95, len * 1.12, G.yaw, S.arrow, [0.02, 0.04, 0.08], 0.45, false);
      R.flat.flat(ax, gy + 0.07, az, len * 0.8, len, G.yaw, S.arrow, col, 0.95 * pul, true);
      g.navArrow = { x: ax, y: gy, z: az, yaw: G.yaw };
    } else g.navArrow = null;
    // the spot itself: a ring on the ground and a thin beam of light
    if (G.dist < 260) {
      const gy = G.y !== undefined ? G.y : g.world.height(G.x, G.z), rr = 2.6 + Math.sin(t * 3) * 0.4;
      R.flat.flat(G.x, gy + 0.08, G.z, rr * 2, rr * 2, t * 0.6, S.ring, col, 0.85, true);
      if (!G.story) for (let k = 0; k < 4; k++) R.bbs.bb(G.x, gy + 3 + k * 6, G.z, 0.9, 6.5, S.beam, col, (0.5 - k * 0.1) * pul, true);
    }
  },
  /* ---------- 2D: the label under the arrow, and a pin on the target when it's on screen ---------- */
  drawHUD(ctx, g, S) {
    const G = g.navGuide; if (!G || g.cine || g.dialog.open) return;
    const W = Game.cssW, H = Game.cssH, o = {}, R = g.R, col = G.col || BURNS_NAV.hex;
    const dtxt = G.dist > 999 ? (G.dist / 1000).toFixed(1) + ' km' : Math.round(G.dist) + ' m';
    // the pin over the target
    if (G.dist > 12 && R.project(G.x, (G.y || g.world.height(G.x, G.z)) + 2.5, G.z, W, H, o) && o.x > 20 && o.x < W - 20 && o.y > 50 && o.y < H - 40) {
      ctx.save(); ctx.translate(o.x, o.y); ctx.fillStyle = col; ctx.strokeStyle = 'rgba(10,6,24,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, 0); ctx.lineTo(0, 9); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      BurnsUI.text(ctx, dtxt, o.x, o.y - 17, 11, '#ffffff', { ui: true });
    }
    // the label under the arrow (or under Brady when he's arrived)
    const A = g.navArrow, p = g.player;
    if (!R.project(A ? A.x : p.x, A ? A.y : p.y, A ? A.z : p.z, W, H, o)) return;
    const txt = G.dist > BURNS_NAV.arrive ? `${G.label}  ${dtxt}` : `${G.label}: HERE`;
    ctx.save(); ctx.font = `600 11px ${FONT_UI}`; const tw = Math.min(W - 24, ctx.measureText(txt).width + 22); ctx.restore();
    const x = clamp(o.x, tw / 2 + 8, W - tw / 2 - 8), y = clamp(o.y + 22, 60, H - 30);
    BurnsUI.pill(ctx, x - tw / 2, y - 11, tw, 22, 'rgba(8,20,30,0.62)', rgba(col, 0.75));
    BurnsUI.text(ctx, txt, x, y + 0.5, BurnsUI.fitSize(ctx, txt, 11, tw - 16, true), '#e8fdff', { ui: true, stroke: false });
    g.navLabel = { x, y, w: tw };
  },
  /* ---------- the map page (pause menu) ----------
     def.cityMap = { bounds: {x0, x1, z0, z1}, draw(g, ctx, P, sc, t), labels(g) -> [{x, z, text, col, pri, mark}] }
     The page draws the world's map, its labels (higher pri first, skipped where they'd overlap), the targets
     (pulsing rings) and Brady (an arrow showing where he faces). ZOOM shows the area around him. */
  openMap(g) { g.pauseTab = 'citymap'; this.refresh(g); g.buildPause(); burnsSfx('map_open'); },
  mapRect() {
    const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), top = Math.max(12, insets.t + 6);
    if (H > W) { const sz = Math.min(W - S.l - S.r, H - top - 300); return { x: (W - sz) / 2, y: top + 50, w: sz, h: sz, portrait: true }; }
    const sz = Math.min(H - top - 52 - Math.max(8, insets.b + 4), W * 0.56);
    return { x: S.l + 4, y: top + 48, w: sz, h: sz, portrait: false };
  },
  buildMap(g) {
    const W = Game.cssW, H = Game.cssH, M = this.mapRect(), top = Math.max(12, insets.t + 6), list = [];
    list.push({ x: Math.max(14, insets.l + 8), y: top, w: 92, h: 38, label: '◀ BACK', fn: () => { g.pauseTab = 'main'; g.buildPause(); } });
    const zoom = { label: g.mapZoom ? 'WHOLE CITY' : 'ZOOM IN', size: 12, fn: () => { g.mapZoom = !g.mapZoom; g.buildPause(); } };
    const travel = { label: 'FAST TRAVEL', size: 12, fn: () => { g.paused = false; g.openTravelMap(); } };
    const guide = { label: 'GUIDE ARROW: ' + (this.on('guide') ? 'ON' : 'OFF'), size: 11, fn: () => { this.toggle('guide'); g.buildPause(); } };
    const B = g.openTravelMap && typeof BurnsHubScene !== 'undefined' ? [zoom, guide, travel] : [zoom, guide];
    if (M.portrait) {
      const bw = (W - 32 - (B.length - 1) * 8) / B.length, by = H - Math.max(14, insets.b + 8) - 42;
      B.forEach((b, i) => list.push(Object.assign(b, { x: 16 + i * (bw + 8), y: by, w: bw, h: 42 })));
    } else {
      const px = M.x + M.w + 16, pw = Math.min(260, W - px - Math.max(14, insets.r + 8)), by = H - Math.max(12, insets.b + 6) - B.length * 48;
      B.forEach((b, i) => list.push(Object.assign(b, { x: px + 4, y: by + i * 48, w: pw - 8, h: 40 })));
    }
    list.focus = 0;
    return list;
  },
  mapView(g, M) {
    const C = g.def.cityMap, B = C.bounds, p = g.player;
    let sc = Math.min(M.w / (B.x1 - B.x0), M.h / (B.z1 - B.z0)), cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2;
    if (g.mapZoom) {
      sc *= 3; const hw = M.w / 2 / sc, hh = M.h / 2 / sc;
      cx = clamp(p.x, B.x0 + hw, B.x1 - hw); cz = clamp(p.z, B.z0 + hh, B.z1 - hh);
    }
    return { sc, cx, cz, P: (x, z) => [M.x + M.w / 2 + (x - cx) * sc, M.y + M.h / 2 + (z - cz) * sc] };
  },
  drawMap(ctx, g) {
    const W = Game.cssW, H = Game.cssH, M = this.mapRect(), C = g.def.cityMap, t = g.time + performance.now() / 1000, p = g.player;
    ctx.fillStyle = 'rgba(6,3,14,0.9)'; ctx.fillRect(0, 0, W, H);
    const top = Math.max(12, insets.t + 6);
    BurnsUIKit.title(ctx, (C.title || 'MAP').toUpperCase(), M.portrait ? W / 2 + 40 : M.x + M.w / 2 + 50, top + 20, Math.min(22, W / 18));
    const V = this.mapView(g, M), P = V.P;
    ctx.save();
    ctx.fillStyle = '#2a1a22'; burnsRR(ctx, M.x, M.y, M.w, M.h, 12); ctx.fill();
    burnsRR(ctx, M.x, M.y, M.w, M.h, 12); ctx.clip();
    const gr = ctx.createRadialGradient(M.x + M.w / 2, M.y + M.h / 2, 10, M.x + M.w / 2, M.y + M.h / 2, M.w * 0.75); gr.addColorStop(0, '#5a3a32'); gr.addColorStop(1, '#2a1a22');
    ctx.fillStyle = gr; ctx.fillRect(M.x, M.y, M.w, M.h);
    try { C.draw(g, ctx, P, V.sc, t); } catch (e) { if (!this._mErr) { this._mErr = true; console.error('burns map', e); } }
    // labels, most important first, never on top of each other
    const placed = [], fits = r => r[0] >= M.x + 2 && r[2] <= M.x + M.w - 2 && r[1] >= M.y + 2 && r[3] <= M.y + M.h - 2 && !placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
    const T = g.navTargets || [];
    const Lb = (C.labels ? C.labels(g) : []).slice();
    T.forEach((q, i) => Lb.push({ x: q.x, z: q.z, text: q.label || 'GO HERE', col: q.col || BURNS_NAV.hex, pri: 100 - i, target: true }));
    Lb.sort((a, b) => (b.pri || 0) - (a.pri || 0));
    // Brady's own spot is taken first
    const bq = P(p.x, p.z); placed.push([bq[0] - 9, bq[1] - 9, bq[0] + 9, bq[1] + 9]);
    const fs = M.w < 300 ? 8.5 : 9.5;
    for (const L of Lb) {
      const q = P(L.x, L.z);
      if (L.mark) { ctx.fillStyle = L.col || '#ffffff'; ctx.beginPath(); if (L.mark === 'diamond') { ctx.moveTo(q[0], q[1] - 4); ctx.lineTo(q[0] + 4, q[1]); ctx.lineTo(q[0], q[1] + 4); ctx.lineTo(q[0] - 4, q[1]); } else if (L.mark === 'square') ctx.rect(q[0] - 2.5, q[1] - 2.5, 5, 5); else ctx.arc(q[0], q[1], 2.8, 0, TAU); ctx.fill(); }
      if (!L.text) continue;
      ctx.font = `600 ${fs}px ${FONT_UI}`; const w = ctx.measureText(L.text).width + 4, h = fs + 3;
      let r = null;
      for (const [dx, dy] of [[0, -9], [0, 10], [w / 2 + 6, 0], [-w / 2 - 6, 0]]) { const c = [q[0] + dx - w / 2, q[1] + dy - h / 2, q[0] + dx + w / 2, q[1] + dy + h / 2]; if (fits(c)) { r = c; break; } }
      if (!r) continue;
      placed.push(r);
      BurnsUI.text(ctx, L.text, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, fs, L.col || '#ffffff', { ui: true, sw: 3 });
    }
    // the targets: pulsing rings
    const tg = [];
    T.forEach((q, i) => {
      const s = P(q.x, q.z), k = (t * 1.2 + i * 0.3) % 1, c = q.col || BURNS_NAV.hex;
      ctx.strokeStyle = rgba(c, (1 - k) * (q.sec ? 0.6 : 1)); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(s[0], s[1], 5 + k * 16, 0, TAU); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(s[0], s[1], q.sec ? 3.5 : 5, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(10,6,24,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
      tg.push({ x: s[0], y: s[1], label: q.label });
    });
    // Brady: an arrow along his facing (6:00 is down: +z down, +x right)
    const yaw = p.vehicle ? p.vehicle.yaw : p.yaw, rot = Math.PI - yaw;
    ctx.save(); ctx.translate(bq[0], bq[1]); ctx.rotate(rot);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 8); ctx.lineTo(0, 3.5); ctx.lineTo(-8, 8); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; burnsRR(ctx, M.x, M.y, M.w, M.h, 12); ctx.stroke();
    g._cityMap = { M, sc: V.sc, brady: { x: bq[0], y: bq[1], rot, yaw }, targets: tg };
    // the side panel (landscape) or the strip under the map (portrait): what to do, how far
    const px = M.portrait ? 18 : M.x + M.w + 20, pw = M.portrait ? W - 36 : Math.min(260, W - px - 16);
    let y = M.portrait ? M.y + M.h + 22 : M.y + 12;
    const line = (txt, col, size, o) => { BurnsUI.text(ctx, txt, px, y, BurnsUI.fitSize(ctx, txt, size, pw, true), col, Object.assign({ ui: true, align: 'left', stroke: false }, o || {})); y += size + 8; };
    line(g.region ? 'YOU: ' + String(g.region).toUpperCase() : 'YOU ARE HERE', '#ffffff', 12);
    if (!T.length) line('Nothing to chase right now. Explore!', 'rgba(255,255,255,0.75)', 11);
    for (const q of T.slice(0, M.portrait ? 3 : 4)) {
      const d = Math.hypot(q.x - p.x, q.z - p.z), dt = d > 999 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m';
      ctx.fillStyle = q.col || BURNS_NAV.hex; ctx.beginPath(); ctx.arc(px + 5, y, 4.5, 0, TAU); ctx.fill();
      const tx = `${q.label || 'GO HERE'} · ${dt}`;
      BurnsUI.text(ctx, tx, px + 15, y, BurnsUI.fitSize(ctx, tx, 11.5, pw - 16, true), q.sec ? 'rgba(220,250,255,0.75)' : '#dffcff', { ui: true, align: 'left', stroke: false });
      y += 19;
    }
    y += 4;
    if (C.legend) line(C.legend, 'rgba(255,255,255,0.6)', 10);
  }
};

/* ---------------- the e-bike's model: the yellow bike's five bones (frame, front wheel, rear wheel, cranks, bars),
   a dark frame with a battery on the down tube, a hub motor, fat tyres, cyan light strips and a headlight ---------------- */
const BurnsEBikeModel = {
  model: null,
  build() {
    if (this.model) return this.model;
    const m = new BurnsMesh(6144), col = '#1e2836', acc = '#38f2ff';
    const fz = 0.56, rz = -0.54, wr = 0.37, tube = (a, b, r) => m.limb(a[0], a[1], a[2], b[0], b[1], b[2], r, r, { seg: 8 });
    m.setBone(0); m.color(col).shine(2);
    tube([0, wr, rz], [0, 0.8, 0.02], 0.036); tube([0, wr, rz], [0, 0.42, 0.0], 0.034); tube([0, 0.42, 0.0], [0, 0.84, 0.4], 0.05); tube([0, 0.84, 0.4], [0, wr, fz], 0.034);
    tube([0.08, wr, rz], [0.04, 0.7, -0.08], 0.02); tube([-0.08, wr, rz], [-0.04, 0.7, -0.08], 0.02);
    tube([0, 0.8, 0.02], [0, 0.84, 0.4], 0.03);
    // the battery on the down tube, with a light strip and a charge gauge
    m.push(); m.tf(0, 0.6, 0.2, 0, -0.78); m.color('#11161e').shine(1); m.roundBox(0, 0.06, 0, 0.13, 0.12, 0.42, 0.03);
    m.color(acc, 1); m.box(0.068, 0.06, 0, 0.012, 0.03, 0.34); m.box(-0.068, 0.06, 0, 0.012, 0.03, 0.34); m.emissive(0); m.pop();
    m.color('#2a2a2e').shine(1); m.ellipsoid(0, 0.89, -0.06, 0.085, 0.04, 0.16, { seg: 10, rings: 6 });   // saddle
    m.color('#c8c8d0').shine(3); m.roundBox(0, 0.64, -0.64, 0.3, 0.035, 0.32, 0.015);                       // rack
    m.color(acc, 1); m.box(0, 0.6, -0.81, 0.18, 0.04, 0.02); m.emissive(0);                                 // tail light bar
    m.color('#ff3b5c', 1); m.box(0, 0.6, -0.815, 0.08, 0.03, 0.02); m.emissive(0);
    m.shine(0);
    for (const b of [1, 2]) {
      m.setBone(b); m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2);
      m.color('#141416').shine(1); m.torus(0, 0, 0, wr - 0.05, 0.05, { seg: 22, tseg: 7 });                 // fat tyres
      m.color(acc, 1); m.torus(0, 0, 0, wr * 0.8, 0.012, { seg: 20, tseg: 4 }); m.emissive(0);              // glowing rims
      m.color('#9aa0aa').shine(3); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; m.limb(0, 0, 0, Math.cos(a) * wr * 0.78, 0, Math.sin(a) * wr * 0.78, 0.008, 0.008, { seg: 3, ends: false }); }
      m.color(b === 2 ? '#2a3240' : '#9aa0aa').roundCyl(0, b === 2 ? -0.06 : -0.03, 0, b === 2 ? 0.09 : 0.035, b === 2 ? 0.12 : 0.06, 0.015, { seg: 10 });   // the rear hub motor
      m.shine(0); m.pop();
    }
    m.setBone(3); m.color('#4a4a52').shine(2); m.limb(-0.15, 0, 0, 0.15, 0, 0, 0.022, 0.022, { seg: 6 }); m.limb(0.15, 0, 0, 0.15, -0.16, 0, 0.016, 0.016, { seg: 5 }); m.limb(-0.15, 0, 0, -0.15, 0.16, 0, 0.016, 0.016, { seg: 5 });
    m.color('#1a1a1a'); m.roundBox(0.2, -0.17, 0, 0.1, 0.03, 0.06, 0.01); m.roundBox(-0.2, 0.17, 0, 0.1, 0.03, 0.06, 0.01); m.shine(0);
    m.setBone(4); m.color('#c8c8d0').shine(3); m.limb(-0.3, 0, 0, 0.3, 0, 0, 0.016, 0.016, { seg: 6 }); m.color('#1a1a1a').shine(1); m.limb(0.22, 0, 0, 0.33, 0, 0, 0.026, 0.026, { seg: 6 }); m.limb(-0.22, 0, 0, -0.33, 0, 0, 0.026, 0.026, { seg: 6 });
    m.color('#11161e').roundBox(-0.08, 0.04, 0.02, 0.07, 0.025, 0.05, 0.008); m.color(acc, 1); m.box(-0.08, 0.055, 0.02, 0.05, 0.004, 0.035); m.emissive(0);   // the display
    m.color('#f4f6ff', 1); m.push(); m.tf(0, -0.05, 0.12); m.lathe([[0.05, 0], [0.055, 0.03], [0, 0.04]], { seg: 10, sz: 1 }); m.pop(); m.emissive(0);   // headlight
    m.shine(0);
    this.model = { geo: m.geo(), nb: 5, wheelR: wr, front: fz, rear: rz, bones: { frame: 0, fw: 1, rw: 2, crank: 3, bar: 4 }, ebike: true };
    return this.model;
  }
};

/* Shift = RUN while playing (it's ACTION elsewhere: the capture listener keeps it from the shared input) */
if (typeof window !== 'undefined') {
  const playing = () => typeof Game !== 'undefined' && Game.scene instanceof BurnsPlayScene && Game.scene.state === 'play' && !Game.scene.paused;
  window.addEventListener('keydown', e => { if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && playing()) { BurnsNav.shift = true; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); } }, true);
  window.addEventListener('keyup', e => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') BurnsNav.shift = false; }, true);
  window.addEventListener('blur', () => { BurnsNav.shift = false; });
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsNav, BURNS_NAV, BurnsEBikeModel });
}
