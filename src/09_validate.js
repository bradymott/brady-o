/* ============================================================
   Level validator — simulates Brady's real physics from every
   reachable standing spot to prove each level can be finished
   and every gold record collected.
   ============================================================ */
const Validator = {
  proxyArea(area) {
    const tiles = new Uint8Array(area.tiles);
    const W = area.W, H = area.H;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (t === T.HIDDEN || t === T.PICK || t === T.FAKE) tiles[i] = T.EMPTY;
    }
    for (const [x, y] of area.ghosts || []) if (x >= 0 && y >= 0 && x < W && y < H && tiles[y * W + x] === T.EMPTY) tiles[y * W + x] = T.SEMI;
    for (const s of area.spawns) {
      if (s.type === 'boss') { const dx = s.doorX; for (let y = 0; y < H; y++) if (tiles[y * W + dx] === T.HARD) tiles[y * W + dx] = T.EMPTY; }
    }
    const springs = new Set((area.springs || []).map(([x, y]) => x + ',' + y));
    for (const [x, y] of area.springs || []) if (tiles[y * W + x] === T.EMPTY) tiles[y * W + x] = T.SEMI;
    return { W, H, tiles, water: area.water, gravity: area.gravity || 1, springs };
  },

  run(level, opts) {
    opts = opts || {};
    const t0 = Date.now();
    const areas = level.areas.map(a => this.proxyArea(a));
    const golds = [], gates = [], portals = [];
    level.areas.forEach((a, ai) => {
      for (const s of a.spawns) {
        if (s.type === 'gold') golds.push({ ai, idx: s.idx, x: s.x - 13, y: s.y - 16 - 13, w: 26, h: 26, hit: false });
        if (s.type === 'gate') gates.push({ ai, secret: !!s.secret, x: s.x - 18, y: s.y - 120, w: 36, h: 120, hit: false });
        if (s.type === 'portal') portals.push({ ai, s, x: s.x - 14, y: s.y - 52, w: 28, h: 52, hit: false });
      }
    });
    const res = { goal: false, secretGoal: false, gold: [false, false, false], warps: [], nodes: 0, sims: 0 };
    const seen = new Set();
    const queue = [];
    const D = PLAYER_DIM.big;
    const startTx = Math.floor(level.start.x / TS), startTy = Math.floor(level.start.y / TS);
    const push = (ai, tx, ty) => { const k = ai * 1e7 + tx * 1000 + ty; if (seen.has(k)) return; seen.add(k); queue.push([ai, tx, ty]); };
    // water areas use a flood fill
    const markBox = (ai, b) => {
      for (const g of golds) if (!g.hit && g.ai === ai && overlap(b, g)) { g.hit = true; res.gold[g.idx] = true; }
      for (const g of gates) if (!g.hit && g.ai === ai && overlap(b, g)) { g.hit = true; if (g.secret) res.secretGoal = true; else res.goal = true; }
    };
    const portalCheck = (ai, b) => {
      for (const p of portals) {
        if (p.ai !== ai || !overlap(b, p)) continue;
        if (!p.hit) { p.hit = true; if (p.s.warpWorld) res.warps.push(p.s.warpWorld); }
        const tg = p.s.target;
        if (tg) push(tg.area, Math.floor(tg.x / TS), Math.floor(tg.y / TS));
      }
    };
    push(level.start.area, startTx, startTy);
    const standable = (A, tx, ty) => {
      const t = tileAt(A, tx, ty);
      if (!(SOLID[t] || t === T.SEMI) || t === T.SPIKES) return false;
      return !SOLID[tileAt(A, tx, ty - 1)] && !SOLID[tileAt(A, tx, ty - 2)];
    };
    let guard = 0;
    while (queue.length && guard++ < 20000) {
      const [ai, tx, ty] = queue.shift();
      const A = areas[ai];
      res.nodes++;
      if (opts.trace) (res.trace = res.trace || []).push([ai, tx, ty]);
      if (A.water) { this.flood(A, ai, tx, ty, markBox, portalCheck); continue; }
      const nodeBody = { x: tx * TS + TS / 2 - D.w / 2, y: ty * TS - D.h, w: D.w, h: D.h };
      markBox(ai, nodeBody); portalCheck(ai, nodeBody);
      // walk to neighbours on the same surface
      for (const dir of [-1, 1]) if (standable(A, tx + dir, ty) && !SOLID[tileAt(A, tx + dir, ty - 1)]) push(ai, tx + dir, ty);
      // simulated maneuvers
      const runwayBack = dir => { let n = 0; while (n < 8 && standable(A, tx - dir * (n + 1), ty)) n++; return n; };
      const onSpring = A.springs.has(tx + ',' + ty);
      const maneuvers = [];
      for (const dir of [-1, 1]) {
        const edge = !standable(A, tx + dir, ty);
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
      }
      maneuvers.push({ dir: 0, sp: 0, off: 0, hold: 2, jump: true });
      if (onSpring) maneuvers.push({ dir: 0, sp: 0, off: 0, hold: 2, jump: false, spring: true }, { dir: 1, sp: 0, off: 0, hold: 2, jump: false, spring: true }, { dir: -1, sp: 0, off: 0, hold: 2, jump: false, spring: true });
      for (const m of maneuvers) {
        res.sims++;
        const land = this.simulate(A, ai, tx, ty, m, D, markBox);
        if (land) { push(ai, land[0], land[1]); }
      }
      if (opts.earlyExit && res.goal && res.gold.every(Boolean) && (!level.secret || res.secretGoal || res.warps.length) && (!level.warps || res.warps.length >= level.warps.length)) break;
    }
    for (const p of portals) if (!p.hit && p.s.warpWorld) { /* unreachable warp */ }
    res.ms = Date.now() - t0;
    res.ok = res.goal;
    return res;
  },

  simulate(A, ai, tx, ty, m, D, markBox) {
    const b = { x: 0, y: ty * TS - D.h, w: D.w, h: D.h, vx: m.dir * m.sp, vy: 0, onGround: true, coyote: PHYS.coyote, jumpBuf: 0, jumping: false, runT: m.sp >= PHYS.run ? 1 : 0, airMax: Math.max(PHYS.walk, m.sp), facing: m.dir || 1, crouch: false, inWater: false, stroke: 0, groundTile: T.GROUND, dropT: 0 };
    const cx = tx * TS + TS / 2;
    b.x = m.off ? (m.dir > 0 ? tx * TS + TS - b.w / 2 - 1 : tx * TS + b.w / 2 + 1) - b.w / 2 : cx - b.w / 2;
    if (m.spring) { b.vy = -PHYS.springV; b.onGround = false; b.coyote = 0; b.jumping = true; }
    const dt = STEP;
    const inp = { left: false, right: false, jump: false, jumpPressed: false, down: false, action: false };
    let t = 0, air = false, prevLandKey = null;
    const startKey = tx + ',' + ty;
    while (t < 3.2) {
      let dir = m.dir;
      if (m.delay && t < m.delay) dir = 0;
      if (m.reverseAt && t > m.reverseAt) dir = -m.dir;
      inp.left = dir < 0; inp.right = dir > 0;
      inp.action = m.sp >= PHYS.run;
      inp.jumpPressed = m.jump && t === 0;
      if (m.mash && b.inWater) inp.jumpPressed = Math.floor(t / 0.28) !== Math.floor((t - dt) / 0.28);
      inp.jump = (m.jump || m.spring) ? t < m.hold : (m.mash ? true : false);
      playerPhysics(b, inp, A, dt, null, {});
      t += dt;
      markBox(ai, b);
      if (b.y > A.H * TS + 40) return null;
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
        return [lx, lt];
      }
      if (b.onGround && !air && t > 0.5) {
        // walked without leaving the ground: report where we ended
        return [Math.floor((b.x + b.w / 2) / TS), b.groundTy];
      }
    }
    return null;
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
