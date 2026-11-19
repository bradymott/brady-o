/* ============================================================
   World tour: the level checker learns Pupo (docs/design/PUPO.md
   §7.6, PU-4), without changing the validator's own search.
   PupoVal.run(level, opts) = the ordinary search without Pupo, then,
   from every Nap Box that search reaches, a second search riding
   Pupo: his box (28 x 58), his speeds (the same physics wrapper as
   the game: PupoRide.simRide makes the simulated bodies ride), and
   his objects as the validator's own primitives on a copy of the
   level (the way the ring piece is modelled):
   - climb strips: one ghost one-way floor per row along the strip
   - bars: a row of ghost floors 3 tiles under the bar
   - hooks: ghosts along a 2.5-tile swing, and reach edges to the
     lowest one from every standing spot within reach and in sight
   - posts: reach edges to the post's top
   - pull handles: their lock as a virtual key (or the toggle's
     switch cells) at every standing spot within reach and in sight
   - tickle gates: their lock as a virtual key within poke reach
   - keys, snatch keys and postcards: reached from within reach
   Line of sight is PupoReach.los (grilles let arms through). The
   ledge catch, the flop and hopping off midway are ignored, so the
   checker may miss a Pupo route but never claims one that isn't
   there. The merged result reports exits, postcards and areas
   reached either way; res.pupo says what Pupo was needed for.
   Nap Box contents ('pupo') are not power-ups: Validator.budget
   leaves them out (wrapped here).
   ============================================================ */
const PupoVal = {
  DIM: { w: 28, h: 58 },
  OBJ: { pupoGrab: 1, pupoClimb: 1, pupoBar: 1, pupoHandle: 1, pupoTickle: 1, pupoGrille: 1, pupoSnatch: 1, napBox: 1 },
  // the Nap Boxes of a level: { ai, tx, ty }
  boxes(level) {
    const out = [];
    level.areas.forEach((a, ai) => { for (const k in a.contents || {}) if (a.contents[k] === 'pupo') { const [x, y] = k.split(',').map(Number); out.push({ ai, tx: x, ty: y }); } });
    return out;
  },
  has(level) { return this.boxes(level).length > 0; },
  // a standing node beside a box (where Pupo sits after he unfolds): feet on the first floor at or below the box row
  spotOf(level, b) {
    const A = level.areas[b.ai];
    for (const dx of [-1, 1, 0]) {
      const x = b.tx + dx;
      for (let y = dx ? b.ty : b.ty; y < A.H; y++) {
        if (dx === 0 && y === b.ty) continue;
        const t = tileAt(A, x, y), up = tileAt(A, x, y - 1), up2 = tileAt(A, x, y - 2);
        if ((SOLID[t] || t === T.SEMI) && !SOLID[up] && !SOLID[up2]) return { area: b.ai, x: x * TS + TS / 2, y: y * TS };
        if (SOLID[t]) break;
      }
    }
    return null;
  },
  // standing nodes of an area (on the area as built) within r px of (x, y), with the riding shoulder in sight of it
  reachCells(A, grilles, x, y, r, post) {
    const out = [], R = Math.ceil(r / TS) + 2, cx = Math.floor(x / TS), cy = Math.floor(y / TS);
    for (let ty = cy - R; ty <= cy + R + 3; ty++) for (let tx = cx - R; tx <= cx + R; tx++) {
      const t = tileAt(A, tx, ty); if (!(SOLID[t] || t === T.SEMI) || t === T.SPIKES) continue;
      if (SOLID[tileAt(A, tx, ty - 1)] || SOLID[tileAt(A, tx, ty - 2)]) continue;
      const sx = tx * TS + TS / 2, sy = ty * TS - 44, dx = x - sx, dy = y - sy;
      if (dx * dx + dy * dy > r * r) continue;
      if (post && (dy < -TS || dy > 2 * TS)) continue;
      if (!PupoReach.los(A, sx, sy, x, y, grilles)) continue;
      out.push([tx, ty]);
    }
    return out;
  },
  // the level as the riding search sees it (copied areas; the level itself is never changed)
  derive(level) {
    const K = PupoReach.K;
    const areas = level.areas.map((a, ai) => {
      const c = Object.assign({}, a, { ghosts: (a.ghosts || []).slice(), edges: (a.edges || []).slice(), vkeys: (a.vkeys || []).slice(), spawns: a.spawns.slice(), toggles: Object.assign({}, a.toggles || {}) });
      const gr = []; for (const s of a.spawns) if (s.type === 'pupoGrille') { const tx = Math.floor(s.x / TS), ty1 = Math.floor(s.y / TS) - 1; gr.push({ x0: tx, y0: ty1 - (s.h || 1) + 1, x1: tx + (s.w || 1) - 1, y1: ty1 }); }
      const ghost = (x, y) => { if (x >= 0 && y >= 0 && x < a.W && y < a.H && a.tiles[y * a.W + x] === T.EMPTY) c.ghosts.push([x, y]); };
      const vkey = (id, cells) => { if (cells.length) c.vkeys.push({ id, tiles: cells.map(q => [q[0], q[1] - 1]), mode: 'any' }); };
      for (const s of a.spawns) {
        if (s.type === 'pupoClimb') { const tx = Math.floor(s.x / TS), bot = Math.floor(s.y / TS) - 1, h = s.h || 4; for (let r = bot - h + 1; r <= bot; r++) ghost(tx, r); }
        else if (s.type === 'pupoBar') { const tx = Math.floor(s.x / TS), by = Math.floor(s.y / TS) - 1; for (let x = tx; x < tx + (s.w || 3); x++) ghost(x, by + 3); }
        else if (s.type === 'pupoGrab' && s.kind !== 'post') {
          const px = s.x, py = s.y - TS / 2;
          let low = null;
          for (const ang of [-0.9, -0.45, 0, 0.45, 0.9]) { const gx = Math.floor((px + Math.sin(ang) * K.HOOK_LEN) / TS), gy = Math.round((py + Math.cos(ang) * K.HOOK_LEN + 29) / TS); ghost(gx, gy); if (ang === 0) low = [gx, gy]; }
          for (const q of this.reachCells(a, gr, px, py, K.REACH)) if (q[0] !== low[0] || q[1] !== low[1]) c.edges.push({ from: [q[0], q[1] - 1], to: low, area: ai });
        } else if (s.type === 'pupoGrab') {
          const to = [Math.floor(s.x / TS), Math.floor(s.y / TS)];
          for (const q of this.reachCells(a, gr, s.x, s.y - 8, K.REACH, true)) c.edges.push({ from: [q[0], q[1] - 1], to, area: ai });
        } else if (s.type === 'pupoHandle') {
          const cells = this.reachCells(a, gr, s.x, s.y - TS / 2 + 6, K.REACH);
          if (s.lock) vkey(s.lock, cells);
          if (s.g != null && c.toggles[s.g]) c.toggles[s.g] = Object.assign({}, c.toggles[s.g], { switches: (c.toggles[s.g].switches || []).concat(cells.map(q => [q[0], q[1] - 1])) });
        } else if (s.type === 'pupoTickle') {
          const b = s.belly || [0, -1];
          vkey(s.lock, this.reachCells(a, gr, s.x + b[0] * TS, s.y - TS / 2 + b[1] * TS, K.POKE));
        } else if (s.type === 'key') vkey(s.id, this.reachCells(a, gr, s.x, s.y - 15, K.REACH));
        else if (s.type === 'pupoSnatch') { const seen = {}, cells = []; for (const p of s.path || [[0, 0]]) for (const q of this.reachCells(a, gr, s.x + p[0] * TS, s.y - TS / 2 + p[1] * TS, K.REACH)) if (!seen[q]) { seen[q] = 1; cells.push(q); } vkey(s.key, cells); }
        else if (s.type === 'gold') for (const q of this.reachCells(a, gr, s.x, s.y - 30, K.REACH)) c.spawns.push({ type: 'gold', idx: s.idx, x: q[0] * TS + TS / 2, y: q[1] * TS - 4, fetch: true });
      }
      return c;
    });
    return Object.assign({}, level, { areas });
  },
  // the ordinary search, then a riding search from every Nap Box it reached (opts.noPupo: Nap Boxes ignored)
  run(level, opts) {
    opts = opts || {};
    const boxes = this.boxes(level);
    if (opts.noPupo || !boxes.length) { const r = Validator.run(level, opts); r.pupo = { boxes: boxes.length, reached: 0, needed: false }; return r; }
    const probes = boxes.map(b => ({ ai: b.ai, x: (b.tx - 1) * TS, y: (b.ty - 1) * TS, w: 3 * TS, h: 3 * TS, hit: false }));
    const o0 = Object.assign({}, opts, { probes: (opts.probes || []).concat(probes), earlyExit: false });
    const r = Validator.run(level, o0);
    const without = { main: !!r.exits.main, gold: r.gold.slice(), exits: Object.assign({}, r.exits) };
    let reached = 0;
    const D = this.derive(level);
    for (let i = 0; i < boxes.length; i++) {
      if (!probes[i].hit) continue;
      const st = this.spotOf(level, boxes[i]); if (!st) continue;
      reached++;
      PupoRide.simRide = true;
      let rp;
      try { rp = Validator.run(D, Object.assign({}, opts, { dim: this.DIM, start: st, earlyExit: false, probes: null })); }
      finally { PupoRide.simRide = false; }
      for (const k in rp.exits) if (rp.exits[k]) r.exits[k] = true;
      rp.gold.forEach((g, k) => { if (g) r.gold[k] = true; });
      rp.areasReached.forEach((ok, k) => { if (ok) r.areasReached[k] = true; });
      for (const k in rp.buttons || {}) if (rp.buttons[k]) r.buttons[k] = true;
      r.nodes += rp.nodes; r.sims += rp.sims;
      if (rp.guardHit) r.guardHit = true;
    }
    r.goal = !!r.exits.main;
    if (level.v2) r.ok = r.exitKeys.every(k => r.exits[k]) && r.gold.every(Boolean) && r.areasReached.every(Boolean) && r.pace.ok && r.buttonRules.every(n => r.buttons[n]);
    else r.ok = r.goal;
    r.pupo = { boxes: boxes.length, reached, without, needed: r.goal && !without.main, goldNeeded: r.gold.map((g, k) => g && !without.gold[k]) };
    return r;
  },
  /* the checks for tools/validate_levels.js: returns { errors: [], warnings: [] } for a built level and its merged result */
  checks(level, r) {
    const errors = [], warnings = [], spec = level.design || {}, kind = spec.pupo || null, P = r.pupo || {};
    // Pupo objects only where Pupo may go
    level.areas.forEach((a, ai) => { if (!PupoRide.allowed(level, ai)) for (const s of a.spawns) if (this.OBJ[s.type] && s.type !== 'pupoGrille') errors.push(`PUPO OBJECT ${s.type} IN A NOPUPO AREA ${a.aid || ai}`); });
    if (!P.boxes) { if (kind) errors.push(`PUPO ${kind.toUpperCase()} WITHOUT A NAP BOX`); return { errors, warnings }; }
    if (kind !== 'level') {
      // helper and ordinary levels: everything without Pupo (the bonus only may need him)
      if (P.without && !P.without.main) errors.push('HELPER NEEDS PUPO main exit');
      if (P.goldNeeded && P.goldNeeded.some(Boolean)) errors.push('HELPER NEEDS PUPO postcard ' + P.goldNeeded.map((g, k) => g ? k + 1 : '').filter(Boolean).join(','));
    } else if (P.without && P.without.main) warnings.push(`PUPO LEVEL ${level.id}: THE EXIT DOES NOT NEED PUPO`);
    if (P.goldNeeded && P.goldNeeded.filter(Boolean).length > 1) errors.push('MORE THAN ONE POSTCARD BEHIND A PUPO OBSTACLE');
    // from every checkpoint, starting without Pupo, the main exit is still reachable (a Nap Box sits on the near side)
    if (kind === 'level' || P.needed) {
      let n = 0;
      level.areas.forEach((a, ai) => { for (const s of a.spawns) if (s.type === 'checkpoint') {
        n++; const rc = this.run(level, { start: { area: ai, x: s.x, y: s.y } });
        if (!rc.exits.main) errors.push(`CP ${n} STRANDS BRADY WITHOUT PUPO`);
      } });
    }
    return { errors, warnings };
  }
};
// Nap Boxes are not power-ups: the budget rules count item blocks without them
{
  const b0 = Validator.budget;
  Validator.budget = function (level) {
    const saved = [];
    for (const a of level.areas) for (const k in a.contents || {}) if (a.contents[k] === 'pupo') { saved.push([a, k]); delete a.contents[k]; }
    try { return b0.call(this, level); } finally { for (const [a, k] of saved) a.contents[k] = 'pupo'; }
  };
}
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoVal }); } catch (e) { /* not in a browser */ }
