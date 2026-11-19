/* ============================================================
   Level validator — simulates Brady's real physics from every
   reachable standing spot to prove each level can be finished
   and every gold record collected.
   v2 (LEVEL_OVERHAUL.md §6.1): several areas joined by doors,
   virtual keys, one-way edges, toggle groups (a bitmask in the
   search state), crawlways, carry physics, pace and coverage.
   ============================================================ */
const VALIDATOR_PORTALS = { portal: true, trapdoor: true, teleport: true };
// secrets (docs/design/SECRETS_CONTRACTS.md): spawns that are exits like a gate (a warp: press Up at it), with
// the box Brady's body must overlap; a button's box (slapped from the side)
const VALIDATOR_EXITS = { warp: { w: 40, h: 56 } };
const VALIDATOR_BUTTON = { w: 44, h: 44 };
const Validator = {
  // the area as the search sees it: hidden blocks, coins and fake walls are air; moving platforms' paths are one-way floors
  proxyArea(area, mask) {
    const tiles = new Uint8Array(area.tiles);
    const W = area.W, H = area.H;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (t === T.HIDDEN || t === T.PICK || t === T.FAKE) tiles[i] = T.EMPTY;
    }
    // toggle groups: bit 0 = the area as built (A solid, B empty); bit 1 = A empty, B solid
    let waterLine = area.waterLine != null ? area.waterLine : null;
    const zones = (area.zones || []).filter(z => !z.pulse);
    const tg = area.toggles || {};
    for (const g in tg) {
      const on = !!(mask & (1 << g)), G = tg[g];
      if (G.kind === 'water' || G.kind === 'tide') { if (G.low != null) waterLine = on ? G.high : G.low; continue; }
      if (!on) continue;
      for (const r of G.A) for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = T.EMPTY;
      for (const r of G.B) for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = r[4] != null ? r[4] : T.HARD;
    }
    // zones that belong to a toggle state (fans with g) are only there in that state
    const z2 = zones.filter(z => z.g == null || !!(mask & (1 << z.g)) === (z.gOn !== false));
    for (const [x, y] of area.ghosts || []) if (x >= 0 && y >= 0 && x < W && y < H && tiles[y * W + x] === T.EMPTY) tiles[y * W + x] = T.SEMI;
    for (const s of area.spawns) {
      if (s.type === 'boss') { const dx = s.doorX; for (let y = 0; y < H; y++) if (tiles[y * W + dx] === T.HARD) tiles[y * W + dx] = T.EMPTY; }
    }
    const springs = new Set((area.springs || []).map(([x, y]) => x + ',' + y));
    for (const [x, y] of area.springs || []) if (tiles[y * W + x] === T.EMPTY) tiles[y * W + x] = T.SEMI;
    // locked doors stay shut until a matching key has been reached
    const locks = (area.locks || []).map(L => { const o = { id: L.id, tiles: L.tiles }; if (L.needsAll) o.needsAll = L.needsAll; if (L.needs) o.needs = L.needs; return o; });
    // tiles under the water line are water (tide and valve levels)
    if (waterLine != null) for (let y = waterLine; y < H; y++) for (let x = 0; x < W; x++) if (tiles[y * W + x] === T.EMPTY) tiles[y * W + x] = T.WATER;
    const A = { W, H, tiles, water: area.water, gravity: area.gravity || 1, springs, surf: area.surf || null, zones: z2, locks, waterLine, carry: area.carry || null, fallCap: area.fallCap || 0, airSteer: area.airSteer || 0 };
    A.mixed = !area.water && tiles.indexOf(T.WATER) >= 0;
    A.hasFlip = z2.some(z => z.kind === 'flip');
    return A;
  },
  openLocks(A, held) {
    for (const L of A.locks) if (!L.open && !L.never && (L.needsAll ? L.needsAll.every(k => held.has(k)) : held.has(L.id))) { L.open = true; for (const [x, y] of L.tiles) A.tiles[y * A.W + x] = T.EMPTY; A.tileRev = (A.tileRev || 0) + 1; }
  },
  // crawlways: rows with a lintel overhead, one free row and a floor; their two ends as standing spots
  crawlways(A) {
    const out = [];
    for (let y = 0; y + 2 < A.H; y++) {
      let x = 0;
      while (x < A.W) {
        const cell = xx => A.tiles[y * A.W + xx] === T.LINTEL && A.tiles[(y + 1) * A.W + xx] === T.EMPTY && SOLID[A.tiles[(y + 2) * A.W + xx]];
        if (!cell(x)) { x++; continue; }
        const x0 = x; while (x < A.W && cell(x)) x++;
        out.push({ a: [x0 - 1, y + 2], b: [x, y + 2], y });
      }
    }
    return out;
  },

  run(level, opts) {
    opts = opts || {};
    const t0 = Date.now();
    const nA = level.areas.length;
    const proxies = new Map();
    const held = new Set();
    // secrets: opts.rules (a Set of rule numbers, or 'all') decides which `needs` hold; seams join an area's edge to
    // another area (TourSeams in 28_tour_a2_hooks.js)
    const needOk = n => !n || (typeof TourNeeds !== 'undefined' && TourNeeds.met(n, opts.rules));
    const seamsOf = a => { const L = (a.seams || []).filter(s => s.target && needOk(s.needs)); return L.length ? L : null; };
    const proxy = (ai, mask) => { const k = ai * 16 + mask; let A = proxies.get(k); if (!A) { A = this.proxyArea(level.areas[ai], mask); A.crawl = this.crawlways(A); const sm = seamsOf(level.areas[ai]); if (sm) A.seams = sm; for (const L of A.locks) if (L.needs && !needOk(L.needs)) L.never = true; proxies.set(k, A); } this.openLocks(A, held); return A; };
    const golds = [], gates = [], portals = [], keys = [], vkeys = [], edges = [], switches = [], autos = [], buttons = [];
    let newKey = false;
    // keys that change the search (a lock uses them, or the carry / crawl rules): only these restart a pass
    const useful = new Set(['deliver', 'gear:pads']);
    for (const a of level.areas) for (const L of a.locks || []) { useful.add(L.id); for (const k of L.needsAll || []) useful.add(k); }
    level.areas.forEach((a, ai) => {
      for (const s of a.spawns) {
        if (s.needs && !needOk(s.needs)) continue;
        if (VALIDATOR_EXITS[s.type]) { const X = VALIDATOR_EXITS[s.type]; gates.push({ ai, key: s.exit || 'warp', x: s.x - X.w / 2, y: s.y - X.h, w: X.w, h: X.h, hit: false }); }
        if (s.type === 'button') buttons.push({ ai, rule: s.rule, x: s.x - VALIDATOR_BUTTON.w / 2, y: s.y - VALIDATOR_BUTTON.h, w: VALIDATOR_BUTTON.w, h: VALIDATOR_BUTTON.h });
        if (s.type === 'key') keys.push({ ai, id: s.id, x: s.x - 12, y: s.y - 30, w: 24, h: 30 });
        if (s.type === 'gold') golds.push({ ai, idx: s.idx, x: s.x - 13, y: s.y - 16 - 13, w: 26, h: 26, hit: false });
        if (s.type === 'gate') gates.push({ ai, key: s.exit || (s.secret ? 'secret' : 'main'), x: s.x - 18, y: s.y - 120, w: 36, h: 120, hit: false });
        if (VALIDATOR_PORTALS[s.type]) portals.push({ ai, s, x: s.x - 14, y: s.y - 52, w: 28, h: 52, hit: false });
      }
      for (const v of a.vkeys || []) vkeys.push({ ai, id: v.id, mode: v.mode || 'any', tiles: v.tiles, touched: new Set() });
      // abilities granted on the spot (for walls only they break): 'big' under a mushroom block, 'sig' at a signature
      // block or a friend who gives one, 'ball' where a ball waits
      for (const k in a.contents || {}) { const c = a.contents[k], [x, y] = k.split(',').map(Number); if (c === 'power' && useful.has('big')) vkeys.push({ ai, id: 'big', mode: 'any', tiles: [[x, y + 1], [x, y + 2], [x, y + 3]], touched: new Set() }); if ((c === 'sig' || String(c).startsWith('sig:')) && useful.has('sig')) vkeys.push({ ai, id: 'sig', mode: 'any', tiles: [[x, y + 1], [x, y + 2], [x, y + 3]], touched: new Set() }); }
      for (const s of a.spawns) {
        if (s.needs && !needOk(s.needs)) continue;
        const C = ENTITY_TYPES[s.type], give = s.give || (C && C.cfg && C.cfg.give);
        if (give && String(give).startsWith('sig:') && useful.has('sig')) vkeys.push({ ai, id: 'sig', mode: 'any', tiles: [[Math.floor(s.x / TS), Math.floor((s.y - 1) / TS)]], touched: new Set() });
        if ((s.type === 'tourBall' || s.ball) && useful.has('ball')) vkeys.push({ ai, id: 'ball', mode: 'any', tiles: [[Math.floor(s.x / TS), Math.floor((s.y - 1) / TS)]], touched: new Set() });
      }
      for (const e of a.edges || []) edges.push({ ai, from: e.from, to: e.to, area: e.area != null ? e.area : ai });
      const tg = a.toggles || {};
      for (const g in tg) { for (const sw of tg[g].switches || []) switches.push({ ai, g: +g, tx: sw[0], ty: sw[1] }); if (tg[g].auto) autos.push({ ai, g: +g }); }
    });
    const exitKeys = Object.keys((level.design && level.design.exits) || {}).filter(k => (k === 'main' || ((level.design.exits[k] || {}).to)) && needOk(level.design.exits[k] && level.design.exits[k].needs));
    const res = { goal: false, secretGoal: false, gold: [false, false, false], warps: [], nodes: 0, sims: 0, exits: {}, areasReached: level.areas.map(() => false), pace: { ok: true, margin: null }, budget: { ok: true, errors: [] }, buttons: {}, seams: {} };
    const buttonRules = [...new Set(buttons.map(b => b.rule))];
    // per-area pace (Hourglass Well, a chase in a sub-area): where each area was first entered, and its goal reached
    const enterAt = level.areas.map(() => null), goals = this.paceGoals(level), goalAt = level.areas.map(() => null);
    const seen = new Set();
    const dist = new Map();
    const queue = [];
    const D = opts.dim || PLAYER_DIM.big;   // Brady's body (tools/sbw_items_test.js asks about small Brady too)
    const S0 = opts.start || level.start;   // a search from elsewhere (Validator.escape: the way back from a room)
    const startTx = Math.floor(S0.x / TS), startTy = Math.floor(S0.y / TS);
    const exitAt = {};   // exit key -> distance (tiles) along the search
    let curDist = 0;
    // a node: area, tile, toggle mask, distance and f (1 = standing upside down on a ceiling inside a flip band)
    const push = (ai, tx, ty, mask, d, f) => {
      f = f ? 1 : 0;
      const k = (((mask * 2 + f) * 64 + ai) * 4096 + tx) * 1024 + ty;
      if (seen.has(k)) return; seen.add(k); queue.push([ai, tx, ty, mask, d == null ? curDist : d, f]);
    };
    const markBox = (ai, b) => {
      for (const k of keys) if (k.ai === ai && !held.has(k.id) && overlap(b, k)) { held.add(k.id); if (useful.has(k.id)) newKey = true; }
      for (const g of golds) if (!g.hit && g.ai === ai && overlap(b, g)) { g.hit = true; res.gold[g.idx] = true; }
      if (opts.probes) for (const q of opts.probes) if (!q.hit && q.ai === ai && overlap(b, q)) q.hit = true;   // boxes a test asks about (tools/sbw_items_test.js)
      for (const g of gates) if (g.ai === ai && overlap(b, g)) { if (!g.hit) { g.hit = true; res.exits[g.key] = true; } if (exitAt[g.key] == null || curDist < exitAt[g.key]) exitAt[g.key] = curDist; }
      if (buttons.length) for (const z of buttons) if (z.ai === ai && overlap(b, z)) res.buttons[z.rule] = true;
      if (goals[ai]) for (const q of goals[ai]) if (overlap(b, q) && (goalAt[ai] == null || curDist < goalAt[ai])) goalAt[ai] = curDist;
      for (const v of vkeys) {
        if (v.ai !== ai || held.has(v.id)) continue;
        for (const [x, y] of v.tiles) if (overlap(b, { x: x * TS, y: y * TS, w: TS, h: TS })) v.touched.add(x + ',' + y);
        if (v.mode === 'all' ? v.touched.size >= v.tiles.length : v.touched.size > 0) { held.add(v.id); if (useful.has(v.id)) newKey = true; }
      }
    };
    let curMask = 0;
    // through a seam: on to its target, like a door
    const seamGo = (ai, s) => { res.seams[TourSeams.key(level.areas[ai], s)] = true; const tg = s.target; push(tg.area, Math.floor(tg.x / TS), Math.floor(tg.y / TS), curMask, curDist + 2); };
    const portalCheck = (ai, b) => {
      for (const p of portals) {
        if (p.ai !== ai || !overlap(b, p)) continue;
        if (!p.hit) { p.hit = true; if (p.s.warpWorld) res.warps.push(p.s.warpWorld); }
        const tg = p.s.target;
        if (tg) push(tg.area, Math.floor(tg.x / TS), Math.floor(tg.y / TS), curMask, curDist + 2);
      }
      for (const e of edges) if (e.ai === ai && overlap(b, { x: e.from[0] * TS, y: e.from[1] * TS, w: TS, h: TS })) push(e.area, e.to[0], e.to[1], curMask, curDist + Math.abs(e.to[0] - e.from[0]) + Math.abs(e.to[1] - e.from[1]));
      for (const s of switches) if (s.ai === ai && overlap(b, { x: s.tx * TS, y: s.ty * TS, w: TS, h: TS })) { const tx = Math.floor((b.x + b.w / 2) / TS), ty = Math.floor((b.y + b.h + 1) / TS); push(ai, tx, ty, curMask ^ (1 << s.g), curDist + 1); }
    };
    const standable = (A, tx, ty, f) => {
      const t = tileAt(A, tx, ty);
      // upside down (a flip band): the ceiling tile is the floor, the two tiles below are the headroom
      if (f) return !!SOLID[t] && t !== T.SPIKES_CEIL && !(A.surf && A.surf[ty * A.W + tx] === SURF.BOUNCE) && !SOLID[tileAt(A, tx, ty + 1)] && !SOLID[tileAt(A, tx, ty + 2)];
      if (!(SOLID[t] || t === T.SEMI) || t === T.SPIKES) return false;
      if (A.surf && A.surf[ty * A.W + tx] === SURF.BOUNCE) return false;   // you never stand still on a trampoline
      return !SOLID[tileAt(A, tx, ty - 1)] && !SOLID[tileAt(A, tx, ty - 2)];
    };
    const v2 = !!level.v2;
    const done = () => {
      if (!res.exits.main || !res.gold.every(Boolean)) return false;
      if (!v2) return (!level.secret || res.exits.secret || res.warps.length) && (!level.warps || res.warps.length >= level.warps.length);
      return exitKeys.every(k => res.exits[k]) && res.areasReached.every(Boolean) && buttonRules.every(n => res.buttons[n]);
    };
    // several passes: whenever a key is reached, its locks open and the search starts over
    const maxPass = v2 ? 8 : 6, guardMax = v2 ? 80000 : 20000;
    for (let pass = 0; pass < maxPass; pass++) {
      newKey = false;
      for (const A of proxies.values()) this.openLocks(A, held);
      seen.clear(); queue.length = 0;
      curDist = 0;
      push(S0.area, startTx, startTy, 0, 0);
      let guard = 0;
      while (queue.length && guard++ < guardMax) {
        const [ai, tx, ty, mask, d, f] = queue.shift();
        curMask = mask; curDist = d;
        const A = proxy(ai, mask);
        res.nodes++;
        res.areasReached[ai] = true;
        if (enterAt[ai] == null || d < enterAt[ai]) enterAt[ai] = d;
        if (opts.trace) (res.trace = res.trace || []).push([ai, tx, ty, mask, f]);
        for (const au of autos) if (au.ai === ai) push(ai, tx, ty, mask ^ (1 << au.g), d + 1, f);
        const seamCell = A.seams ? (x, y) => { const s = TourSeams.cellHit(A, x, y); if (s) seamGo(ai, s); } : null;
        if (A.water) { this.flood(A, ai, tx, ty, markBox, portalCheck, seamCell); continue; }
        // a water line (valve, tide, flood) in a dry area: swim the connected water, climb out at its edges
        if (!f && A.mixed && (tileAt(A, tx, ty - 1) === T.WATER || tileAt(A, tx, ty - 2) === T.WATER)) { this.swimOut(A, ai, tx, ty, mask, d, markBox, portalCheck, push, standable, seamCell); continue; }
        // v2: a spot inside solid rock is no place to stand (dug soil is the exception)
        if (v2 && !f) { const t1 = tileAt(A, tx, ty - 1), t2 = tileAt(A, tx, ty - 2); if ((SOLID[t1] && t1 !== T.SOIL) || (SOLID[t2] && t2 !== T.SOIL)) continue; }
        if (f && (SOLID[tileAt(A, tx, ty + 1)] || SOLID[tileAt(A, tx, ty + 2)])) continue;
        const nodeBody = { x: tx * TS + TS / 2 - D.w / 2, y: f ? (ty + 1) * TS : ty * TS - D.h, w: D.w, h: D.h };
        markBox(ai, nodeBody); portalCheck(ai, nodeBody);
        if (A.seams && !f) { const s = TourSeams.nodeHit(A, tx, ty, D); if (s) seamGo(ai, s); }
        // a crawlway with the knee pads: in at one end, out at the other
        if (!f && held.has('gear:pads')) for (const c of A.crawl) { if (c.a[0] === tx && c.a[1] === ty) push(ai, c.b[0], c.b[1], mask, d + c.b[0] - c.a[0]); if (c.b[0] === tx && c.b[1] === ty) push(ai, c.a[0], c.a[1], mask, d + c.b[0] - c.a[0]); }
        // dig down through soil (the soil under Brady's feet goes; he stands on what is below)
        if (!f && tileAt(A, tx, ty) === T.SOIL) push(ai, tx, ty + 1, mask, d + 1);
        for (const dir of [-1, 1]) if (standable(A, tx + dir, ty, f) && !SOLID[tileAt(A, tx + dir, f ? ty + 1 : ty - 1)]) push(ai, tx + dir, ty, mask, d + 1, f);
        // down a dug hole (soil all around): only digging on, or stepping out sideways into a cavern
        if (!f && (tileAt(A, tx, ty - 1) === T.SOIL || tileAt(A, tx, ty - 2) === T.SOIL)) {
          for (const dir of [-1, 1]) { res.sims++; const land = this.simulate(A, ai, tx, ty, { dir, sp: PHYS.walk, off: 0, hold: 0, jump: false }, D, markBox, 1); if (land && land.seam) seamGo(ai, land.seam); else if (land) push(ai, land[0], land[1], mask, d + 1); }
          continue;
        }
        const runwayBack = dir => { let n = 0; while (n < 8 && standable(A, tx - dir * (n + 1), ty, f)) n++; return n; };
        const onSpring = !f && A.springs.has(tx + ',' + ty);
        const maneuvers = [];
        for (const dir of [-1, 1]) {
          const edge = !standable(A, tx + dir, ty, f);
          const rb = runwayBack(dir);
          const speeds = [0, rb >= 1 ? PHYS.walk : PHYS.walk * 0.55];
          if (rb >= 5) speeds.push(PHYS.run);
          const offs = edge ? [0, 1] : [0];
          for (const sp of speeds) for (const off of offs) {
            for (const hold of [0.1, 0.22, 2]) maneuvers.push({ dir, sp, off, hold, jump: true });
            if (edge && sp > 0) maneuvers.push({ dir, sp, off, hold: 0, jump: false });
          }
          maneuvers.push({ dir, sp: 0, off: 0, hold: 2, jump: true, delay: 0.16 });
          maneuvers.push({ dir, sp: 0, off: 0, hold: 2, jump: true, delay: 0.3 });
          maneuvers.push({ dir, sp: PHYS.walk * 0.6, off: 0, hold: 2, jump: true, reverseAt: 0.35 });
          if (edge) maneuvers.push({ dir, sp: PHYS.walk * 0.5, off: 1, hold: 0, jump: false, mash: true });
          if (A.zones.length) {
            // updrafts: hover first, drift out later
            for (const dl of [0.7, 1.3, 2.0]) maneuvers.push({ dir, sp: 0, off: 0, hold: 3, jump: true, delay: dl });
            if (edge) for (const dl of [0.6, 1.2]) maneuvers.push({ dir, sp: PHYS.walk, off: 0, hold: 3, jump: true, stopAt: 0.25, resumeAt: 0.25 + dl });
          }
        }
        maneuvers.push({ dir: 0, sp: 0, off: 0, hold: 2, jump: true });
        if (onSpring) maneuvers.push({ dir: 0, sp: 0, off: 0, hold: 2, jump: false, spring: true }, { dir: 1, sp: 0, off: 0, hold: 2, jump: false, spring: true }, { dir: -1, sp: 0, off: 0, hold: 2, jump: false, spring: true });
        // carrying something fragile: lower jumps until it is delivered (§1 CARRY)
        const jumpBoost = A.carry && !held.has('deliver') ? (A.carry.jumpMul || 0.92) : 1;
        for (const m of maneuvers) {
          res.sims++;
          const land = this.simulate(A, ai, tx, ty, m, D, markBox, jumpBoost, f);
          if (land && land.seam) { seamGo(ai, land.seam); continue; }
          if (land) push(ai, land[0], land[1], mask, d + Math.abs(land[0] - tx) + Math.abs(land[1] - ty), land[2]);
        }
        if (opts.earlyExit && done()) break;
        if (opts.until && opts.until(res)) break;
        if (opts.probes && opts.untilProbes && (typeof opts.untilProbes === 'function' ? opts.untilProbes() : opts.probes.every(q => q.hit))) break;   // the probes asked about are answered
      }
      if (guard >= guardMax) res.guardHit = true;
      if (opts.earlyExit && done()) break;
      if (opts.until && opts.until(res)) break;
      if (!newKey) break;
    }
    res.goal = !!res.exits.main;
    res.secretGoal = !!res.exits.secret;
    res.held = [...held];
    // pace (§6.1): the hazard must lose to Brady's shortest route by 25 %
    res.pace = this.pace(level, exitAt, enterAt, goalAt);
    res.budget = this.budget(level);
    res.ms = Date.now() - t0;
    res.exitKeys = exitKeys;
    res.buttonRules = buttonRules;
    res.ok = v2 ? (exitKeys.every(k => res.exits[k]) && res.gold.every(Boolean) && res.areasReached.every(Boolean) && res.pace.ok && buttonRules.every(n => res.buttons[n])) : res.goal;
    return res;
  },

  /* pace: time along the route found (tiles / (6.2 t/s x 0.8)) against the area's chaser, rising liquid or autoscroll */
  pace(level, exitAt, enterAt, goalAt) {
    const a0 = level.areas[0], spd = 6.2 * 0.8;
    const d = exitAt.main;
    const out = { ok: true, margin: null, route: d == null ? null : d };
    if (d == null) return out;
    const tBrady = d / spd;
    let tHazard = null;
    if (a0.chase && a0.chase.speed) { const gx = this.exitX(a0); tHazard = gx / a0.chase.speed; }
    else if (a0.risingLava && a0.risingLava.speed) tHazard = (a0.risingLava.delay || 0) + (a0.H - 4) / a0.risingLava.speed;
    else if (a0.risingWater && a0.risingWater.speed) tHazard = (a0.risingWater.delay || 0) + (a0.H - 4) / a0.risingWater.speed;
    else if (a0.autoscrollY && a0.autoscrollY.speed) tHazard = (a0.autoscrollY.delay || 0) + (a0.H - 4) / a0.autoscrollY.speed;
    if (tHazard != null) { out.margin = Math.round((tHazard / tBrady - 1) * 100) / 100; if (level.v2) out.ok = out.margin >= 0.25; }
    if (level.v2 && enterAt) this.paceAreas(level, out, enterAt, goalAt);
    return out;
  },
  /* secrets §5.6.6: every other area with a hazard (a chase, rising lava or water, a climbing camera) gets the same
     25 % margin, from where Brady first enters it to its goal: area.paceTo (an anchor name) if set, else its gate,
     else the exit (a door or seam to another area) furthest along the hazard (highest for a rising hazard, furthest
     from the start side for a chase). out.areas lists them; a miss fails out.ok. */
  HAZARD(a) { return (a.chase && a.chase.speed) || (a.risingLava && a.risingLava.speed) || (a.risingWater && a.risingWater.speed) || (a.autoscrollY && a.autoscrollY.speed) ? true : false; },
  paceGoals(level) {
    return level.areas.map((a, k) => {
      if (k === 0 || !this.HAZARD(a)) return null;
      const box = (x, y, w, h) => ({ x, y, w, h });
      if (a.paceTo) { const p = a.anchors && a.anchors[a.paceTo]; return p ? [box(p.x - TS / 2, p.y - TS, TS, TS)] : []; }
      const gates = a.spawns.filter(s => s.type === 'gate' || VALIDATOR_EXITS[s.type]);
      if (gates.length) return gates.map(s => box(s.x - 18, s.y - 120, 36, 120));
      const out = [];
      for (const s of a.spawns) if (VALIDATOR_PORTALS[s.type] && s.target && s.target.area !== k) out.push(Object.assign(box(s.x - 14, s.y - 52, 28, 52), { gx: s.x, gy: s.y }));
      for (const s of a.seams || []) {
        const W = a.W * TS, H = a.H * TS, A0 = s.a * TS, L = (s.b - s.a + 1) * TS;
        const b = s.side === 'top' ? box(A0, -TS, L, 2 * TS) : s.side === 'bottom' ? box(A0, H - TS, L, 2 * TS) : s.side === 'left' ? box(-TS, A0, 2 * TS, L) : box(W - TS, A0, 2 * TS, L);
        out.push(Object.assign(b, { gx: b.x + b.w / 2, gy: b.y + b.h / 2 }));
      }
      if (!out.length) return [];
      const vertical = !(a.chase && a.chase.speed);
      const score = q => vertical ? -q.gy : (a.mirrored ? -q.gx : q.gx);
      const best = Math.max(...out.map(score));
      return out.filter(q => score(q) === best);
    });
  },
  paceAreas(level, out, enterAt, goalAt) {
    const spd = 6.2 * 0.8;
    level.areas.forEach((a, k) => {
      if (k === 0 || !this.HAZARD(a) || enterAt[k] == null) return;
      const r = { aid: a.aid, ok: true, margin: null, route: null };
      if (goalAt[k] == null) { r.ok = false; r.why = 'no goal reached'; }
      else {
        const d = Math.max(1, goalAt[k] - enterAt[k]), tBrady = d / spd;
        let gx = a.W;
        const g = a.paceTo && a.anchors && a.anchors[a.paceTo];
        const gate = a.spawns.find(s => s.type === 'gate' || VALIDATOR_EXITS[s.type]);
        if (g) gx = g.x / TS; else if (gate) gx = gate.x / TS;
        if (a.mirrored) gx = a.W - gx;
        let tHazard;
        if (a.chase && a.chase.speed) tHazard = gx / a.chase.speed;
        else if (a.risingLava && a.risingLava.speed) tHazard = (a.risingLava.delay || 0) + (a.H - 4) / a.risingLava.speed;
        else if (a.risingWater && a.risingWater.speed) tHazard = (a.risingWater.delay || 0) + (a.H - 4) / a.risingWater.speed;
        else tHazard = (a.autoscrollY.delay || 0) + (a.H - 4) / a.autoscrollY.speed;
        r.route = d; r.margin = Math.round((tHazard / tBrady - 1) * 100) / 100; r.ok = r.margin >= 0.25;
      }
      (out.areas = out.areas || []).push(r);
      if (!r.ok) out.ok = false;
    });
  },
  exitX(a) { const g = a.spawns.find(s => s.type === 'gate'); return g ? g.x / TS : a.W; },

  /* secrets: the way out of an area. A search that starts at area k's entry ('in' anchor, else a seam's landing spot
     in it) and stops as soon as it reaches any area in `to` (default: any other area). Returns true when it does.
     validate_levels uses it for SEAM <aid>/<side> HAS NO WAY BACK and ROOM <aid> HAS NO WAY OUT. */
  escape(level, k, to, opts) {
    const a = level.areas[k];
    let st = a.anchors && (a.anchors.in || a.anchors.start);
    if (!st) for (const b of level.areas) for (const s of b.seams || []) if (!st && s.target && s.target.area === k) st = s.target;
    if (!st) return false;
    const want = to || level.areas.map((_, j) => j).filter(j => j !== k);
    const r = this.run(level, Object.assign({}, opts || {}, { start: { area: k, x: st.x, y: st.y }, earlyExit: false, until: res => want.some(j => res.areasReached[j]) }));
    return want.some(j => r.areasReached[j]);
  },
  /* secrets §3.2 / §3.3 / §5.6.7: build rules for seams and backstage areas, per level. Returns { errors, warnings }.
     - a seam needs a target, and at most one seam per side per area
     - no seams in autoscroll, climbing-camera, rail, boss arena, flip or CARRY areas
     - a seam's edge must be open over its span (no solid tile all the way along it)
     - Under-Stage: a bottom seam covers one whole pit (the only non-deadly pit there) and that pit carries a tell
       (a TourSeams.TELLS spawn, or any spawn with tell: true, over the span) */
  secretRules(level) {
    const errors = [], warnings = [];
    level.areas.forEach((a, k) => {
      const S = a.seams || [];
      if (!S.length) return;
      const nm = s => TourSeams.key(a, s);
      const sides = {};
      for (const s of S) { if (sides[s.side]) errors.push(`SEAM ${nm(s)}: two seams on one side`); sides[s.side] = true; }
      const why = a.autoscroll ? 'autoscroll' : a.autoscrollY ? 'climbing-camera' : a.gen === 'rail' || a.rail ? 'rail' : (a.role === 'arena' || a.gen === 'arena' || a.spawns.some(s => s.type === 'boss')) ? 'boss arena' : (a.zones || []).some(z => z.kind === 'flip') ? 'flip' : a.carry ? 'CARRY' : null;
      if (why) errors.push(`SEAM ${nm(S[0])}: seams are not allowed in a ${why} area`);
      for (const s of S) {
        if (!s.target) errors.push(`SEAM ${nm(s)} HAS NO TARGET (${s.toRef || 'no ref'})`);
        if (s.needs && !(typeof TourNeeds !== 'undefined' && TourNeeds.valid(s.needs))) errors.push(`SEAM ${nm(s)}: bad needs ${JSON.stringify(s.needs)}`);
        const len = s.side === 'top' || s.side === 'bottom' ? a.W : a.H;
        if (s.a < 0 || s.b >= len) { errors.push(`SEAM ${nm(s)}: span ${s.a}..${s.b} is outside the area`); continue; }
        let open = 0;
        for (let t = s.a; t <= s.b; t++) {
          const tile = s.side === 'top' ? a.tiles[t] : s.side === 'bottom' ? a.tiles[(a.H - 1) * a.W + t] : s.side === 'left' ? a.tiles[t * a.W] : a.tiles[t * a.W + a.W - 1];
          if (!SOLID[tile]) open++;
        }
        if (!open) errors.push(`SEAM ${nm(s)}: the edge is solid over the whole span ${s.a}..${s.b}`);
        if (s.side === 'bottom' && !a.water) {
          // pits: runs of columns whose bottom row is open (no solid tile, no one-way floor)
          const row = (a.H - 1) * a.W, pit = x => { const t = a.tiles[row + x]; return !SOLID[t] && t !== T.SEMI; };
          let x0 = s.a; while (x0 > 0 && pit(x0 - 1)) x0--;
          let x1 = s.b; while (x1 < a.W - 1 && pit(x1 + 1)) x1++;
          let inside = true; for (let x = s.a; x <= s.b; x++) if (!pit(x)) inside = false;
          if (!inside) errors.push(`UNDER-STAGE ${nm(s)}: the span ${s.a}..${s.b} is not one open pit`);
          else if (x0 < s.a || x1 > s.b) errors.push(`UNDER-STAGE ${nm(s)}: the pit is ${x0}..${x1} but the seam covers only ${s.a}..${s.b} (the seam pit must be wholly safe)`);
          const tells = (typeof TourSeams !== 'undefined' && TourSeams.TELLS) || {};
          const told = a.spawns.some(sp => (tells[sp.type] || sp.tell) && sp.x / TS >= s.a - 1 && sp.x / TS <= s.b + 2);
          if (!told && !s.tell) errors.push(`UNDER-STAGE ${nm(s)}: the seam pit has no tell (a crash mat or a spawn with tell: true)`);
        }
      }
    });
    return { errors, warnings };
  },

  /* the power-up budget of §5.3 (counted over all areas; 'opportunity' = item block, hidden block with an item, gear
     stand, friend who gives something, shop). Rules:
     1 at least 2 opportunities; 2 at most 5 item blocks in the main area (7 in a secret level: rule 7);
     3 the first opportunity within the first 25 % of the main area (by x from the start side, by height for climbs,
       by depth for shafts); 4 the archetype's gear from a gear stand before the twist beat (the first half of the main
       area), and any gear a lock or crawlway needs from a stand in the same level; 5 one premium item (L, S, sundial,
       1UP, magnet) in a secret or risky spot (another area, a hidden block, or next to a hidden / risky postcard);
     6 boss levels: two opportunities in the lead-in before the arena; 8 jump powers: at most 2, none in a boss
     area or a CARRY area. */
  ARCH_GEAR: { dive: 'fins', tide: 'fins', dig: 'hat', lamp: 'hat', sneak: 'box', glide: 'plane', fall: 'plane', beat: 'kazoo' },
  PREMIUM: { lsd: true, star: true, sundial: true, oneup: true, magnet: true },
  JUMP: { socks: true, cake: true, beans: true },
  budget(level) {
    const errors = [], warnings = [];
    if (!level.v2) return { ok: true, errors, warnings, skipped: true };
    const S = level.design || {}, main = level.areas[0];
    const items = a => Object.keys(a.contents || {}).filter(k => a.contents[k] && a.contents[k] !== 'pick' && a.contents[k] !== 'picks');
    const giver = s => s.type === 'gearStand' || s.type === 'souvenirShop' || (s.type && /Xolo|Friend|friend/.test(s.type)) || s.give || !!(ENTITY_TYPES[s.type] && ENTITY_TYPES[s.type].cfg && ENTITY_TYPES[s.type].cfg.give);
    const opp = a => items(a).length + a.spawns.filter(giver).length;
    let total = 0; for (const a of level.areas) total += opp(a);
    if (total < 2) errors.push(`only ${total} power-up opportunities (needs 2)`);
    const mainBlocks = items(main).length;
    const cap = S.secret ? 7 : 5;
    if (mainBlocks > cap) errors.push(`${mainBlocks} item blocks in the main area (max ${cap})`);
    // how far into the main area a tile is, from where Brady starts (0 = the start, 1 = the far end)
    const shaft = main.gen === 'shaft', vertical = !shaft && (main.tower || main.gen === 'climb' || main.gen === 'rise');
    const along = (x, y) => vertical ? (main.H - y) / main.H : shaft ? y / main.H : (main.mirrored ? (main.W - 1 - x) / main.W : x / main.W);
    const pos = [];
    for (const k of items(main)) { const [x, y] = k.split(',').map(Number); pos.push([x, y]); }
    for (const s of main.spawns) if (giver(s)) pos.push([Math.floor(s.x / TS), Math.floor(s.y / TS)]);
    if (pos.length) {
      const f = Math.min(...pos.map(p => along(p[0], p[1])));
      if (f > 0.25) errors.push(`the first power-up opportunity is ${Math.round(f * 100)} % into the main area (max 25 %)`);
    } else if (total) warnings.push('no power-up opportunity in the main area');
    // rule 4: the archetype's gear from a stand, before the twist; gear a lock or crawlway needs comes from a stand
    const stands = [];
    level.areas.forEach((a, ai) => { for (const s of a.spawns) if (s.type === 'gearStand') stands.push({ ai, item: s.item || 'plane', f: ai === 0 ? along(Math.floor(s.x / TS), Math.floor((s.y - 1) / TS)) : 0 }); });
    const arch = S.arch, flood = main.gen === 'rise' && main.risingWater;
    const need = flood ? 'fins' : this.ARCH_GEAR[arch];
    if (need) {
      const st = stands.filter(s => s.item === need);
      if (!st.length) errors.push(`${(arch || '').toUpperCase()} needs a ${need} gear stand (rule 4)`);
      else if (Math.min(...st.map(s => s.f)) > 0.5) errors.push(`the ${need} gear stand is ${Math.round(Math.min(...st.map(s => s.f)) * 100)} % in: put it before the twist (first half, rule 4)`);
    }
    const needed = new Set();
    for (const a of level.areas) {
      for (const L of a.locks || []) if (/^gear:/.test(L.id)) needed.add(L.id.slice(5));
      if (a.tiles && a.tiles.indexOf(T.LINTEL) >= 0) needed.add('pads');
    }
    for (const g of needed) if (!stands.some(s => s.item === g)) errors.push(`a lock or crawlway needs ${g}: add a ${g} gear stand to this level (rule 4)`);
    // rule 5: one premium item in a secret or risky spot
    const premium = [];
    level.areas.forEach((a, ai) => {
      for (const k of items(a)) if (this.PREMIUM[a.contents[k]]) { const [x, y] = k.split(',').map(Number); premium.push({ ai, x, y, hidden: a.tiles[y * a.W + x] === T.HIDDEN }); }
      for (const s of a.spawns) if (s.type === 'gearStand' && this.PREMIUM[s.item]) premium.push({ ai, x: Math.floor(s.x / TS), y: Math.floor((s.y - 1) / TS) });
    });
    const tucked = p => {
      const a = level.areas[p.ai];
      if (p.ai > 0 && a.role !== 'arena' && a.gen !== 'arena') return true;
      if (p.hidden) return true;
      // behind a secret mechanism: next to light-only stones or a fake wall
      for (let y = p.y - 3; y <= p.y + 3; y++) for (let x = p.x - 3; x <= p.x + 3; x++) { if (x < 0 || y < 0 || x >= a.W || y >= a.H) continue; const i = y * a.W + x; if (a.tiles[i] === T.FAKE || (a.hide && a.hide[i] === 3)) return true; }
      return a.spawns.some(s => s.type === 'gold' && (s.kind === 'risky' || s.kind === 'hidden') && Math.abs(s.x / TS - p.x) <= 5 && Math.abs(s.y / TS - p.y) <= 6);
    };
    // a warning for now (levels written before the rule landed); an error at release
    const r5 = Validator.STRICT5 ? errors : warnings;
    if (!premium.length) r5.push('no premium item (L, S, sundial, 1UP or magnet) in a secret or risky spot (rule 5)');
    else if (!premium.some(tucked)) r5.push('the premium items are all in plain sight: put one in a secret or risky spot (rule 5)');
    // rule 6: a boss level hands out two opportunities on the way to the arena
    const arena = a => a.role === 'arena' || a.gen === 'arena';
    if (S.arch === 'lair' || S.kind === 'castle') {
      let lead = 0;
      for (const a of level.areas) {
        if (arena(a) || a.role === 'secret') continue;
        const boss = a.spawns.find(s => s.type === 'boss'), x0 = boss && boss.arenaX0 != null ? boss.arenaX0 : Infinity;
        lead += items(a).filter(k => +k.split(',')[0] < x0).length + a.spawns.filter(s => giver(s) && s.x / TS < x0).length;
      }
      if (lead < 2) errors.push(`only ${lead} power-up opportunities in the boss lead-in (needs 2, rule 6)`);
    }
    // rule 8: the jump powers (spring socks, pound cake, magic beans) are bonuses: at most two per level, never inside a
    // boss arena (or a boss's area), never in a CARRY area (they would skip the carry's lower jumps); the search above
    // never uses them, so every exit and postcard is already reachable without one
    let jumps = 0;
    level.areas.forEach(a => {
      const here = items(a).filter(k => this.JUMP[a.contents[k]]).length + a.spawns.filter(s => s.type === 'gearStand' && this.JUMP[s.item]).length;
      jumps += here;
      if (here && (arena(a) || a.spawns.some(s => s.type === 'boss'))) errors.push(`a jump power inside a boss area '${a.aid || a.idx}' (rule 8): put it in the lead-in`);
      if (here && a.carry) errors.push(`a jump power in the CARRY area '${a.aid || a.idx}' (rule 8)`);
    });
    if (jumps > 2) errors.push(`${jumps} jump powers in one level (max 2, rule 8)`);
    return { ok: !errors.length, errors, warnings };
  },

  simulate(A, ai, tx, ty, m, D, markBox, jumpBoost, f) {
    const b = { x: 0, y: f ? (ty + 1) * TS : ty * TS - D.h, w: D.w, h: D.h, vx: m.dir * m.sp, vy: 0, onGround: true, coyote: PHYS.coyote, jumpBuf: 0, jumping: false, runT: m.sp >= PHYS.run ? 1 : 0, airMax: Math.max(PHYS.walk, m.sp), facing: m.dir || 1, crouch: false, inWater: false, stroke: 0, groundTile: T.GROUND, groundTx: tx, groundTy: ty, dropT: 0, flipped: !!f };
    const cx = tx * TS + TS / 2;
    b.x = m.off ? (m.dir > 0 ? tx * TS + TS - b.w / 2 - 1 : tx * TS + b.w / 2 + 1) - b.w / 2 : cx - b.w / 2;
    if (m.spring) { b.vy = -PHYS.springV; b.onGround = false; b.coyote = 0; b.jumping = true; }
    const dt = STEP;
    const inp = { left: false, right: false, jump: false, jumpPressed: false, down: false, action: false };
    const popts = jumpBoost && jumpBoost !== 1 ? { jumpBoost } : {};
    let t = 0, air = false;
    const tMax = A.zones.length ? 4.4 : 3.2;
    while (t < tMax) {
      let dir = m.dir;
      if (m.delay && t < m.delay) dir = 0;
      if (m.stopAt && t > m.stopAt && t < m.resumeAt) dir = 0;
      if (m.reverseAt && t > m.reverseAt) dir = -m.dir;
      inp.left = dir < 0; inp.right = dir > 0;
      inp.action = m.sp >= PHYS.run;
      inp.jumpPressed = m.jump && t === 0;
      if (m.mash && b.inWater) inp.jumpPressed = Math.floor(t / 0.28) !== Math.floor((t - dt) / 0.28);
      inp.jump = (m.jump || m.spring) ? t < m.hold : (m.mash ? true : false);
      playerPhysicsFlip(b, inp, A, dt, null, popts);
      t += dt;
      markBox(ai, b);
      // secrets: leaving through a seam on this area's edge goes on to its target (checked before the pit line)
      if (A.seams) { const s = TourSeams.hit(A, b, inp.left ? -1 : inp.right ? 1 : 0); if (s) return { seam: s }; }
      if (b.y > A.H * TS + 40 || b.y + b.h < -40) return null;
      if (lavaContact(b, A)) return null;
      if (spikeContact(b, A)) return null;
      if (!b.onGround) air = true;
      if (b.onGround && air) {
        const lx = Math.floor((b.x + b.w / 2) / TS);
        const lt = b.groundTy;
        // spring bounce
        if (A.springs.has(lx + ',' + lt) || A.springs.has(b.groundTx + ',' + lt)) {
          b.vy = -PHYS.springV; b.onGround = false; b.jumping = true; air = true; inp.jump = true; m = Object.assign({}, m, { hold: t + 2, jump: true }); continue;
        }
        return [lx, lt, b.flipped ? 1 : 0];
      }
      if (b.onGround && !air && t > 0.5) {
        // walked without leaving the ground: report where we ended
        return [Math.floor((b.x + b.w / 2) / TS), b.groundTy, b.flipped ? 1 : 0];
      }
    }
    return null;
  },

  // swimming in a water line: flood the connected water; every dry standing spot next to it (a leap of about 3 tiles
  // up out of the surface, or a step onto a bank) becomes a node. One flood per region and mask.
  swimOut(A, ai, tx, ty, mask, d, markBox, portalCheck, push, standable, seamCell) {
    const W = A.W, H = A.H, key = mask + ':' + ai;
    A.swum = A.swum || {}; const done = A.swum[key] || (A.swum[key] = new Uint8Array(W * H));
    const wet = (x, y) => x >= 0 && x < W && y >= 0 && y < H && A.tiles[y * W + x] === T.WATER;
    const st = [[tx, ty - 1]], seen = new Uint8Array(W * H);
    while (st.length) {
      const [x, y] = st.pop();
      if (!wet(x, y) || seen[y * W + x]) continue;
      seen[y * W + x] = 1;
      if (done[y * W + x]) continue;
      done[y * W + x] = 1;
      const b = { x: x * TS + 5, y: (y - 1) * TS + 4, w: 22, h: 54 };
      markBox(ai, b); portalCheck(ai, b);
      if (seamCell) seamCell(x, y);
      if (!wet(x, y - 1)) for (let k = -3; k <= 3; k++) for (let ys = y - 3; ys <= y + 1; ys++) if (!wet(x + k, ys - 1) && standable(A, x + k, ys)) push(ai, x + k, ys, mask, d + Math.abs(k) + Math.abs(ys - y));
      if (SOLID[tileAt(A, x, y + 1)] && !wet(x - 1, y) && standable(A, x - 1, y + 1)) push(ai, x - 1, y + 1, mask, d + 1);
      if (SOLID[tileAt(A, x, y + 1)] && !wet(x + 1, y) && standable(A, x + 1, y + 1)) push(ai, x + 1, y + 1, mask, d + 1);
      st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  },
  flood(A, ai, sx, sy, markBox, portalCheck, seamCell) {
    const W = A.W, H = A.H;
    const free = (x, y) => x >= 0 && x < W && y >= 0 && y < H && !SOLID[A.tiles[y * W + x]] && A.tiles[y * W + x] !== T.LAVA;
    const ok = (x, y) => free(x, y) && free(x, y - 1);
    const seen = new Uint8Array(W * H);
    const q = [[sx, sy - 1]];
    while (q.length) {
      const [x, y] = q.pop();
      if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x] || !ok(x, y)) continue;
      seen[y * W + x] = 1;
      const b = { x: x * TS + 5, y: (y - 1) * TS + 4, w: 22, h: 54 };
      markBox(ai, b); portalCheck(ai, b);
      if (seamCell) seamCell(x, y);
      q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }
};
