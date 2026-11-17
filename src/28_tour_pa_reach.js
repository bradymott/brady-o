/* ============================================================
   World tour: Pupo's stretch arms and his level objects
   (docs/design/PUPO.md §2, PU-2).
   One button (Action) and the stick: Pupo aims where the stick points
   (8 ways), or the way he faces when it is still, and auto-targets
   the best thing in a cone, in reach and in line of sight. A cream
   paw marker always sits on what Action will do, and the Action
   button shows the verb: poke (a pointing claw), grab (an open paw),
   pull (a fist), fetch (a cupped paw).
   - poke: enemies (belly button for mammals, a nose boop for the
     rest), gift and Nap Boxes, levers, switches, tickle spots; into
     the air it is a "boop" that still opens a box it touches
   - grab: a hook (he swings: Jump lets go, Action passes to the next
     hook) or a post across a gap (he zips over and pulls up on top)
   - pull: a pull handle (a toggle group flips, or a lock opens)
   - fetch: pickups, keys, postcards, coins, a key on a moving path
   Automatic: he grips climb strips (Up / Down, Jump leaps off), hangs
   from bars (Left / Right shimmy, Down or Jump drops) and catches
   ledge lips in mid-air (an assist the validator ignores).
   The arms are drawn straight to the frame (never through Ink.around),
   with Pupo.arm's own outline. The target search runs at 15 Hz and on
   every press, keeps its best in fields and allocates nothing.
   PupoReach's geometry (shoulder, line of sight with grilles, cone,
   score, the swing release) is shared with the validator (PU-4).
   ============================================================ */
const PupoReach = {
  K: {
    REACH: 5 * TS, POKE: 4 * TS, REACH_D: 3.5 * TS, CONE: 40 * Math.PI / 180, CONE_N: 50 * Math.PI / 180, NEAR: 2 * TS,
    OUT: 30 * TS, BACK: 22 * TS, HOLD: 0.10, COOL: 0.20, COOL_D: 0.50, GRAB_T: 0.17, TUG: 0.5,
    HOOK_LEN: 2.5 * TS, HOOK_MIN: 1.5 * TS, HOOK_MAX: 5 * TS, SWING_G: 40 * TS, PUMP: 0.6, REEL: 12 * TS, REEL_STICK: 4 * TS,
    RELEASE_K: 1.15, RELEASE_UP: 3 * TS, RELEASE_MAX: 14 * TS, RELEASE_MAX_D: 10 * TS,
    ZIP: 16 * TS, PULLUP: 0.3, CLIMB_UP: 3.2 * TS, CLIMB_DOWN: 4.5 * TS, CLIMB_D: 2.2 * TS, LEAP_X: 6.5 * TS, LEAP_Y: -13 * TS,
    SHIMMY: 2.6 * TS, HANG_DROP: 38, LEDGE_AHEAD: 2 * TS, LEDGE_UP: 2 * TS, LEDGE_DOWN: 0.5 * TS, SCAN: 1 / 15
  },
  /* ---------- geometry (shared with the validator) ---------- */
  // the shoulder the arms start from: (cx + facing * 6, y + 14) of the riding box
  shoulderX(p) { return p.x + p.w / 2 + (p.facing || 1) * 6; },
  shoulderY(p) { return p.y + 14; },
  // a grille rectangle (tiles) covers tile (tx, ty)?
  inGrille(grilles, tx, ty) {
    if (!grilles) return false;
    for (let i = 0; i < grilles.length; i++) { const r = grilles[i]; if (tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1) return true; }
    return false;
  },
  // line of sight: a tile walk from (x0, y0) to (x1, y1); solid tiles block it, except inside a grille (arms pass through)
  los(A, x0, y0, x1, y1, grilles) {
    let tx = Math.floor(x0 / TS), ty = Math.floor(y0 / TS); const ex = Math.floor(x1 / TS), ey = Math.floor(y1 / TS);
    const dx = x1 - x0, dy = y1 - y0, sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
    const tdx = dx !== 0 ? Math.abs(TS / dx) : Infinity, tdy = dy !== 0 ? Math.abs(TS / dy) : Infinity;
    let tmx = dx !== 0 ? ((dx > 0 ? (tx + 1) * TS - x0 : x0 - tx * TS) / Math.abs(dx)) : Infinity;
    let tmy = dy !== 0 ? ((dy > 0 ? (ty + 1) * TS - y0 : y0 - ty * TS) / Math.abs(dy)) : Infinity;
    for (let n = 0; n < 64; n++) {
      if (tx === ex && ty === ey) return true;
      if (tmx < tmy) { tmx += tdx; tx += sx; } else { tmy += tdy; ty += sy; }
      if (tx === ex && ty === ey) return true;   // the target's own tile never blocks (a box, a post top)
      const t = tileAt(A, tx, ty);
      if (SOLID[t] && !this.inGrille(grilles, tx, ty)) return false;
    }
    return true;
  },
  // the aim: the stick snapped to 8 ways, or the facing (neutral) -> this.ax, this.ay, this.neutral
  aim(inp, facing) {
    const dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    if (!dx && !dy) { this.ax = facing || 1; this.ay = 0; this.neutral = true; }
    else { const l = Math.sqrt(dx * dx + dy * dy); this.ax = dx / l; this.ay = dy / l; this.neutral = false; }
  },
  // the angle between the aim and (dx, dy)
  angle(dx, dy) { const l = Math.sqrt(dx * dx + dy * dy) || 1; const c = (dx * this.ax + dy * this.ay) / l; return Math.acos(clamp(c, -1, 1)); },
  score(d, reach, ang, cone, enemy) { return d / reach + 0.5 * ang / cone - (enemy ? 0.2 : 0); },
  // the swing release (§2.3): the speed along the swing x1.15, plus 3 t/s up, capped -> this.rvx, this.rvy
  release(th, om, L, drowsy) {
    const K = this.K, v = om * L * K.RELEASE_K;
    let vx = Math.cos(th) * v, vy = -Math.sin(th) * v - K.RELEASE_UP;
    const m = Math.sqrt(vx * vx + vy * vy), cap = drowsy ? K.RELEASE_MAX_D : K.RELEASE_MAX;
    if (m > cap) { vx *= cap / m; vy *= cap / m; }
    this.rvx = vx; this.rvy = vy;
  },
  ax: 1, ay: 0, neutral: true, rvx: 0, rvy: 0,
  // the mammals of every land (only mammals have belly buttons; the rest get a nose boop); an enemy cfg's belly: true adds more
  MAMMALS: new Set(['aqSeal', 'aqOrca', 'brSloth', 'brCoati', 'brJaguar', 'ecAlpaca', 'ecSeaLion', 'ecSeaLionLand', 'frPoodle', 'frCat', 'frBoar', 'frMole', 'esBat', 'esLynx', 'esSheep',
    'mxBurro', 'mxChihuahua', 'mxBat', 'mxArmadillo', 'jpTanuki', 'mzWarthog', 'mzMonkey', 'mzPangolin', 'mzMoleRat', 'mzFruitBat', 'idMacaque', 'idCivet', 'idBat',
    'npMarmot', 'npMarmotWatch', 'npYeti', 'npYetiSleep', 'npBat', 'vnBat', 'maFennec', 'maGoat', 'maCat']),

  /* ---------- the target search (15 Hz and on every press; the best one is kept in R.tg) ---------- */
  verbOf(kind) { return kind === 'hook' || kind === 'post' ? 'grab' : kind === 'handle' ? 'pull' : kind === 'item' || kind === 'gold' || kind === 'key' || kind === 'coin' || kind === 'snatch' ? 'fetch' : 'poke'; },
  classify(e, p) {
    if (e.remove || e === p) return null;
    if (e.pupoGrabPt) return e.kind;
    if (e.pupoHandle) return e.used ? null : 'handle';
    if (e.pupoTickle) return e.awake ? null : 'tickle';
    if (e.pupoSnatch) return e.taken ? null : 'snatch';
    if (e.enemy && !e.dead && !e.boss && !e.friendT && !e.friendly) return 'enemy';
    if (e.item && !(e.emerge > 0.25) && !e.dropped) return 'item';
    if (typeof Gold !== 'undefined' && e instanceof Gold) return 'gold';
    if (typeof Key !== 'undefined' && e instanceof Key) return 'key';
    if (e.lever && !e.pulled) return 'lever';
    if ((typeof TourToggleSwitch !== 'undefined' && e instanceof TourToggleSwitch) || (typeof TourRailSwitch !== 'undefined' && e instanceof TourRailSwitch)) return e.cool > 0 ? null : 'switch';
    return null;
  },
  // the point an arm goes to on a thing
  pointOf(e, kind) {
    if (kind === 'hook' || kind === 'post') { this.px = e.hx; this.py = e.hy; return; }
    if (kind === 'tickle') { this.px = e.bx; this.py = e.by; return; }
    if (kind === 'handle') { this.px = e.hx; this.py = e.hy; return; }
    if (kind === 'enemy') { this.px = e.x + e.w / 2; this.py = e.y + e.h * 0.55; return; }
    if (kind === 'lever' || kind === 'switch') { this.px = e.x + e.w / 2; this.py = e.y + 8; return; }
    this.px = e.x + e.w / 2; this.py = e.y + e.h / 2;
  },
  px: 0, py: 0,
  reachOf(kind, drowsy) { const K = this.K; return Math.min(kind === 'enemy' || kind === 'tickle' ? K.POKE : K.REACH, drowsy ? K.REACH_D : 1e9); },
  scan(p, g, R, inp) {
    const K = this.K, A = g.area, tg = R.tg, drowsy = R.drowsyT > 0;
    this.aim(inp, p.facing);
    const cone = this.neutral ? K.CONE_N : K.CONE, sx = this.shoulderX(p), sy = this.shoulderY(p), grilles = A.pupoGrilles;
    tg.kind = null; tg.e = null; tg.tx = -1; tg.ty = -1;
    let best = 1e9, urgentD = 1e9;
    const ents = g.entities;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i], kind = this.classify(e, p); if (!kind) continue;
      this.pointOf(e, kind);
      const dx = this.px - sx, dy = this.py - sy, d = Math.sqrt(dx * dx + dy * dy), reach = this.reachOf(kind, drowsy);
      if (d > reach) continue;
      // a post is used when it is level with the shoulder or below it (1 tile above to 2 below)
      if (kind === 'post' && (dy < -TS || dy > 2 * TS)) continue;
      const enemy = kind === 'enemy';
      // safety first: a hostile enemy within 2 tiles (body to body) wins, whatever the aim
      if (enemy && Math.hypot(e.x + e.w / 2 - p.cx, e.y + e.h / 2 - p.cy) < K.NEAR) { if (d < urgentD && this.los(A, sx, sy, this.px, this.py, grilles)) { urgentD = d; best = -1; this.keep(tg, kind, e, this.px, this.py); } continue; }
      if (urgentD < 1e9) continue;
      const ang = this.angle(dx, dy); if (ang > cone) continue;
      const s = this.score(d, reach, ang, cone, enemy);
      if (s >= best || !this.los(A, sx, sy, this.px, this.py, grilles)) continue;
      best = s; this.keep(tg, kind, e, this.px, this.py);
    }
    if (urgentD < 1e9) return tg;
    // tiles: gift boxes and Nap Boxes (poke), coins (fetch; they only win when nothing else is there)
    const r = Math.ceil(K.REACH / TS), cx = Math.floor(sx / TS), cy = Math.floor(sy / TS);
    for (let ty = cy - r; ty <= cy + r; ty++) for (let tx = cx - r; tx <= cx + r; tx++) {
      const t = tileAt(A, tx, ty), box = t === T.QBLOCK || t === T.QBRICK, coin = t === T.PICK;
      if (!box && !coin) continue;
      const qx = tx * TS + TS / 2, qy = ty * TS + TS / 2, dx = qx - sx, dy = qy - sy, d = Math.sqrt(dx * dx + dy * dy), reach = drowsy ? K.REACH_D : K.REACH;
      if (d > reach) continue;
      const ang = this.angle(dx, dy); if (ang > cone) continue;
      const s = this.score(d, reach, ang, cone, false) + (coin ? 0.4 : 0);
      if (s >= best || !this.los(A, sx, sy, qx, qy, grilles)) continue;
      best = s; this.keep(tg, coin ? 'coin' : 'box', null, qx, qy); tg.tx = tx; tg.ty = ty;
    }
    return tg;
  },
  keep(tg, kind, e, x, y) { tg.kind = kind; tg.e = e; tg.x = x; tg.y = y; tg.tx = -1; tg.ty = -1; },

  /* ---------- the arm ---------- */
  arm(R) {
    if (!R.arm) R.arm = { phase: 0, kind: null, e: null, tx: -1, ty: -1, x: 0, y: 0, len: 0, dist: 0, ux: 1, uy: 0, hold: 0, cool: 0, carry: null, carryKind: null, coin: false, t: 0, boop: 0, bx: 0, by: 0, belly: false };
    if (!R.tg) R.tg = { kind: null, e: null, x: 0, y: 0, tx: -1, ty: -1 };
    return R.arm;
  },
  // Action: fire at the target the marker shows (searched again now), or a boop into the air
  fire(p, g, R, inp) {
    const K = this.K, a = this.arm(R);
    if (a.phase !== 0 || a.cool > 0) return false;
    const tg = this.scan(p, g, R, inp), sx = this.shoulderX(p), sy = this.shoulderY(p);
    a.kind = tg.kind; a.e = tg.e; a.tx = tg.tx; a.ty = tg.ty; a.carry = null; a.coin = false; a.t = 0;
    if (tg.kind) { a.x = tg.x; a.y = tg.y; }
    else { a.kind = 'air'; a.x = sx + this.ax * K.POKE * (R.drowsyT > 0 ? 0.875 : 1); a.y = sy + this.ay * K.POKE * (R.drowsyT > 0 ? 0.875 : 1); }
    const dx = a.x - sx, dy = a.y - sy; a.dist = Math.sqrt(dx * dx + dy * dy) || 1; a.ux = dx / a.dist; a.uy = dy / a.dist;
    if (a.ux > 0.2) p.facing = 1; else if (a.ux < -0.2) p.facing = -1;
    a.phase = 1; a.len = 0; a.hold = 0;
    PupoRide.sfx('pupoStretch', 'fly', { pitch: 1.6, vol: 0.35 });
    return true;
  },
  // follow a moving target while the arm is out
  track(a) {
    const e = a.e; if (!e || e.remove || (e.dead && a.kind === 'enemy')) return;
    if (a.kind === 'enemy' || a.kind === 'item' || a.kind === 'gold' || a.kind === 'key' || a.kind === 'snatch' || a.kind === 'hook') { this.pointOf(e, a.kind); a.x = this.px; a.y = this.py; }
  },
  // the arm's tip in the world: from the shoulder along the arm
  tip(p, a) { const sx = this.shoulderX(p), sy = this.shoulderY(p); const dx = a.x - sx, dy = a.y - sy, d = Math.sqrt(dx * dx + dy * dy) || 1; a.dist = d; a.ux = dx / d; a.uy = dy / d; const L = Math.min(a.len, d); this.px = sx + a.ux * L; this.py = sy + a.uy * L; },
  stepArm(p, dt, g, R) {
    const K = this.K, a = this.arm(R);
    if (a.cool > 0) a.cool -= dt;
    if (a.boop > 0) a.boop -= dt;
    if (a.phase === 0) return;
    a.t += dt;
    if (a.phase === 1) {
      this.track(a);
      const grab = a.kind === 'hook' || a.kind === 'post' || a.kind === 'handle';
      a.len += (grab ? Math.max(K.OUT, a.dist / K.GRAB_T) : K.OUT) * dt;
      this.tip(p, a);
      if (a.len >= a.dist) { a.len = a.dist; this.contact(p, g, R, a); }
    } else if (a.phase === 2) {
      a.hold -= dt; this.track(a); this.tip(p, a);
      if (a.hold <= 0) a.phase = 3;
    } else if (a.phase === 3) {
      // back, carrying what it fetched
      a.len -= K.BACK * dt; if (a.len > a.dist) a.len = a.dist;
      const sx = this.shoulderX(p), sy = this.shoulderY(p);
      a.x = sx + a.ux * Math.max(0, a.len); a.y = sy + a.uy * Math.max(0, a.len);
      if (a.carry && !a.carry.remove) { const c = a.carry; c.x = a.x - c.w / 2; c.y = a.y - c.h / 2; if (c.hoverY != null) c.hoverY = c.y; if (c.vx) c.vx = 0; if (c.vy) c.vy = 0; if (c.hy != null) c.hy = c.y; }
      if (a.len <= 0) this.arrive(p, g, R, a);
    }
    // phase 4: attached (a hook, a post, a handle): the mode moves the body
  },
  arrive(p, g, R, a) {
    // the fetched thing arrives: collected exactly as if Brady had touched it
    const c = a.carry;
    if (c && !c.remove) {
      if (a.carryKind === 'snatch') c.give(p);
      else if (c.touchPlayer) { if (c.emerge > 0) c.emerge = 0; c.touchPlayer(p); }
    }
    if (a.coin) g.addPick(p.cx, p.y + 10);
    a.carry = null; a.coin = false; a.phase = 0; a.len = 0; a.kind = null; a.e = null; a.cool = R.drowsyT > 0 ? this.K.COOL_D : this.K.COOL;
  },
  back(a, hold) { a.phase = hold ? 2 : 3; a.hold = hold || 0; },
  contact(p, g, R, a) {
    const K = this.K, e = a.e, A = g.area;
    switch (a.kind) {
      case 'enemy': {
        if (e && !e.dead && !e.remove) {
          const type = e.s && e.s.type, belly = !!(e.cfg && e.cfg.belly) || PupoReach.MAMMALS.has(type);
          a.belly = belly; a.boop = 0.35; a.bx = a.x; a.by = a.y;
          let ok;
          if (type === 'brSloth' && e.befriend) { ok = e.befriend(); g.parts.text(e.cx, e.y - 10, '...COUSIN.', '#fff2c0'); }
          else ok = e.hit('poke', { x: p.cx, vx: a.ux > 0 ? 1 : -1, pupo: true });
          if (ok === true || (ok && ok !== 'bounce')) {
            if (type !== 'brSloth') { g.parts.text(e.cx, e.y - 8, belly ? 'BOOP!' : 'BOOP.', '#ffffff'); PupoRide.addMeter(g, PupoRide.K.METER_POKE); }
            PupoRide.sfx('pupoBoop', 'pick', { pitch: belly ? 0.6 : 0.9, vol: 0.6 });
            if (!belly && type !== 'brSloth' && Math.random() < 0.25) PupoRide.say(g, p.cx, p.y - 18, '...NO... PUPO?');
          } else { g.parts.text(e.cx, e.y - 8, 'BOOP', '#ffffff'); PupoRide.sfx('pupoBoop', 'bump', { pitch: 1.4, vol: 0.4 }); }
        }
        this.back(a, K.HOLD); break;
      }
      case 'box': BoxOpen.open(g, a.tx, a.ty, p, 'poke'); this.back(a, K.HOLD); break;
      case 'lever': if (e && e.pull) e.pull(); this.back(a, K.HOLD); break;
      case 'switch': if (e) { if (e.flip) e.flip(); else if (e.cool <= 0) { e.cool = 0.5; g.flipToggle(e.gi); } } this.back(a, K.HOLD); break;
      case 'tickle': if (e) e.tickle(p, a.x, a.y); this.back(a, K.HOLD); break;
      case 'air': {
        // a boop into the air: it still opens a box (or a used Nap Box) it touches
        const tx = Math.floor(a.x / TS), ty = Math.floor(a.y / TS), t = tileAt(A, tx, ty);
        if (t === T.QBLOCK || t === T.QBRICK) BoxOpen.open(g, tx, ty, p, 'poke');
        else if (t === T.USED && A.contents[tx + ',' + ty] === 'pupo') g.bumpBlock(tx, ty, false, p);
        g.parts.text(a.x, a.y - 6, 'BOOP', '#ffffff');
        this.back(a, K.HOLD); break;
      }
      case 'item': case 'gold': case 'key': case 'snatch':
        if (e && !e.remove) { a.carry = e; a.carryKind = a.kind; if (a.kind === 'snatch') e.taken = true; }
        this.back(a, 0.05); break;
      case 'coin': if (tileAt(A, a.tx, a.ty) === T.PICK) { g.setTile(a.tx, a.ty, T.EMPTY); a.coin = true; } this.back(a, 0.05); break;
      case 'hook': a.phase = 4; PupoRide.enter(g, p, 'swing', e); break;
      case 'post': a.phase = 4; PupoRide.enter(g, p, 'zip', e); break;
      case 'handle': a.phase = 4; PupoRide.enter(g, p, 'pull', e); break;
      default: this.back(a, 0);
    }
  },
  // the arm lets go (a mode ends): it snaps back from where it was
  letGo(p, R) { const a = this.arm(R); if (a.phase === 4 || a.phase === 1 || a.phase === 2) { a.phase = 3; a.kind = null; a.e = null; } },

  /* ---------- the modes: swing, zip, pull, climb, hang, ledge ---------- */
  place(p, cx, bottom) { p.x = cx - p.w / 2; p.y = bottom - p.h; },
  swing: {
    enter(p, g, R, e) {
      const K = PupoReach.K, s = R.sw || (R.sw = { e: null, px: 0, py: 0, th: 0, om: 0, L: 0, target: 0 });
      s.e = e; s.px = e.hx; s.py = e.hy;
      const bx = p.x + p.w / 2, by = p.y + p.h / 2, dx = bx - s.px, dy = by - s.py, L = Math.sqrt(dx * dx + dy * dy) || 1;
      s.th = Math.atan2(dx, dy); s.L = L; s.target = K.HOOK_LEN;
      // his speed at the grab carries into the swing
      s.om = (p.vx * Math.cos(s.th) - p.vy * Math.sin(s.th)) / L;
      p.onGround = false; p.vx = 0; p.vy = 0;
      PupoRide.sfx('pupoGrab', 'pick', { pitch: 0.7, vol: 0.5 }); PupoRide.tip(g, 'pupoGrab', 'JUMP TO LET GO  ·  ◉ AT THE NEXT HOOK');
    },
    update(p, dt, inp, g, R) {
      const K = PupoReach.K, s = R.sw, A = g.area, e = s.e;
      if (!e || e.remove) { PupoRide.leave(g, p); return; }
      s.px = e.hx; s.py = e.hy;
      // reel to 2.5 tiles, Up reels in to 1.5, Down lets out to 5
      if (inp.up) s.target = Math.max(K.HOOK_MIN, s.target - K.REEL_STICK * dt); else if (inp.down) s.target = Math.min(K.HOOK_MAX, s.target + K.REEL_STICK * dt);
      const L0 = s.L; s.L = approach(s.L, s.target, K.REEL * dt);
      if (s.L !== L0) s.om *= L0 / s.L;
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      s.om += (-(K.SWING_G / s.L) * Math.sin(s.th) + dir * K.PUMP) * dt;
      s.om *= Math.pow(0.985, dt * 60);
      const th1 = s.th + s.om * dt, cx = s.px + Math.sin(th1) * s.L, cy = s.py + Math.cos(th1) * s.L;
      if (regionFree(A, cx - p.w / 2, cy - p.h / 2, p.w, p.h)) { s.th = th1; p.x = cx - p.w / 2; p.y = cy - p.h / 2; }
      else { s.om *= -0.3; }
      if (dir) p.facing = dir; else if (Math.abs(s.om) > 0.4) p.facing = s.om > 0 ? 1 : -1;
      p.vx = Math.cos(s.th) * s.om * s.L; p.vy = -Math.sin(s.th) * s.om * s.L;
      // Action at another hook: hand over hand, keeping the swing
      if (inp.actionPressed) {
        const tg = PupoReach.scan(p, g, R, inp);
        if (tg.kind === 'hook' && tg.e !== e) {
          const ne = tg.e, bx = p.x + p.w / 2, by = p.y + p.h / 2, vx = p.vx, vy = p.vy, dx = bx - ne.hx, dy = by - ne.hy, L = Math.sqrt(dx * dx + dy * dy) || 1;
          s.e = ne; s.px = ne.hx; s.py = ne.hy; s.th = Math.atan2(dx, dy); s.L = L; s.om = (vx * Math.cos(s.th) - vy * Math.sin(s.th)) / L;
          const a = PupoReach.arm(R); a.e = ne; a.x = ne.hx; a.y = ne.hy; a.len = L; a.kind = 'hook';
          PupoRide.sfx('pupoGrab', 'pick', { pitch: 0.8, vol: 0.5 });
        }
      }
      // Jump lets go: the speed along the swing x1.15, plus 3 t/s up (capped)
      if (inp.jumpPressed) {
        PupoReach.release(s.th, s.om, s.L, R.drowsyT > 0);
        PupoRide.leave(g, p);
        p.vx = PupoReach.rvx; p.vy = PupoReach.rvy; p.airMax = Math.abs(p.vx); p.jumping = false; p.onGround = false; p.coyote = 0;
        Sound.play('jump', { pitch: 0.9 });
      }
      const a = PupoReach.arm(R); if (a.phase === 4) { a.x = s.px; a.y = s.py; a.len = Math.hypot(a.x - PupoReach.shoulderX(p), a.y - PupoReach.shoulderY(p)); }
    },
    pose(p, R, o) { const s = R.sw; o.pose = 'ride'; o.x = p.cx - p.facing * 6; o.y = p.y + p.h; o.rot = -s.th * 0.6; o.rotX = PupoReach.shoulderX(p); o.rotY = PupoReach.shoulderY(p); o.armsOff = true; o.still = true; return o; }
  },
  zip: {
    enter(p, g, R, e) {
      const z = R.zp || (R.zp = { e: null, x: 0, y: 0, t: 0, up: 0, fx: 0, fy: 0 });
      z.e = e; z.x = e.hx; z.y = e.standY; z.t = 0; z.up = 0; p.vx = 0; p.vy = 0; p.onGround = false;
      PupoRide.sfx('pupoZip', 'zip', { pitch: 1.2, vol: 0.5 });
    },
    update(p, dt, inp, g, R) {
      const K = PupoReach.K, z = R.zp, A = g.area;
      if (z.up > 0) {
        // the pull-up onto the top (0.3 s)
        z.up += dt; const k = Math.min(1, z.up / K.PULLUP);
        PupoReach.place(p, lerp(z.fx, z.x, k), lerp(z.fy, z.y, k));
        if (k >= 1) { PupoRide.leave(g, p); p.onGround = true; p.vy = 0; p.vx = 0; }
        return;
      }
      // along the arm at 16 t/s toward the post
      const cx = p.x + p.w / 2, by = p.y + p.h, dx = z.x - cx, dy = (z.y - 2) - by, d = Math.sqrt(dx * dx + dy * dy);
      if (d < K.ZIP * dt + 8) { z.up = 1e-6; z.fx = cx; z.fy = by; return; }
      const nx = cx + dx / d * K.ZIP * dt, ny = by + dy / d * K.ZIP * dt;
      if (!regionFree(A, nx - p.w / 2, ny - p.h, p.w, p.h) && !regionFree(A, nx - p.w / 2, ny - p.h - 8, p.w, p.h)) { PupoRide.leave(g, p); p.vy = 0; return; }
      PupoReach.place(p, nx, regionFree(A, nx - p.w / 2, ny - p.h, p.w, p.h) ? ny : ny - 8);
      p.facing = dx > 0 ? 1 : -1; p.vx = dx / d * K.ZIP; p.vy = dy / d * K.ZIP;
      const a = PupoReach.arm(R); a.x = z.x; a.y = z.e.hy; a.len = Math.hypot(a.x - PupoReach.shoulderX(p), a.y - PupoReach.shoulderY(p));
    },
    pose(p, R, o) { o.pose = 'ride'; o.x = p.cx - p.facing * 6; o.y = p.y + p.h; o.rot = p.facing * -0.18; o.rotX = p.cx; o.rotY = p.y + p.h; o.armsOff = true; o.still = true; return o; }
  },
  pull: {
    enter(p, g, R, e) { const u = R.pl || (R.pl = { e: null, t: 0 }); u.e = e; u.t = 0; p.vx = 0; },
    update(p, dt, inp, g, R) {
      const K = PupoReach.K, u = R.pl;
      u.t += dt;
      // he leans back and tugs for 0.5 s; then the handle's effect plays and the arm snaps back
      if (!p.onGround) { p.vy = Math.min(p.vy + PHYS.gDown * dt, PHYS.maxFall); moveBody(p, g.area, dt, { semis: true, platforms: g.platforms }); }
      if (u.t >= K.TUG) { if (u.e) u.e.pull(g, p); PupoRide.leave(g, p); }
    },
    pose(p, R, o) { const k = Math.min(1, R.pl.t / 0.2); o.pose = 'ride'; o.x = p.cx - p.facing * 6; o.y = p.y + p.h; o.rot = -p.facing * 0.16 * k; o.rotX = p.cx - p.facing * 14; o.rotY = p.y + p.h; o.armsOff = true; o.still = true; return o; }
  },
  climb: {
    enter(p, g, R, e) {
      const c = R.cl || (R.cl = { e: null, up: 0, fx: 0, fy: 0, tx: 0, ty: 0, ph: 0 });
      c.e = e; c.up = 0; c.ph = 0; p.vx = 0; p.vy = 0; p.onGround = false; p.facing = e.side || p.facing;
      PupoReach.place(p, e.cx, p.y + p.h);
      PupoRide.sfx('pupoGrip', 'pick', { pitch: 0.5, vol: 0.4 }); PupoRide.tip(g, 'pupoClimb', 'HOLD UP TO CLIMB  ·  JUMP TO LEAP OFF');
    },
    update(p, dt, inp, g, R) {
      const K = PupoReach.K, c = R.cl, e = c.e, A = g.area, drowsy = R.drowsyT > 0;
      if (!e || e.remove) { PupoRide.leave(g, p); return; }
      if (c.up > 0) {
        c.up += dt; const k = Math.min(1, c.up / K.PULLUP);
        PupoReach.place(p, lerp(c.fx, c.tx, k), lerp(c.fy, c.ty, k) - Math.sin(k * Math.PI) * 10);
        if (k >= 1) { PupoRide.leave(g, p); p.onGround = true; p.vy = 0; e.cool = 0.4; }
        return;
      }
      // the climb pauses for a poke
      const a = PupoReach.arm(R), busy = a.phase !== 0;
      let vy = 0;
      if (!busy) { if (inp.up) vy = -(drowsy ? K.CLIMB_D : K.CLIMB_UP); else if (inp.down) vy = K.CLIMB_DOWN; }
      if (vy) c.ph += dt * Math.abs(vy) / TS * 0.55;
      const bottom = p.y + p.h, top = e.top;
      let ny = bottom + vy * dt;
      // at the top: pull up onto a standable tile beside the strip (0.3 s)
      if (ny - p.h * 0.0 <= top + 2 && vy < 0) {
        for (let s = -1; s <= 1; s += 2) {
          const side = s === -1 ? (e.side || 1) : -(e.side || 1), tx = e.tx + side, ty = Math.floor(top / TS);
          if (SOLID[tileAt(A, tx, ty)] && regionFree(A, tx * TS + TS / 2 - p.w / 2, top - p.h, p.w, p.h)) { c.up = 1e-6; c.fx = p.cx; c.fy = bottom; c.tx = tx * TS + TS / 2; c.ty = top; p.facing = side; return; }
        }
        ny = top + 2;
      }
      // at the bottom: standing again
      if (vy > 0 && !regionFree(A, p.x, ny - p.h, p.w, p.h)) { PupoRide.leave(g, p); p.vy = 0; return; }
      if (ny > e.bottom + 2) { PupoRide.leave(g, p); return; }
      if (regionFree(A, p.x, ny - p.h, p.w, p.h)) p.y = ny - p.h;
      p.vx = 0; p.vy = vy;
      // Jump leaps off, away from the strip
      if (inp.jumpPressed && !busy) { const away = -(e.side || p.facing); PupoRide.leave(g, p); e.cool = 0.35; p.vx = away * K.LEAP_X; p.vy = K.LEAP_Y; p.airMax = K.LEAP_X; p.facing = away; p.jumping = false; Sound.play('jump', { pitch: 0.9 }); }
    },
    pose(p, R, o) { const c = R.cl; o.pose = 'climb'; o.x = p.cx; o.y = p.y + p.h; o.phase = c.ph; o.armsOff = PupoReach.arm(R).phase !== 0; return o; }
  },
  hang: {
    enter(p, g, R, e) {
      const h = R.hg || (R.hg = { e: null });
      h.e = e; p.vx = 0; p.vy = 0; p.onGround = false;
      p.y = e.y + PupoReach.K.HANG_DROP;
      PupoRide.sfx('pupoGrip', 'pick', { pitch: 0.6, vol: 0.4 });
    },
    update(p, dt, inp, g, R) {
      const K = PupoReach.K, h = R.hg, e = h.e, A = g.area;
      if (!e || e.remove) { PupoRide.leave(g, p); return; }
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (dir) p.facing = dir;
      let nx = p.cx + dir * K.SHIMMY * dt; nx = clamp(nx, e.x0, e.x1);
      if (regionFree(A, nx - p.w / 2, p.y, p.w, p.h)) p.x = nx - p.w / 2;
      p.y = e.y + K.HANG_DROP; p.vx = dir * K.SHIMMY; p.vy = 0; h.ph = (h.ph || 0) + Math.abs(dir) * dt;
      if (inp.jumpPressed || (inp.down && !inp.left && !inp.right)) { PupoRide.leave(g, p); e.cool = 0.4; p.vy = 0; }
    },
    pose(p, R, o) { const e = R.hg.e; o.pose = 'hang'; o.x = p.cx - p.facing * 4; o.y = e.y; o.still = true; o.boxX = p.cx - 56; o.boxY = e.y - 12; o.boxW = 112; o.boxH = p.y + p.h - e.y + 30; return o; }
  },
  ledge: {
    enter(p, g, R) { },
    update(p, dt, inp, g, R) {
      const K = PupoReach.K, l = R.lg; l.t += dt; const k = Math.min(1, l.t / K.PULLUP);
      PupoReach.place(p, lerp(l.fx, l.tx, k), lerp(l.fy, l.ty, k) - Math.sin(k * Math.PI) * 6);
      if (k >= 1) { PupoRide.leave(g, p); p.onGround = true; p.vy = 0; p.vx = 0; }
    },
    pose(p, R, o) { o.pose = 'ride'; o.x = p.cx - p.facing * 6; o.y = p.y + p.h; o.rot = -p.facing * 0.25 * (1 - Math.min(1, R.lg.t / 0.3)); o.rotX = p.cx; o.rotY = p.y + p.h; o.still = true; return o; }
  },

  /* ---------- after Brady's step while riding: the arm, the marker search, the automatic grips ---------- */
  after(p, dt, inp, g, R, inMode) {
    const a = this.arm(R);
    if (R.showT > 0) return;
    // Action: stretch (not while swinging, zipping, pulling or pulling up)
    const busy = R.mode === 'swing' || R.mode === 'zip' || R.mode === 'pull' || R.mode === 'ledge' || (R.mode === 'climb' && R.cl && R.cl.up > 0);
    if (inp.actionPressed && !busy) this.fire(p, g, R, inp);
    this.stepArm(p, dt, g, R);
    // the marker's search, 15 times a second
    if ((R.scanT = (R.scanT || 0) - dt) <= 0) { R.scanT = this.K.SCAN; this.scan(p, g, R, inp); }
    if (inMode) return;
    this.autoGrip(p, inp, g, R);
  },
  autoGrip(p, inp, g, R) {
    const K = this.K, A = g.area, objs = A.pupoObjs;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (objs) for (let i = 0; i < objs.length; i++) {
      const e = objs[i]; if (e.remove || e.cool > 0) continue;
      // climb strips: grip on touch while moving toward one, or in mid-air
      if (e.pupoClimb) {
        if (Math.abs(p.cx - e.cx) > 12 || p.y + p.h < e.top + 4 || p.y > e.bottom) continue;
        if (!p.onGround || (dir && dir === (e.side || dir)) || inp.up) { PupoRide.enter(g, p, 'climb', e); return; }
      }
      // bars: grip when his head touches one on the way up
      if (e.pupoBar) {
        if (p.vy < 0 && p.cx >= e.x0 && p.cx <= e.x1 && p.y <= e.y + 8 && p.y >= e.y - 14) { PupoRide.enter(g, p, 'hang', e); return; }
      }
    }
    // the ledge catch (an assist): falling or near the top of a jump, stick toward the ledge
    if (!p.onGround && !p.inWater && dir && p.vy > -2 * TS) {
      const lead = dir > 0 ? p.x + p.w : p.x, head = p.y;
      const t0 = Math.floor((head - K.LEDGE_UP) / TS), t1 = Math.floor((head + K.LEDGE_DOWN) / TS);
      for (let k = 0; k <= 2; k++) {
        const tx = Math.floor((lead + dir * (k * TS + 1)) / TS);
        if (Math.abs(tx * TS + TS / 2 - lead) > K.LEDGE_AHEAD + TS / 2) continue;
        for (let ty = t1; ty >= t0; ty--) {
          const t = tileAt(A, tx, ty), above = tileAt(A, tx, ty - 1);
          if (!(SOLID[t] || t === T.SEMI) || SOLID[above]) continue;
          const lipY = ty * TS, cx = dir > 0 ? tx * TS + p.w / 2 + 2 : (tx + 1) * TS - p.w / 2 - 2;
          if (lipY > p.y + p.h - 6) continue;   // a floor he will just land on
          if (!regionFree(A, cx - p.w / 2, lipY - p.h, p.w, p.h)) continue;
          // nothing solid in between: a clear line to the air just off the lip's corner
          if (!this.los(A, this.shoulderX(p), this.shoulderY(p), dir > 0 ? tx * TS - 2 : (tx + 1) * TS + 2, lipY - 2, null)) continue;
          const l = R.lg || (R.lg = { t: 0, fx: 0, fy: 0, tx: 0, ty: 0 });
          l.t = 0; l.fx = p.cx; l.fy = p.y + p.h; l.tx = cx; l.ty = lipY;
          PupoRide.enter(g, p, 'ledge', null); return;
        }
      }
    }
  },
  // a nap in mid-air: he dangles asleep from the nearest hook or bar within 5 tiles
  napSpot(g, p) {
    const objs = g.area.pupoObjs; if (!objs) return null;
    let best = null, bd = 5 * TS, bx = 0, by = 0;
    for (const e of objs) {
      let x, y;
      if (e.pupoGrabPt && e.kind === 'hook') { x = e.hx; y = e.hy; }
      else if (e.pupoBar) { x = clamp(p.cx, e.x0, e.x1); y = e.y; }
      else continue;
      const d = Math.hypot(x - p.cx, y - p.y); if (d < bd) { bd = d; best = e; bx = x; by = y; }
    }
    return best ? { x: bx, y: by, hang: true } : null;
  }
};

/* ---------- the level objects ---------- */
// a brass ring: where a hand goes, the same in every land (so "grabbable" reads at once)
function pupoRing(ctx, x, y, r) {
  ctx.lineWidth = 4.6; ctx.strokeStyle = '#1c1426'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2.6; ctx.strokeStyle = '#e8b040'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = '#fff0b0'; ctx.beginPath(); ctx.arc(x, y, r, -2.6, -1.4); ctx.stroke();
}
// an outlined stroke: ink 3 px wider, then the colour
function pupoLine(ctx, x0, y0, x1, y1, w, col) {
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  ctx.strokeStyle = '#1c1426'; ctx.lineWidth = w + 3; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
}
/* a grab point: a hook (overhead: swing) or a post (on top of a solid: zip over and stand); { kind, look, orbit: { r, period, phase } } */
class PupoGrab extends Ent {
  constructor(g, s) {
    super(g, s, 20, 20); this.kind = s.kind === 'post' ? 'post' : 'hook'; this.look = s.look; this.pupoGrabPt = true; this.back = true; this.friendly = true;
    this.ax = s.x; this.ay = s.y - TS / 2; this.orbit = s.orbit || null; this.hx = this.ax; this.hy = this.ay;
    if (this.kind === 'post') { this.hy = s.y - 8; this.standY = s.y; }
    this.place();
  }
  place() {
    if (this.orbit) { const o = this.orbit, a = (o.phase || 0) + this.g.t * TAU / (o.period || 6); this.hx = this.ax + Math.cos(a) * (o.r || 2) * TS; this.hy = this.ay + Math.sin(a) * (o.r || 2) * TS; }
    this.x = this.hx - 10; this.y = this.hy - 10;
  }
  update(dt) { this.t += dt; if (this.orbit) this.place(); }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.look)) return;
    if (this.kind === 'post') {
      // a stubby mooring post on the ledge, a brass ring on top
      const x = this.hx, y = this.standY;
      ctx.fillStyle = '#1c1426'; rr(ctx, x - 7.5, y - 13.5, 15, 15, 3); ctx.fill();
      ctx.fillStyle = '#8a5a2e'; rr(ctx, x - 6, y - 12, 12, 12, 2); ctx.fill(); ctx.fillStyle = '#a8743e'; ctx.fillRect(x - 6, y - 12, 12, 3);
      pupoRing(ctx, x, y - 16, 5);
      return;
    }
    // a hook: a cord from above (or the orbit's hub and arm), a knot, the brass ring
    if (this.orbit) { pupoLine(ctx, this.ax, this.ay, this.hx, this.hy - 6, 3, '#6a4a2a'); ctx.fillStyle = '#1c1426'; ctx.beginPath(); ctx.arc(this.ax, this.ay, 5.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8902a'; ctx.beginPath(); ctx.arc(this.ax, this.ay, 4, 0, TAU); ctx.fill(); }
    else pupoLine(ctx, this.hx, this.hy - 30, this.hx, this.hy - 7, 2, '#e8dcc0');
    ctx.fillStyle = '#1c1426'; ctx.beginPath(); ctx.arc(this.hx, this.hy - 7, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#d84a3a'; ctx.beginPath(); ctx.arc(this.hx, this.hy - 7, 2.4, 0, TAU); ctx.fill();
    pupoRing(ctx, this.hx, this.hy, 5.5);
  }
}
/* a climb strip: a column 1 tile wide and h tall (the spawn is its bottom cell); side: where the wall is (+1 right, -1 left) */
class PupoClimb extends Ent {
  constructor(g, s) {
    const h = s.h || 4; super(g, s, TS, h * TS); this.tx = Math.floor(s.x / TS); this.x = this.tx * TS; this.bottom = s.y; this.y = s.y - h * TS; this.top = this.y;
    this.side = s.side || 0; this.look = s.look; this.pupoClimb = true; this.back = true; this.friendly = true; this.cool = 0;
  }
  get cx() { return this.x + TS / 2; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.look)) return;
    // a ribbon-wrapped rope / trunk with horizontal grip lines (slick for Brady alone)
    const x = this.cx + this.side * 6, w = 10;
    ctx.fillStyle = '#1c1426'; ctx.fillRect(x - w / 2 - 1.5, this.top - 2, w + 3, this.bottom - this.top + 2);
    ctx.fillStyle = '#7a9a3a'; ctx.fillRect(x - w / 2, this.top, w, this.bottom - this.top);
    ctx.fillStyle = '#a8c858'; ctx.fillRect(x - w / 2, this.top, 3, this.bottom - this.top);
    ctx.strokeStyle = '#f4ecd0'; ctx.lineWidth = 1.6;
    for (let y = this.top + 6; y < this.bottom - 2; y += 8) { ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y - 2); ctx.stroke(); }
  }
}
/* a bar: a horizontal run w tiles wide at the spawn cell's middle (Pupo hangs upside down under it) */
class PupoBar extends Ent {
  constructor(g, s) {
    const w = s.w || 3; super(g, s, w * TS, 10); this.x = Math.floor(s.x / TS) * TS; this.y = s.y - TS / 2 - 5;
    this.x0 = this.x + 6; this.x1 = this.x + w * TS - 6; this.look = s.look; this.pupoBar = true; this.back = true; this.friendly = true; this.cool = 0;
    this.y = s.y - TS / 2;
  }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.look)) return;
    pupoLine(ctx, this.x + 2, this.y, this.x + this.w - 2, this.y, 4, '#9a6a3a');
    ctx.strokeStyle = '#f4ecd0'; ctx.lineWidth = 1.4;
    for (let x = this.x + 8; x < this.x + this.w - 4; x += 10) { ctx.beginPath(); ctx.moveTo(x, this.y - 2); ctx.lineTo(x - 2, this.y + 2); ctx.stroke(); }
  }
}
/* a pull handle: a cord with a ring out of Brady's reach; pulling flips toggle group g or opens lock id (once: stays pulled) */
class PupoHandle extends Ent {
  constructor(g, s) {
    super(g, s, 20, 20); this.hx = s.x; this.hy = s.y - TS / 2 + 6; this.x = this.hx - 10; this.y = this.hy - 10;
    this.g0 = s.g; this.lock = s.lock; this.once = !!s.once || s.lock != null; this.look = s.look; this.pupoHandle = true; this.back = true; this.friendly = true; this.used = false; this.k = 0;
  }
  update(dt) { this.t += dt; this.k = approach(this.k, 0, dt * 3); }
  pull(g, p) {
    if (this.used) return;
    if (this.g0 != null) g.flipToggle(this.g0);
    if (this.lock) TourLock.open(g, this.lock);
    if (this.once) this.used = true;
    this.k = 1; TourKit.sfx('lever', 'select', { vol: 0.8 }); g.burst(this.hx, this.hy, 8, '#ffd84a', 'spark');
  }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.look)) return;
    const y = this.hy + this.k * 10;
    pupoLine(ctx, this.hx, this.hy - 34, this.hx, y - 6, 2, '#c8a070');
    ctx.fillStyle = '#1c1426'; rr(ctx, this.hx - 5, y - 7, 10, 7, 2); ctx.fill(); ctx.fillStyle = '#d8823a'; rr(ctx, this.hx - 3.6, y - 5.6, 7.2, 4.2, 1.5); ctx.fill();
    pupoRing(ctx, this.hx, y + 2, 4.5);
  }
}
/* a tickle gate: a big, harmless, sleeping animal on lock tiles; one belly-button spot (belly: [dx, dy] tiles from the spawn) */
class PupoTickle extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, 3 * TS); this.lockId = s.lock; this.look = s.look; this.pupoTickle = true; this.friendly = true; this.awake = false; this.k = 0; this.giggle = 0; this.no = 0;
    const b = s.belly || [0, -1]; this.bx = s.x + b[0] * TS; this.by = s.y - TS / 2 + b[1] * TS;
  }
  hideLock() { if (this.hid) return; for (const e of this.g.entities) if (e instanceof Lock && e.id === this.lockId) { e.draw = PupoTickle.noDraw; this.hid = true; } }
  update(dt) {
    this.t += dt; this.hideLock();
    if (this.giggle > 0) { this.giggle -= dt; if (this.giggle <= 0) { this.awake = true; TourLock.open(this.g, this.lockId); } }
    if (this.awake) this.k = Math.min(1, this.k + dt / 1.2);
    if (this.no > 0) this.no -= dt;
    if (this.k >= 1) this.remove = true;
    // Brady alone bounces off it
    const p = this.g.player; if (p && !p.pupoRide && !this.awake && overlap(p, this) && !(this.zT > 0)) { this.zT = 1.2; this.g.parts.text(this.cx, this.y - 6, 'ZZZ', '#e8e4ff'); }
    if (this.zT > 0) this.zT -= dt;
  }
  tickle(p, x, y) {
    if (this.awake || this.giggle > 0) return;
    if (Math.hypot(x - this.bx, y - this.by) < 14) { this.giggle = 0.6; this.g.parts.text(this.bx, this.by - 10, 'HEE HEE...', '#ffffff'); PupoRide.sfx('pupoGiggle', 'pick', { pitch: 0.5, vol: 0.6 }); }
    else if (!(this.no > 0)) { this.no = 1.2; PupoRide.say(this.g, p.cx, p.y - 18, '...NOT... THERE.'); }
  }
  draw(ctx) {
    this.hideLock();
    if (TourObj.skin(ctx, this, this.look)) return;
    const k = easeInOut(this.k), x = this.cx + k * 3 * TS, y = this.y + this.h, wob = this.giggle > 0 ? Math.sin(this.t * 40) * 2 : 0, br = Math.sin(this.t * 1.6) * 1.5;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * 2.5);
    // a big round sleeping animal (fur, a pale belly, closed eyes), the belly button marked by a tiny swirl
    ctx.fillStyle = '#1c1426'; ctx.beginPath(); ctx.ellipse(wob, -this.h / 2, this.w / 2 + 4, this.h / 2 + 2 + br, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8b8e0'; ctx.beginPath(); ctx.ellipse(wob, -this.h / 2, this.w / 2 + 2, this.h / 2 + br, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f2ecf8'; ctx.beginPath(); ctx.ellipse(wob - 4, -this.h / 2 + 8, this.w / 2 - 8, this.h / 2 - 12, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(wob - 8, -this.h + 18, 3, 0.2, Math.PI - 0.2); ctx.moveTo(wob + 6, -this.h + 18); ctx.arc(wob + 3, -this.h + 18, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
    if (!this.awake) { ctx.strokeStyle = '#8a6aa8'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(this.bx, this.by, 2.2, 0, 5); ctx.stroke(); const z = (this.t * 0.5) % 1; PupoRide.zGlyph(ctx, this.cx + 14 + z * 6, this.y + 6 - z * 18, 3 + z * 3); }
  }
}
PupoTickle.noDraw = function () {};
/* a grille: w x h solid tiles (from the spawn cell to the right and up) that arms pass through and bodies don't */
class PupoGrille extends Ent {
  constructor(g, s) {
    const w = s.w || 1, h = s.h || 1; super(g, s, w * TS, h * TS); this.tx = Math.floor(s.x / TS); this.ty1 = Math.floor(s.y / TS) - 1; this.ty0 = this.ty1 - h + 1;
    this.x = this.tx * TS; this.y = this.ty0 * TS; this.rect = { x0: this.tx, y0: this.ty0, x1: this.tx + w - 1, y1: this.ty1 }; this.pupoGrille = true; this.back = true; this.friendly = true;
  }
  draw(ctx) {
    ctx.fillStyle = '#2a2230'; ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#1c1426'; ctx.fillRect(this.x, this.y, this.w, 4); ctx.fillRect(this.x, this.y + this.h - 4, this.w, 4);
    for (let x = this.x + 5; x < this.x + this.w; x += 8) { ctx.fillStyle = '#1c1426'; ctx.fillRect(x - 2, this.y, 5, this.h); ctx.fillStyle = '#a8603a'; ctx.fillRect(x - 1, this.y, 3, this.h); }
  }
}
/* a snatch key: a key travelling along a path (tile offsets from the spawn), round and round every `period` s */
class PupoSnatch extends Ent {
  constructor(g, s) {
    super(g, s, 24, 24); this.keyId = s.key || 'snatch'; this.path = s.path || [[0, 0], [-4, 0]]; this.period = s.period || 6; this.ox = s.x; this.oy = s.y - TS / 2; this.pupoSnatch = true; this.friendly = true; this.taken = false;
    if (g.keys && g.keys.has(this.keyId)) this.remove = true;
    this.place();
  }
  place() {
    const P = this.path, n = P.length, u = ((this.g.t / this.period) % 1) * n, i = Math.floor(u), f = u - i, a = P[i % n], b = P[(i + 1) % n];
    this.x = this.ox + lerp(a[0], b[0], f) * TS - 12; this.y = this.oy + lerp(a[1], b[1], f) * TS - 12;
  }
  update(dt) { this.t += dt; if (!this.taken) this.place(); }
  give(p) { this.remove = true; this.g.keys.add(this.keyId); sfx('key', 'oneup'); this.g.burst(this.cx, this.cy, 16, '#ffd84a', 'confetti'); this.g.toast('KEY! FIND THE LOCKED DOOR'); }
  draw(ctx) { GimmickArt.key(ctx, this, this.g.t); }
}
Object.assign(ENTITY_TYPES, { pupoGrab: PupoGrab, pupoClimb: PupoClimb, pupoBar: PupoBar, pupoHandle: PupoHandle, pupoTickle: PupoTickle, pupoGrille: PupoGrille, pupoSnatch: PupoSnatch });

/* ---------- the builder pieces (st.x = the next free column, st.gy = the ground row) ---------- */
Object.assign(Tour.pieces, {
  // a gap w wide with n grab points spaced at most 4 tiles; hooks hang 4 rows over the ground, posts stand on pillars
  pupoGap(st, o) {
    const B = st.B, w = o.w || 8, n = o.hooks || Math.ceil(w / 4), x0 = st.x + 1, x1 = x0 + w - 1, kind = o.kind || 'hook';
    st.floor(st.x, st.x); for (let x = x0; x <= x1; x++) B.clearCol(x, st.gy, B.H - 1);
    if (o.under === 'water') for (let x = x0; x <= x1; x++) for (let y = st.gy + 1; y < B.H; y++) B.set(x, y, T.WATER);
    if (o.under === 'spikes') for (let x = x0; x <= x1; x++) { B.set(x, B.H - 2, T.SPIKES); B.set(x, B.H - 1, T.GROUND); }
    for (let i = 1; i <= n; i++) {
      const gx = x0 + Math.round(i * w / (n + 1)) - 1;
      if (kind === 'post') { B.set(gx, st.gy, T.HARD); for (let y = st.gy + 1; y < B.H; y++) B.set(gx, y, T.HARD); B.spawn('pupoGrab', gx, st.gy - 1, { kind: 'post', look: o.look || null }); }
      else B.spawn('pupoGrab', gx, st.gy - 5, { kind: 'hook', look: o.look || null });
    }
    st.floor(x1 + 1, x1 + 3);
    return x1 + 4;
  },
  // a wall h tall with a climb strip on its near face and a ledge on top
  pupoClimb(st, o) {
    const B = st.B, h = o.h || 6, x = st.x;
    st.floor(x, x + 5);
    B.fill(x + 2, st.gy - h, x + 4, st.gy - 1, T.HARD);
    B.spawn('pupoClimb', x + 1, st.gy - 1, { h, side: 1, look: o.look || null });
    st.gy -= h; st.floor(x + 2, x + 6); st.gy += h;
    return x + 5;
  },
  // a bar w long over a hazard (spikes by default)
  pupoBars(st, o) {
    const B = st.B, w = o.w || 6, x0 = st.x + 1;
    st.floor(st.x, st.x);
    for (let x = x0; x < x0 + w; x++) { B.clearCol(x, st.gy, B.H - 1); if (o.under !== 'pit') { B.set(x, B.H - 2, T.SPIKES); B.set(x, B.H - 1, T.GROUND); } }
    B.spawn('pupoBar', x0, st.gy - 5, { w, look: o.look || null });
    st.floor(x0 + w, x0 + w + 2);
    return x0 + w + 3;
  },
  // a handle out of Brady's reach (dx, dy tiles from the start) and the toggle group or lock it drives
  pupoPull(st, o) {
    const x = st.x; st.floor(x, x + 4);
    st.B.spawn('pupoHandle', x + (o.dx || 2), st.gy - 1 - (o.dy || 5), { g: o.g, lock: o.lock, once: !!o.once, look: o.look || null });
    return x + 5;
  },
  // the sleeping blocker on lock tiles (3 high)
  pupoTickle(st, o) {
    const x = st.x + 2; st.floor(st.x, st.x + 4);
    st.B.lock(x, st.gy - 3, st.gy - 1, o.lock || 'tickle', 'door');
    st.B.spawn('pupoTickle', x, st.gy - 1, { lock: o.lock || 'tickle', belly: o.belly || [-1, -1], look: o.look || null });
    return st.x + 5;
  },
  // a target high up (h rows), or behind a grille
  pupoFetch(st, o) {
    const B = st.B, x = st.x + 2, y = st.gy - 1 - (o.h || 6); st.floor(st.x, st.x + 4);
    if (o.grille) { B.fill(x - 1, y - 1, x + 1, y + 1, T.HARD); B.set(x, y, T.EMPTY); B.set(x - 1, y, T.HARD); B.spawn('pupoGrille', x - 1, y, { w: 1, h: 1 }); }
    if (o.key) B.spawn('key', x, y, { id: o.key }); else if (o.gold) B.gold(x, y, o.gold); else { B.set(x, y, T.QBLOCK); B.item(x, y, o.item || 'oneup'); }
    return st.x + 5;
  },
  // grille tiles: arms pass through, bodies don't (w x h from this cell to the right and up)
  pupoGrille(st, o) {
    const B = st.B, tx = st.x, ty = st.gy - 1, w = o.w || 1, h = o.h || 1;
    for (let y = ty - h + 1; y <= ty; y++) for (let x = tx; x < tx + w; x++) B.set(x, y, T.HARD);
    B.spawn('pupoGrille', tx, ty, { w, h });
    return tx + w;
  },
  pupoSnatch(st, o) { st.B.spawn('pupoSnatch', st.x, st.gy - 1 - (o.h || 6), { key: o.key, path: o.path, period: o.period }); return st.x + 1; }
});

/* ---------- wiring into the ride (28_tour_p_pupo.js) ---------- */
Object.assign(PupoRide, {
  addMeter(g, k) { const R = this.st(g); R.meter = Math.min(1, R.meter + k * (R.drowsyT > 0 ? 0.5 : 1)); },
  enter(g, p, mode, e) { const R = this.st(g); R.mode = mode; const M = this.modes[mode]; if (M && M.enter) M.enter(p, g, R, e); },
  leave(g, p) { const R = this.st(g), M = this.modes[R.mode]; R.mode = ''; if (M && M.exit) M.exit(p, g, R); PupoReach.letGo(p, R); }
});
for (const m of ['swing', 'zip', 'pull', 'climb', 'hang', 'ledge']) {
  PupoReach[m].exit = (p, g, R) => { PupoReach.letGo(p, R); };
  PupoRide.modes[m] = PupoReach[m];
}
PupoRide.afters.push((p, dt, inp, g, R, inMode) => PupoReach.after(p, dt, inp, g, R, inMode));
PupoRide.napSpots.push((g, p) => PupoReach.napSpot(g, p));
// the area's Pupo objects and grilles, cached once per area (a reused array each)
PupoRide.cacheObjs = function (g) {
  const A = g.area; if (!A) return;
  const objs = A.pupoObjs || (A.pupoObjs = []); objs.length = 0;
  let gr = null;
  for (const e of A.entities) {
    if (e.pupoClimb || e.pupoBar || e.pupoGrabPt) objs.push(e);
    if (e.pupoGrille) { gr = gr || A.pupoGrilles || (A.pupoGrilles = []); if (gr.indexOf(e.rect) < 0) gr.push(e.rect); }
  }
};
{
  const al0 = PupoRide.areaLoaded;
  PupoRide.areaLoaded = function (g) { this.cacheObjs(g); return al0.call(this, g); };
  // a mode's own draw origin and box (climbing, hanging, swinging...), and the arm drawn after the ride
  // the arm goes in front of the ride, except while swinging: then it is drawn behind Pupo and Brady (it would cross Brady's face)
  PupoRide.unders.push((ctx, p, g, R, t) => { if (R.mode === 'swing') PupoArms.draw(ctx, p, g, R, t); });
  PupoRide.overs.push((ctx, p, g, R, t) => { if (R.mode !== 'swing') PupoArms.draw(ctx, p, g, R, t); });
  // the camera: while swinging it leads in the swing's direction (0.13 of the view); while climbing Brady sits at 60 % of
  // the view's height, to show more above (TourHooks.camera, at the end of Play.updateCamera)
  TourHooks.on('camera', (play, dt) => {
    const p = play.player, R = play.pupo; if (!p || !p.pupoRide || !R || !R.mode || !play.area) return;
    const A = play.area, k = 1 - Math.exp(-dt * 5);
    if (R.mode === 'swing') {
      const lead = clamp(p.vx / (10 * TS), -1, 1) * Game.viewW * 0.13, tx = clamp(p.cx - Game.viewW * 0.42 + lead, 0, Math.max(0, A.W * TS - Game.viewW));
      play.camX += (tx - play.camX) * k;
    } else if (R.mode === 'climb') {
      const ty = clamp(p.y + p.h * 0.5 - Game.viewH * 0.6, 0, Math.max(0, A.H * TS - Game.viewH));
      play.camY += (ty - play.camY) * k;
    }
  });
  PupoRide.overs.push((ctx, p, g, R, t) => PupoArms.marker(ctx, p, g, R, t));
}

/* ---------- drawing: the stretch arm (straight to the frame, its own outline), the paw marker, the button's verb ---------- */
const PupoArms = {
  an: Pupo.newAnchors(),
  // the shoulder in the world for the current pose (Pupo's anchors, scaled and mirrored; the swing's rotation applied)
  shoulder(p, R) {
    const o = R.draw, S = PupoRide.ART, f = o.facing || 1, an = Pupo.anchors(o.pose === 'ride' || o.pose === 'swim' ? 'walk' : o.pose, o.t, this.an, o);
    let x = o.x + f * an.shoulderF.x * S, y = o.y + an.shoulderF.y * S * (o.pose === 'flop' ? 1 : 1);
    if (o.rot) { const c = Math.cos(o.rot), s = Math.sin(o.rot), dx = x - o.rotX, dy = y - o.rotY; x = o.rotX + dx * c - dy * s; y = o.rotY + dx * s + dy * c; }
    this.sx = x; this.sy = y;
  },
  sx: 0, sy: 0,
  draw(ctx, p, g, R, t) {
    const a = R.arm; if (!a || a.phase === 0 || a.len <= 1) return;
    this.shoulder(p, R);
    // the hand: the tip of the arm from the riding shoulder (the game's reach geometry), drawn from the art's shoulder
    PupoReach.tip(p, a);
    const hx = PupoReach.px, hy = PupoReach.py, sag = Math.min(14, a.len * 0.06) * (a.phase === 3 ? -1 : 1) * (a.ux >= 0 ? 1 : -1);
    Pupo.arm(ctx, this.sx, this.sy, hx, hy, { w: 6, col: PUPO.fur, t, point: a.kind !== 'hook' && a.kind !== 'post' && a.kind !== 'handle' && !a.carry, sag, handScale: 1.1 });
    // the belly-button boop: a white ink ring grows at the fingertip
    if (a.boop > 0) { const k = 1 - a.boop / 0.35, r = 2 + k * 10; ctx.lineWidth = 3.4; ctx.strokeStyle = '#1c1426'; ctx.beginPath(); ctx.arc(a.bx, a.by, r, 0, TAU); ctx.stroke(); ctx.lineWidth = 1.8; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
  },
  // the paw marker: a small cream paw with an ink outline over the chosen target, bobbing 2 px at 1 Hz (25 % larger in portrait)
  marker(ctx, p, g, R, t) {
    const tg = R.tg, a = R.arm; if (!tg || !tg.kind || R.showT > 0 || (a && a.phase !== 0)) return;
    const s = (Game.cssH > Game.cssW ? 1.25 : 1), x = tg.x, y = tg.y - 16 * s + Math.sin(t * TAU) * 2;
    this.paw(ctx, x, y, s * 0.9, PupoReach.verbOf(tg.kind));
  },
  // a paw icon for a verb: poke (pointing claw), grab (open paw), pull (fist), fetch (cupped paw)
  paw(ctx, x, y, s, verb) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = '#1c1426'; ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4ead8'; ctx.beginPath(); ctx.arc(0, 0, 5.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 1.6;
    if (verb === 'poke') { ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -10); ctx.stroke(); ctx.strokeStyle = '#f4ead8'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, -9.4); ctx.stroke(); }
    else if (verb === 'grab') { for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 3, -3); ctx.lineTo(i * 4.2, -8.5); ctx.stroke(); } }
    else if (verb === 'pull') { ctx.beginPath(); ctx.moveTo(-3.5, -2); ctx.lineTo(3.5, -2); ctx.moveTo(-3.5, 1); ctx.lineTo(3.5, 1); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, -1, 3.6, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.restore();
  },
  // the action button shows what Action will do while riding
  actionArt(ctx, b) {
    const play = Game.scene; if (!(play instanceof Play) || !play.player || !play.player.pupoRide) return false;
    const R = play.pupo, tg = R && R.tg, verb = tg && tg.kind ? PupoReach.verbOf(tg.kind) : 'poke';
    ctx.save(); const s = b.r / 16; ctx.globalAlpha *= tg && tg.kind ? 1 : 0.7; this.paw(ctx, 0, 3, s, verb); ctx.restore();
    return true;
  }
};
{
  const aa0 = Input.actionArt;
  Input.actionArt = (ctx, b, held) => { if (PupoArms.actionArt(ctx, b)) return true; return aa0 ? aa0(ctx, b, held) : false; };
  // the swing / zip / pull / ledge poses rotate the ride about a point: applied around the inked body
  const pr0 = PupoRide.paintRide;
  PupoRide.paintRide = function (c) {
    const p = this.cur, o = p.g.pupo.draw;
    if (o.rot) { c.save(); c.translate(o.rotX, o.rotY); c.rotate(o.rot); c.translate(-o.rotX, -o.rotY); pr0.call(this, c); c.restore(); }
    else pr0.call(this, c);
  };
  const ps0 = PupoRide.pose;
  PupoRide.pose = function (p, R) {
    const o = R.draw; o.rot = 0; o.armsOff = false; o.big = 0;
    const r = ps0.call(this, p, R);
    const a = R.arm; if (a && a.phase !== 0) r.armsOff = true;
    return r;
  };
}
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoReach, PupoArms, PupoGrab, PupoClimb, PupoBar, PupoHandle, PupoTickle, PupoGrille, PupoSnatch }); } catch (e) { /* not in a browser */ }
