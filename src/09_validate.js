/* ============================================================
   Level validator — simulates Brady's real physics from every
   reachable standing spot to prove each level can be finished
   and every gold record collected.
   v2 (LEVEL_OVERHAUL.md §6.1): several areas joined by doors,
   virtual keys, one-way edges, toggle groups (a bitmask in the
   search state), crawlways, carry physics, pace and coverage.
   ============================================================ */
const VALIDATOR_PORTALS = { portal: true, trapdoor: true, teleport: true };
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
    const locks = (area.locks || []).map(L => ({ id: L.id, tiles: L.tiles }));
    // tiles under the water line are water (tide and valve levels)
    if (waterLine != null) for (let y = waterLine; y < H; y++) for (let x = 0; x < W; x++) if (tiles[y * W + x] === T.EMPTY) tiles[y * W + x] = T.WATER;
    const A = { W, H, tiles, water: area.water, gravity: area.gravity || 1, springs, surf: area.surf || null, zones: z2, locks, waterLine, carry: area.carry || null, fallCap: area.fallCap || 0, airSteer: area.airSteer || 0 };
    A.mixed = !area.water && tiles.indexOf(T.WATER) >= 0;
    A.hasFlip = z2.some(z => z.kind === 'flip');
    return A;
  },
  openLocks(A, held) {
    for (const L of A.locks) if (!L.open && held.has(L.id)) { L.open = true; for (const [x, y] of L.tiles) A.tiles[y * A.W + x] = T.EMPTY; A.tileRev = (A.tileRev || 0) + 1; }
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
    const proxy = (ai, mask) => { const k = ai * 16 + mask; let A = proxies.get(k); if (!A) { A = this.proxyArea(level.areas[ai], mask); A.crawl = this.crawlways(A); proxies.set(k, A); } this.openLocks(A, held); return A; };
    const golds = [], gates = [], portals = [], keys = [], vkeys = [], edges = [], switches = [], autos = [];
    let newKey = false;
    // keys that change the search (a lock uses them, or the carry / crawl rules): only these restart a pass
    const useful = new Set(['deliver', 'gear:pads']);
    for (const a of level.areas) for (const L of a.locks || []) useful.add(L.id);
    level.areas.forEach((a, ai) => {
      for (const s of a.spawns) {
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
        const C = ENTITY_TYPES[s.type], give = s.give || (C && C.cfg && C.cfg.give);
        if (give && String(give).startsWith('sig:') && useful.has('sig')) vkeys.push({ ai, id: 'sig', mode: 'any', tiles: [[Math.floor(s.x / TS), Math.floor((s.y - 1) / TS)]], touched: new Set() });
        if ((s.type === 'tourBall' || s.ball) && useful.has('ball')) vkeys.push({ ai, id: 'ball', mode: 'any', tiles: [[Math.floor(s.x / TS), Math.floor((s.y - 1) / TS)]], touched: new Set() });
      }
      for (const e of a.edges || []) edges.push({ ai, from: e.from, to: e.to, area: e.area != null ? e.area : ai });
      const tg = a.toggles || {};
      for (const g in tg) { for (const sw of tg[g].switches || []) switches.push({ ai, g: +g, tx: sw[0], ty: sw[1] }); if (tg[g].auto) autos.push({ ai, g: +g }); }
    });
    const exitKeys = Object.keys((level.design && level.design.exits) || {}).filter(k => k === 'main' || ((level.design.exits[k] || {}).to));
    const res = { goal: false, secretGoal: false, gold: [false, false, false], warps: [], nodes: 0, sims: 0, exits: {}, areasReached: level.areas.map(() => false), pace: { ok: true, margin: null }, budget: { ok: true, errors: [] } };
    const seen = new Set();
    const dist = new Map();
    const queue = [];
    const D = PLAYER_DIM.big;
    const startTx = Math.floor(level.start.x / TS), startTy = Math.floor(level.start.y / TS);
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
      for (const g of gates) if (g.ai === ai && overlap(b, g)) { if (!g.hit) { g.hit = true; res.exits[g.key] = true; } if (exitAt[g.key] == null || curDist < exitAt[g.key]) exitAt[g.key] = curDist; }
      for (const v of vkeys) {
        if (v.ai !== ai || held.has(v.id)) continue;
        for (const [x, y] of v.tiles) if (overlap(b, { x: x * TS, y: y * TS, w: TS, h: TS })) v.touched.add(x + ',' + y);
        if (v.mode === 'all' ? v.touched.size >= v.tiles.length : v.touched.size > 0) { held.add(v.id); if (useful.has(v.id)) newKey = true; }
      }
    };
    let curMask = 0;
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
      return exitKeys.every(k => res.exits[k]) && res.areasReached.every(Boolean);
    };
    // several passes: whenever a key is reached, its locks open and the search starts over
    const maxPass = v2 ? 8 : 6, guardMax = v2 ? 80000 : 20000;
    for (let pass = 0; pass < maxPass; pass++) {
      newKey = false;
      for (const A of proxies.values()) this.openLocks(A, held);
      seen.clear(); queue.length = 0;
      curDist = 0;
      push(level.start.area, startTx, startTy, 0, 0);
      let guard = 0;
      while (queue.length && guard++ < guardMax) {
        const [ai, tx, ty, mask, d, f] = queue.shift();
        curMask = mask; curDist = d;
        const A = proxy(ai, mask);
        res.nodes++;
        res.areasReached[ai] = true;
        if (opts.trace) (res.trace = res.trace || []).push([ai, tx, ty, mask, f]);
        for (const au of autos) if (au.ai === ai) push(ai, tx, ty, mask ^ (1 << au.g), d + 1, f);
        if (A.water) { this.flood(A, ai, tx, ty, markBox, portalCheck); continue; }
        // a water line (valve, tide, flood) in a dry area: swim the connected water, climb out at its edges
        if (!f && A.mixed && (tileAt(A, tx, ty - 1) === T.WATER || tileAt(A, tx, ty - 2) === T.WATER)) { this.swimOut(A, ai, tx, ty, mask, d, markBox, portalCheck, push, standable); continue; }
        // v2: a spot inside solid rock is no place to stand (dug soil is the exception)
        if (v2 && !f) { const t1 = tileAt(A, tx, ty - 1), t2 = tileAt(A, tx, ty - 2); if ((SOLID[t1] && t1 !== T.SOIL) || (SOLID[t2] && t2 !== T.SOIL)) continue; }
        if (f && (SOLID[tileAt(A, tx, ty + 1)] || SOLID[tileAt(A, tx, ty + 2)])) continue;
        const nodeBody = { x: tx * TS + TS / 2 - D.w / 2, y: f ? (ty + 1) * TS : ty * TS - D.h, w: D.w, h: D.h };
        markBox(ai, nodeBody); portalCheck(ai, nodeBody);
        // a crawlway with the knee pads: in at one end, out at the other
        if (!f && held.has('gear:pads')) for (const c of A.crawl) { if (c.a[0] === tx && c.a[1] === ty) push(ai, c.b[0], c.b[1], mask, d + c.b[0] - c.a[0]); if (c.b[0] === tx && c.b[1] === ty) push(ai, c.a[0], c.a[1], mask, d + c.b[0] - c.a[0]); }
        // dig down through soil (the soil under Brady's feet goes; he stands on what is below)
        if (!f && tileAt(A, tx, ty) === T.SOIL) push(ai, tx, ty + 1, mask, d + 1);
        for (const dir of [-1, 1]) if (standable(A, tx + dir, ty, f) && !SOLID[tileAt(A, tx + dir, f ? ty + 1 : ty - 1)]) push(ai, tx + dir, ty, mask, d + 1, f);
        // down a dug hole (soil all around): only digging on, or stepping out sideways into a cavern
        if (!f && (tileAt(A, tx, ty - 1) === T.SOIL || tileAt(A, tx, ty - 2) === T.SOIL)) {
          for (const dir of [-1, 1]) { res.sims++; const land = this.simulate(A, ai, tx, ty, { dir, sp: PHYS.walk, off: 0, hold: 0, jump: false }, D, markBox, 1); if (land) push(ai, land[0], land[1], mask, d + 1); }
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
          if (land) push(ai, land[0], land[1], mask, d + Math.abs(land[0] - tx) + Math.abs(land[1] - ty), land[2]);
        }
        if (opts.earlyExit && done()) break;
      }
      if (guard >= guardMax) res.guardHit = true;
      if (opts.earlyExit && done()) break;
      if (!newKey) break;
    }
    res.goal = !!res.exits.main;
    res.secretGoal = !!res.exits.secret;
    res.held = [...held];
    // pace (§6.1): the hazard must lose to Brady's shortest route by 25 %
    res.pace = this.pace(level, exitAt);
    res.budget = this.budget(level);
    res.ms = Date.now() - t0;
    res.exitKeys = exitKeys;
    res.ok = v2 ? (exitKeys.every(k => res.exits[k]) && res.gold.every(Boolean) && res.areasReached.every(Boolean) && res.pace.ok) : res.goal;
    return res;
  },

  /* pace: time along the route found (tiles / (6.2 t/s x 0.8)) against the area's chaser, rising liquid or autoscroll */
  pace(level, exitAt) {
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
    return out;
  },
  exitX(a) { const g = a.spawns.find(s => s.type === 'gate'); return g ? g.x / TS : a.W; },

  /* the power-up budget of §5.3 (counted over all areas; 'opportunity' = item block, hidden block with an item, gear
     stand, friend who gives something, shop). Rules:
     1 at least 2 opportunities; 2 at most 5 item blocks in the main area (7 in a secret level: rule 7);
     3 the first opportunity within the first 25 % of the main area (by x from the start side, by height for climbs,
       by depth for shafts); 4 the archetype's gear from a gear stand before the twist beat (the first half of the main
       area), and any gear a lock or crawlway needs from a stand in the same level; 5 one premium item (L, S, sundial,
       1UP, magnet) in a secret or risky spot (another area, a hidden block, or next to a hidden / risky postcard);
     6 boss levels: two opportunities in the lead-in before the arena. */
  ARCH_GEAR: { dive: 'fins', tide: 'fins', dig: 'hat', lamp: 'hat', sneak: 'box', glide: 'plane', fall: 'plane', beat: 'kazoo' },
  PREMIUM: { lsd: true, star: true, sundial: true, oneup: true, magnet: true },
  budget(level) {
    const errors = [], warnings = [];
    if (!level.v2) return { ok: true, errors, warnings, skipped: true };
    const S = level.design || {}, main = level.areas[0];
    const items = a => Object.keys(a.contents || {}).filter(k => a.contents[k] && a.contents[k] !== 'pick' && a.contents[k] !== 'picks');
    const giver = s => s.type === 'gearStand' || s.type === 'souvenirShop' || (s.type && /Xolo|Friend|friend/.test(s.type)) || s.give;
    const opp = a => items(a).length + a.spawns.filter(giver).length;
    let total = 0; for (const a of level.areas) total += opp(a);
    if (total < 2) errors.push(`only ${total} power-up opportunities (needs 2)`);
    const mainBlocks = items(main).length;
    const cap = S.secret ? 7 : 5;
    if (mainBlocks > cap) errors.push(`${mainBlocks} item blocks in the main area (max ${cap})`);
    // how far into the main area a tile is, from where Brady starts (0 = the start, 1 = the far end)
    const vertical = main.tower || main.gen === 'climb' || main.gen === 'rise', shaft = main.gen === 'shaft';
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
      return a.spawns.some(s => s.type === 'gold' && (s.kind === 'risky' || s.kind === 'hidden') && Math.abs(s.x / TS - p.x) <= 5 && Math.abs(s.y / TS - p.y) <= 6);
    };
    if (!premium.length) errors.push('no premium item (L, S, sundial, 1UP or magnet) in a secret or risky spot (rule 5)');
    else if (!premium.some(tucked)) errors.push('the premium items are all in plain sight: put one in a secret or risky spot (rule 5)');
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
  swimOut(A, ai, tx, ty, mask, d, markBox, portalCheck, push, standable) {
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
      if (!wet(x, y - 1)) for (let k = -3; k <= 3; k++) for (let ys = y - 3; ys <= y + 1; ys++) if (!wet(x + k, ys - 1) && standable(A, x + k, ys)) push(ai, x + k, ys, mask, d + Math.abs(k) + Math.abs(ys - y));
      if (SOLID[tileAt(A, x, y + 1)] && !wet(x - 1, y) && standable(A, x - 1, y + 1)) push(ai, x - 1, y + 1, mask, d + 1);
      if (SOLID[tileAt(A, x, y + 1)] && !wet(x + 1, y) && standable(A, x + 1, y + 1)) push(ai, x + 1, y + 1, mask, d + 1);
      st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  },
  flood(A, ai, sx, sy, markBox, portalCheck) {
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
      q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }
};
