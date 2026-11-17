/* ============================================================
   World tour: secret-room kinds, part 1 (docs/design/SECRET_ROOMS.md §2): the rooms with a game in them.
   ambush (Monster Closet), bigone (The Big One), rush (Rush), fetch (Recipe Kitchen), lamps (Light the Lamps),
   whack (Whack-a-Critter), shell (Shell Game), prank (Prank Room), closing (Closing Time).
   Each one: make(o, keep, ctx, A, rng) -> a RoomGrid; enter / update / draw at run time (TourRooms).
   A won game opens the room's prize cage (a lock with the room's id; the checker opens it with a key spot, so
   the prize is proven reachable as if the game were won).
   ============================================================ */
const TourRoomKit = {
  Y: 10,   // the row things stand on in a 14-row room (floor 11)
  // a plain room W wide, the way in on the left
  room(W, H, F) { return new RoomGrid(W, H || 14, F || 11); },
  // the prize: the old room's boxes, or the option's, or a coin box
  prize(o, keep) { const p = o.prize ? [].concat(o.prize) : keep.prize.slice(); return p.length ? p : ['picks']; },
  // the right end: the cage against the right wall, the gate wing left of it; returns the last free column
  east(g, keep, A, o, opts) {
    opts = opts || {};
    const y = g.F - 1;
    let x = g.W - 2;
    if (opts.cage !== false) {
      const items = this.prize(o, keep), w = Math.max(3, items.length + 2), cx = g.W - 2 - w;
      g.cage(A.id, cx, y, items, { w, needsAll: opts.needsAll });
      x = cx - 1;
    }
    const needGate = keep.extras.some(e => e[0] === 'spawn' && e[1] === 'gate');
    if (keep.gate || needGate) { const gx = x - 2 - (keep.gate && needGate ? 2 : 0); g.gateWing(keep, gx, y); x = gx - (keep.fake ? 4 : 2); }
    return x;
  },
  // how wide the east end is (so the kinds can size their rooms)
  eastW(keep, o, cage) {
    const needGate = keep.extras.some(e => e[0] === 'spawn' && e[1] === 'gate');
    return (cage === false ? 1 : Math.max(3, this.prize(o, keep).length + 2) + 2) + (keep.gate || needGate ? (keep.gate && needGate ? 6 : 4) + (keep.fake ? 2 : 0) : 0);
  },
  // the level's critters that walk and can be stomped (an option's list first)
  critters(play, kit) {
    const ok = t => { const C = ENTITY_TYPES[t]; return C && C.prototype instanceof TourEnemy && !(C.cfg && (C.cfg.spiky || C.cfg.fiery)) && (!Tour.enemyInfo[t] || Tour.enemyInfo[t].place === 'walk'); };
    // plain fighters for a closet: walkers, hoppers, chargers, throwers (not burrowers, sleepers, thieves...)
    const plain = t => ok(t) && ['walk', 'hop', 'charge', 'throw'].indexOf((ENTITY_TYPES[t].cfg && ENTITY_TYPES[t].cfg.behavior) || 'walk') >= 0;
    let L = [].concat(kit.o.critters || []).filter(ok);
    if (!L.length) L = ((play.level.design && play.level.design.enemies) || []).map(e => Array.isArray(e) ? e[0] : e).filter(plain);
    if (!L.length) { const cc = play.level.country; L = Object.keys(Tour.enemyInfo).filter(t => Tour.enemyInfo[t].country === cc && plain(t)); }
    return L.length ? L : Object.keys(Tour.enemyInfo).filter(ok).slice(0, 3);
  },
  // bars over the barred doors
  drawBars(play, ctx, R) {
    if (!R.bars) return;
    for (const b of R.bars) {
      const e = b.e, x = e.cx, y = e.y + e.h;
      Ink.around(ctx, x - 22, y - 60, 44, 62, c => {
        c.fillStyle = '#8a5a2a'; c.save(); c.translate(x, y - 28);
        for (const a of [-0.5, 0.5]) { c.save(); c.rotate(a); c.fillRect(-24, -5, 48, 10); c.restore(); }
        c.restore();
        c.fillStyle = '#6a6a78'; for (let k = -1; k <= 1; k++) c.fillRect(x + k * 12 - 2, y - 56, 4, 56);
      }, { pad: 6 });
    }
  },
  sec(play) { return 'room'; },
  // Brady is clear of the door he came in by (the games wait for that)
  inside(play, A, R) { const p = play.player, a = A.anchors && (A.anchors.in || A.anchors.start); return !a || Math.abs(p.cx - a.x) > 2.5 * TS || R.t > 3; },
  raspberry(play, txt) { Sound.play('powerdown', { vol: 0.6 }); play.bannerText = txt || 'PFFFT!'; play.bannerT = 1.4; }
};

/* ================= ambush: the Monster Closet ================= */
TourRooms.def('ambush', {
  title: 'MONSTER CLOSET!', rule: 'THE DOOR IS BARRED: STOMP EVERY CRITTER', need: 'STOMP THEM ALL FIRST!',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 30 + K.eastW(keep, o);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o);
    const v = o.variant != null ? o.variant : Math.floor(rng() * 3), mid = Math.floor((x0 + x1) / 2);
    if (v === 0) { g.hline(mid - 7, mid - 4, 7, '-'); g.hline(mid + 4, mid + 7, 7, '-'); g.hline(mid - 1, mid + 1, 4, '-'); g.put(mid, 3, '*'); }
    else if (v === 1) { g.fill(mid - 1, 9, mid + 1, 10, '#'); g.hline(mid - 7, mid - 4, 6, '-'); g.hline(mid + 4, mid + 7, 6, '-'); g.put(mid + 6, 3, '*'); g.coins(mid - 1, mid + 1, 8); }
    else { g.hline(x0 + 1, mid - 3, 7, '-'); g.hline(mid + 3, x1 - 1, 7, '-'); g.hline(mid - 1, mid + 1, 4, '-'); g.put(mid, 3, '*'); }
    g.coins(mid - 6, mid - 4, 6 - (v === 1 ? 1 : 0)); g.coins(mid + 4, mid + 6, 6 - (v === 1 ? 1 : 0));
    g.winSpot(A.id, mid, Y);
    g.dress(keep, [x0 + 1, mid - 5, mid + 5], Y);
    // the ceiling hatches the critters drop from
    g.data.drops = [x0 + 3, mid - 3, mid + 3, x1 - 2].map(x => Math.max(2, x));
    g.data.waves = o.waves || [2, 3];
    return g;
  },
  enter(play, A, R, kit) {
    if (R.won) return;
    for (const e of R.mobs || []) e.remove = true;
    R.mobs = []; R.wave = 0; R.phase = 'wait'; R.waitT = 0; R.fightT = 0; R.dropT = 0;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const D = kit.data, p = play.player;
    if (R.phase === 'wait') { if (TourRoomKit.inside(play, A, R)) { R.waitT += dt; if (R.waitT > 0.6) { TourRooms.bar(play, A, R); R.phase = 'drop'; R.dropT = 0.4; } } return; }
    if (R.phase === 'gone') return;
    R.fightT += dt;
    if (R.phase === 'drop') {
      R.dropT -= dt;
      if (R.dropT <= 0) {
        const types = TourRoomKit.critters(play, kit), n = D.waves[R.wave] + (kit.d > 0.6 && R.wave > 0 ? 1 : 0);
        const cols = D.drops.slice().sort((a, b) => Math.abs(b * TS - p.cx) - Math.abs(a * TS - p.cx));
        for (let k = 0; k < n; k++) {
          const tx = cols[k % cols.length] + (k >= cols.length ? 1 : 0);
          const e = TourRooms.add(play, types[(R.wave + k) % types.length], tx, 1, { dir: tx * TS < p.cx ? 1 : -1 });
          if (e) { e.roomMob = true; R.mobs.push(e); play.burst(tx * TS + TS / 2, TS + 8, 8, '#e8d8b0', 'dust'); }
        }
        R.hatchT = 0.8; R.wave++; R.phase = 'fight';
        Sound.play('kick', { vol: 0.5 });
      }
      return;
    }
    if (R.hatchT > 0) R.hatchT -= dt;
    const alive = R.mobs.filter(e => !e.dead && !e.remove && !e.friendT);
    if (!alive.length) {
      if (R.wave < D.waves.length) { R.phase = 'drop'; R.dropT = 0.9; play.bannerText = 'HERE COME MORE!'; play.bannerT = 1; }
      else TourRooms.win(play, A, R, { text: 'CLOSET CLEARED!', coins: 6 });
      return;
    }
    // never a soft-lock: after 45 s the critters get bored and leave, and the door opens (come back to try again)
    if (R.fightT > 45) {
      for (const e of alive) { e.remove = true; play.burst(e.cx, e.cy, 10, '#ffffff', 'dust'); }
      TourRooms.unbar(play, A, R); R.phase = 'gone'; TourRoomKit.raspberry(play, 'THEY GOT BORED AND LEFT...');
    }
  },
  draw(play, ctx, A, R, kit) {
    TourRoomKit.drawBars(play, ctx, R);
    // the ceiling hatches: open while critters drop
    const open = R.hatchT > 0 || R.phase === 'drop';
    for (const tx of kit.data.drops) {
      const x = tx * TS + TS / 2, y = TS;
      Ink.around(ctx, x - 18, y - 4, 36, 14, c => { c.fillStyle = open ? '#1c1426' : '#7a5a3a'; c.fillRect(x - 15, y, 30, open ? 10 : 6); if (!open) { c.fillStyle = '#5a3a24'; c.fillRect(x - 1, y, 2, 6); } }, { pad: 4 });
    }
    if (R.phase === 'fight' && !R.won) {
      const n = R.mobs.filter(e => !e.dead && !e.remove).length;
      TourRooms.hudText(play, ctx, 'CRITTERS LEFT: ' + n + (R.wave < kit.data.waves.length ? '  (MORE COMING)' : ''), '#ffd84a', 13);
    }
  }
});

/* ================= bigone: The Big One (a mini-boss cameo) ================= */
const TourBigOne = {
  cache: {},
  // a giant one of a walking critter: three stomps (a hit makes it hop and hurry), drawn scaled from its feet
  of(type) {
    if (this.cache[type]) return this.cache[type];
    const Base = ENTITY_TYPES[type];
    const C = class extends Base {
      constructor(g, s) {
        super(g, s);
        const k = this.k = s.k || 1.9;
        this.w0 = this.w; this.h0 = this.h;
        this.x -= this.w0 * (k - 1) / 2; this.y -= this.h0 * (k - 1); this.w = this.w0 * k; this.h = this.h0 * k;
        this.hp = s.hp || 3; this.hpMax = this.hp; this.hurtT = 0; this.hopT = 1.6; this.bigOne = true; this.baseSpeed = this.speed;
      }
      update(dt) {
        if (this.hurtT > 0) this.hurtT -= dt;
        super.update(dt);
        if (this.dead || this.knocked) return;
        const p = this.g.player;
        this.hopT -= dt;
        if (this.hopT <= 0 && this.onGround) { this.hopT = 2.4 - (this.hpMax - this.hp) * 0.5; this.vy = -(8 + (this.hpMax - this.hp) * 1.5) * TS; this.onGround = false; if (p) { this.dir = sign(p.cx - this.cx) || this.dir; this.vx = this.dir * Math.abs(this.vx || this.speed); } }
      }
      hit(kind, src) {
        if (this.dead) return false;
        if (this.hurtT > 0) return kind === 'stomp' || kind === 'spin' ? 'bounce' : false;
        if (this.hp > 1 && kind !== 'bump') {
          this.hp--; this.hurtT = 0.9; this.speed = this.baseSpeed * (1 + 0.45 * (this.hpMax - this.hp)); this.vx = sign(this.vx || this.dir) * this.speed;
          Sound.play('stomp', { pitch: 0.7 }); this.g.shake(4); this.g.burst(this.cx, this.y, 14, '#ffffff', 'spark');
          this.hopT = 0.5; this.stunT = 0;
          return kind === 'stomp' || kind === 'spin' ? 'bounce' : true;
        }
        if (kind === 'bump') return false;
        this.hp = 1;
        const r = super.hit(kind === 'love' || kind === 'hug' || kind === 'taco' ? 'stomp' : kind, src);
        if (r) { this.g.shake(6); this.g.burst(this.cx, this.cy, 30, '#ffd84a', 'confetti'); }
        return r;
      }
      draw(ctx) {
        const k = this.k, fx = this.x + this.w / 2, fy = this.y + this.h, s = [this.x, this.y, this.w, this.h];
        this.w = this.w0; this.h = this.h0; this.x = fx - this.w0 / 2; this.y = fy - this.h0;
        ctx.save(); ctx.translate(fx, fy); ctx.scale(k, k); ctx.translate(-fx, -fy);
        if (this.hurtT > 0 && Math.floor(this.hurtT * 14) % 2) ctx.globalAlpha = 0.45;
        try { super.draw(ctx); } finally { ctx.restore(); [this.x, this.y, this.w, this.h] = s; }
        // its hearts
        if (!this.dead) for (let i = 0; i < this.hpMax; i++) { ctx.fillStyle = i < this.hp ? '#ff4a6a' : 'rgba(40,30,50,0.6)'; const hx = this.cx - (this.hpMax - 1) * 9 + i * 18, hy = this.y - 14; ctx.beginPath(); ctx.arc(hx - 3, hy, 4, 0, TAU); ctx.arc(hx + 3, hy, 4, 0, TAU); ctx.moveTo(hx - 7, hy + 1); ctx.lineTo(hx, hy + 9); ctx.lineTo(hx + 7, hy + 1); ctx.fill(); }
      }
    };
    this.cache[type] = C;
    return C;
  }
};
TourRooms.def('bigone', {
  title: 'THE BIG ONE!', rule: 'A GIANT CRITTER: STOMP IT THREE TIMES', need: 'BEAT THE BIG ONE FIRST!',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 30 + K.eastW(keep, o);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o), mid = Math.floor((x0 + x1) / 2);
    // two perches to jump off onto its head, a high shelf for the postcard
    g.hline(mid - 7, mid - 4, 7, '-'); g.hline(mid + 4, mid + 7, 7, '-');
    g.hline(mid - 1, mid + 1, 4, '-'); g.put(mid, 3, '*');
    g.coins(mid - 7, mid - 4, 6); g.coins(mid + 4, mid + 7, 6);
    g.winSpot(A.id, mid, Y);
    g.dress(keep, [x0, mid - 4, mid + 4], Y);
    g.data.drop = mid + 3;
    return g;
  },
  enter(play, A, R, kit) {
    if (R.won) return;
    if (R.boss) R.boss.remove = true;
    R.boss = null; R.phase = 'wait'; R.waitT = 0; R.fightT = 0;
  },
  update(play, dt, A, R, kit) {
    if (R.won || R.phase === 'gone') return;
    if (R.phase === 'wait') {
      if (!TourRoomKit.inside(play, A, R)) return;
      R.waitT += dt;
      if (R.waitT > 0.5) {
        TourRooms.bar(play, A, R);
        const types = TourRoomKit.critters(play, kit), type = kit.o.critter && ENTITY_TYPES[kit.o.critter] ? kit.o.critter : types[0];
        ENTITY_TYPES['roomBig:' + type] = TourBigOne.of(type);
        const e = TourRooms.add(play, 'roomBig:' + type, kit.data.drop, 1, { dir: -1, k: kit.o.scale || 1.9, hp: kit.o.hp || 3 });
        R.boss = e; R.phase = 'fight';
        play.shake(5); Sound.play('thunder', { vol: 0.4 }); play.bannerText = kit.o.name || 'THE BIG ONE!'; play.bannerT = 1.4;
      }
      return;
    }
    R.fightT += dt;
    const b = R.boss;
    if (!b || b.dead || b.remove) { TourRooms.win(play, A, R, { text: (kit.o.name || 'THE BIG ONE') + ' IS DOWN!', coins: 8 }); return; }
    if (R.fightT > 60) { b.remove = true; play.burst(b.cx, b.cy, 20, '#ffffff', 'dust'); TourRooms.unbar(play, A, R); R.phase = 'gone'; TourRoomKit.raspberry(play, 'IT WANDERED OFF FOR A NAP...'); }
  },
  draw(play, ctx, A, R) { TourRoomKit.drawBars(play, ctx, R); }
});

/* ================= rush: grab every token before the clock runs out ================= */
TourRooms.def('rush', {
  title: 'RUSH!', rule: 'GRAB THEM ALL BEFORE THE CLOCK RUNS OUT', need: 'GRAB THEM ALL IN TIME!', timed: true,
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, look = o.look || 'tokChili', n = o.n || 6;
    const W = 34 + K.eastW(keep, o);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep);
    const ids = []; for (let k = 0; k < n; k++) ids.push('tok:' + A.id + ':' + k);
    const x1 = K.east(g, keep, A, o, { needsAll: ids });
    const v = o.variant != null ? o.variant : Math.floor(rng() * 2);
    // a course of shelves and two small spike pits; the tokens on its corners
    const spots = [];
    const span = x1 - x0;
    const at = f => x0 + Math.round(span * f);
    g.hline(at(0.12), at(0.12) + 3, 7, '-'); spots.push([at(0.12) + 1, 6]);
    g.fill(at(0.3), 10, at(0.3) + 1, 10, '^'); spots.push([at(0.3) + 1, 7]);
    g.hline(at(0.36), at(0.36) + 3, 4, v ? '#' : '-'); spots.push([at(0.36) + 2, 3]);
    g.fill(at(0.52), 9, at(0.52) + 2, 10, '#'); spots.push([at(0.52) + 1, 8]);
    g.hline(at(0.62), at(0.62) + 3, 6, '-'); spots.push([at(0.62) + 3, 5]);
    g.fill(at(0.75), 10, at(0.75) + 1, 10, '^'); spots.push([at(0.85), Y]);
    g.hline(at(0.78), at(0.78) + 3, 3, '-'); spots.push([at(0.78) + 1, 2]);
    g.put(at(0.62) + 1, 3, '*');
    g.coins(at(0.12), at(0.12) + 3, 5);
    spots.slice(0, n).forEach((s, k) => { g.spawn(s[0], s[1], 'key', { id: ids[k], look }); g.need('token ' + k, s[0], s[1]); });
    g.data.tokens = spots.slice(0, n).map((s, k) => ({ id: ids[k], tx: s[0], ty: s[1], look }));
    g.data.t = o.t || 16;
    g.dress(keep, [x0, at(0.45), at(0.7)], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) this.reset(play, A, R, kit); },
  reset(play, A, R, kit) {
    for (const tk of kit.data.tokens) {
      play.keys.delete(tk.id);
      if (!play.entities.some(e => e instanceof ENTITY_TYPES.key && e.id === tk.id && !e.remove)) TourRooms.add(play, 'key', tk.tx, tk.ty, { id: tk.id, look: tk.look });
    }
    R.phase = 'ready'; R.left = kit.data.t + (kit.d < 0.3 ? 3 : 0); R.restT = 0;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (R.phase === 'ready') { if (TourRoomKit.inside(play, A, R) || play.player.vx) { R.phase = 'run'; Sound.play('whistle', { vol: 0.5 }); } return; }
    if (R.phase === 'rest') { R.restT -= dt; if (R.restT <= 0) { this.reset(play, A, R, kit); R.phase = 'run'; play.bannerText = 'AGAIN!'; play.bannerT = 1; } return; }
    const got = kit.data.tokens.filter(tk => play.keys.has(tk.id)).length;
    if (got >= kit.data.tokens.length) { TourRooms.win(play, A, R, { text: 'ALL OF THEM!', coins: 10 }); return; }
    R.left -= dt;
    if (R.left <= 0) {
      R.phase = 'rest'; R.restT = 2.2; TourRoomKit.raspberry(play, 'TIME! ' + got + ' OF ' + kit.data.tokens.length);
      for (const e of play.entities) if (e instanceof ENTITY_TYPES.key && kit.data.tokens.some(tk => tk.id === e.id)) { e.remove = true; play.burst(e.cx, e.cy, 6, '#ffffff', 'dust'); }
    }
  },
  draw(play, ctx, A, R, kit) {
    if (R.won) return;
    const L = TourMaze.KEYS[kit.data.tokens[0].look];
    if (R.phase === 'run' || R.phase === 'ready') TourRooms.clock(play, ctx, R.phase === 'ready' ? kit.data.t : Math.max(0, R.left), kit.data.t);
    TourRooms.counter(play, ctx, kit.data.tokens.filter(tk => play.keys.has(tk.id)).length, kit.data.tokens.length, L && L.icon ? (c, x, y, t) => L.icon(c, x, y, t) : null);
  }
});

/* ================= fetch: the Recipe Kitchen ================= */
TourRooms.def('fetch', {
  title: 'RECIPE KITCHEN!', rule: 'FIND THE THREE INGREDIENTS AND BRING THEM TO THE POT', need: 'THE POT NEEDS ALL THREE!',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, looks = o.ingredients || ['tokChili', 'tokCacao', 'tokTomato'];
    const W = 34 + K.eastW(keep, o);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep);
    const ids = looks.map((l, k) => 'ing:' + A.id + ':' + k), pot = 'room:' + A.id + ':pot';
    const x1 = K.east(g, keep, A, o, { needsAll: ids.concat([pot]) });
    const mid = Math.floor((x0 + x1) / 2), v = o.variant != null ? o.variant : Math.floor(rng() * 2);
    // the pot in the middle of the floor; the cupboards round it: one up the shelves, one over a spike strip, one on
    // the high hook (a spring up to it)
    g.put(mid, Y, g.L(['spawn', 'roomPot', { look: o.pot || null, dish: o.dish || 'DINNER IS SERVED!' }]));
    g.put(mid + 1, Y, g.L(['vkey', pot])); g.need('the pot', mid + 1, Y);
    const spots = [];
    g.hline(x0 + 1, x0 + 4, 7, '-'); g.hline(x0 + 4, x0 + 7, 4, '-'); spots.push(v ? [x0 + 6, 3] : [x0 + 2, 6]);
    g.fill(mid + 4, 10, mid + 6, 10, '^'); g.hline(mid + 3, mid + 7, 6, '-'); spots.push([mid + 5, 5]);
    g.put(x1 - 2, Y, 's'); g.hline(x1 - 4, x1 - 1, 3, '-'); spots.push([x1 - 3, 2]);
    if (v) { g.hline(x0 + 1, x0 + 4, 7, '-'); g.coins(x0 + 1, x0 + 4, 6); } else g.coins(x0 + 4, x0 + 7, 3);
    g.put(mid, 2, '*'); g.hline(mid - 1, mid + 1, 3, '-');
    spots.forEach((s, k) => { g.spawn(s[0], s[1], 'key', { id: ids[k], look: looks[k] }); g.need('ingredient ' + looks[k], s[0], s[1]); });
    g.data.ings = ids.map((id, k) => ({ id, look: looks[k] }));
    g.dress(keep, [x0 + 1, mid - 3, mid + 8], Y);
    return g;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const pot = play.entities.find(e => e instanceof TourRoomPot);
    if (!pot || !overlap(play.player, pot)) { R.toldT = Math.max(0, (R.toldT || 0) - dt); return; }
    const have = kit.data.ings.filter(i => play.keys.has(i.id)).length;
    if (have >= kit.data.ings.length) { pot.cook(); TourRooms.win(play, A, R, { text: pot.dish, coins: 6 }); }
    else if (!(R.toldT > 0)) { R.toldT = 2.5; play.parts.text(pot.cx, pot.y - 10, 'STILL NEED ' + (kit.data.ings.length - have) + '!', '#ffd84a'); Sound.play('bump', { vol: 0.4 }); }
  },
  draw(play, ctx, A, R, kit) {
    if (R.won) return;
    // the recipe card: the three ingredients, ticked once found
    const n = kit.data.ings.length, x = play.camX + Game.viewW / 2, y = play.camY + 40;
    ctx.save(); ctx.fillStyle = 'rgba(255,248,232,0.92)'; rr(ctx, x - n * 22 - 8, y - 20, n * 44 + 16, 40, 8); ctx.fill(); ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 1.5; ctx.stroke();
    kit.data.ings.forEach((i, k) => {
      const L = TourMaze.KEYS[i.look], cx = x - (n - 1) * 22 + k * 44, got = play.keys.has(i.id);
      ctx.save(); ctx.globalAlpha = got ? 1 : 0.4; ctx.translate(cx, y); ctx.scale(0.6, 0.6); if (L) L.icon(ctx, 0, 0, play.t); ctx.restore();
      if (got) { ctx.strokeStyle = '#2a9a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 8, y + 4); ctx.lineTo(cx - 2, y + 11); ctx.lineTo(cx + 10, y - 6); ctx.stroke(); }
    });
    ctx.restore();
  }
});
// the cook's pot: steams, bubbles over when the dish is done
class TourRoomPot extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 40); this.x = s.x - TS / 2; this.dish = s.dish || 'DINNER IS SERVED!'; this.done = 0; this.back = true; }
  update(dt) { this.t += dt; if (this.done > 0) this.done = Math.min(3, this.done + dt); }
  cook() { if (!this.done) { this.done = 0.01; Sound.play('splash', { vol: 0.6 }); this.g.burst(this.cx, this.y, 26, '#fff4d0', 'spark'); } }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    Ink.around(ctx, x - 34, y - 64, 68, 66, c => {
      c.fillStyle = '#3a3440'; c.fillRect(x - 20, y - 4, 6, 4); c.fillRect(x + 14, y - 4, 6, 4);
      c.fillStyle = '#c86a3a'; c.beginPath(); c.ellipse(x, y - 18, 26, 16, 0, 0, TAU); c.fill();
      c.fillStyle = '#e8904a'; c.fillRect(x - 28, y - 34, 56, 7);
      c.fillStyle = this.done ? '#8a3a2a' : '#5a3a2a'; c.beginPath(); c.ellipse(x, y - 33, 24, 5, 0, 0, TAU); c.fill();
    }, { pad: 6 });
    // steam (more once it is cooking)
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let k = 0; k < (this.done ? 6 : 3); k++) { const ph = (t * 0.8 + k * 0.37) % 1; ctx.globalAlpha = 0.6 * (1 - ph); ctx.beginPath(); ctx.arc(x - 10 + k * 7 + Math.sin(t * 2 + k) * 4, y - 40 - ph * 30, 4 + ph * 5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
ENTITY_TYPES.roomPot = TourRoomPot;

/* ================= lamps: light them in the order the picture shows ================= */
TourRooms.def('lamps', {
  title: 'LIGHT THE LAMPS!', rule: 'LIGHT THEM IN THE ORDER THE PICTURE SHOWS', need: 'LIGHT THE LAMPS IN ORDER!',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, n = o.n || 4, W = 34 + K.eastW(keep, o);
    const g = K.room(W), Y = K.Y;
    g.area = { dark: true };
    const x0 = g.west(keep);
    const ids = []; for (let k = 0; k < n; k++) ids.push('lamp:' + A.id + ':' + k);
    const x1 = K.east(g, keep, A, o, { needsAll: ids });
    const span = x1 - x0, at = f => x0 + Math.round(span * f);
    // the lamps stand on the floor, a shelf, a high ledge and the floor again
    const spots = [[at(0.15), Y], [at(0.38), 6], [at(0.62), 3], [at(0.88), Y]];
    g.hline(at(0.38) - 2, at(0.38) + 2, 7, '-'); g.hline(at(0.62) - 2, at(0.62) + 2, 4, '#');
    g.hline(at(0.5) - 1, at(0.5) + 1, 8, '-');
    g.coins(at(0.38) - 2, at(0.38) + 2, 5); g.put(at(0.62) + 2, 1, '*');
    // the order: a shuffle of the lamps that is never simply left to right
    let ord = [0, 1, 2, 3].slice(0, n);
    for (let tries = 0; tries < 8; tries++) { ord.sort(() => rng() - 0.5); if (ord.some((v, k) => v !== k)) break; }
    spots.slice(0, n).forEach((s, k) => { g.put(s[0], s[1], g.L(['spawn', 'roomLamp', { k, ord: ord.indexOf(k), sym: (k + (o.sym || 0)) % 4 }])); g.vline(s[0] + 1, s[1], s[1], g.L(['vkey', ids[k]])); g.need('lamp ' + k, s[0], s[1]); });
    g.data.order = ord.map(k => (k + (o.sym || 0)) % 4);
    g.data.mural = [Math.floor((x0 + x1) / 2), 2];
    g.dress(keep, [x0, at(0.27), at(0.75)], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.next = 0; for (const e of play.entities) if (e instanceof TourRoomLamp) e.lit = false; } },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    for (const e of play.entities) {
      if (!(e instanceof TourRoomLamp) || e.lit || !overlap(play.player, e)) continue;
      if (e.ord === R.next) { e.lit = true; R.next++; Sound.play('checkpoint', { vol: 0.6 }); play.burst(e.cx, e.y + 10, 14, '#ffd890', 'spark'); if (R.next >= kit.data.order.length) { A.dark = false; TourRooms.win(play, A, R, { text: 'LET THERE BE LIGHT!', coins: 6 }); } }
      else { for (const L of play.entities) if (L instanceof TourRoomLamp) L.lit = false; R.next = 0; e.puffT = 1; TourRoomKit.raspberry(play, 'PFFT! WRONG ORDER'); }
    }
  },
  draw(play, ctx, A, R, kit) {
    // the picture on the wall: the lamps' symbols in order, the lit ones ticked
    const [mx, my] = kit.data.mural, n = kit.data.order.length, x = mx * TS + TS / 2, y = my * TS + TS / 2;
    Ink.around(ctx, x - n * 18 - 10, y - 20, n * 36 + 20, 40, c => {
      c.fillStyle = '#e8d8b0'; rr(c, x - n * 18 - 6, y - 16, n * 36 + 12, 32, 5); c.fill();
      c.strokeStyle = '#7a5a3a'; c.lineWidth = 3; c.stroke();
      kit.data.order.forEach((sym, k) => {
        const cx = x - (n - 1) * 18 + k * 36;
        TourRoomArt.sym(c, sym, cx, y, 9);
        if (k < n - 1) { c.fillStyle = '#7a5a3a'; c.beginPath(); c.moveTo(cx + 13, y - 4); c.lineTo(cx + 19, y); c.lineTo(cx + 13, y + 4); c.fill(); }
      });
    }, { pad: 6 });
    kit.data.order.forEach((sym, k) => { if (k < (R.next || 0) || R.won) { const cx = x - (n - 1) * 18 + k * 36; ctx.fillStyle = 'rgba(255,240,150,0.5)'; ctx.beginPath(); ctx.arc(cx, y, 13, 0, TAU); ctx.fill(); } });
  }
});
class TourRoomLamp extends Ent {
  constructor(g, s) { super(g, s, 24, 64); this.k = s.k; this.ord = s.ord; this.sym = s.sym; this.lit = false; this.glow = 0; this.puffT = 0; }
  update(dt) { this.t += dt; this.glow = approach(this.glow, this.lit ? 1 : 0, dt * 3); if (this.puffT > 0) this.puffT -= dt; }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, k = this.glow;
    Ink.around(ctx, x - 14, y - 66, 28, 68, c => {
      c.fillStyle = '#4a3a30'; c.fillRect(x - 2, y - 44, 4, 44); c.fillRect(x - 9, y - 4, 18, 4);
      c.fillStyle = k > 0.1 ? `rgba(255,${200 + 40 * Math.sin(this.t * 6)},110,${0.5 + 0.5 * k})` : '#3a3040';
      rr(c, x - 10, y - 62, 20, 20, 5); c.fill(); c.strokeStyle = '#1c1426'; c.lineWidth = 1.5; c.stroke();
      TourRoomArt.sym(c, this.sym, x, y - 52, 6);
    }, { pad: 6 });
    if (this.puffT > 0) { ctx.save(); ctx.globalAlpha = this.puffT; ctx.fillStyle = '#9a9aa8'; ctx.beginPath(); ctx.arc(x, y - 72 - (1 - this.puffT) * 16, 8 + (1 - this.puffT) * 8, 0, TAU); ctx.fill(); ctx.restore(); }
  }
  get light() { return { r: 26 + this.glow * 200, c: 'rgba(255,214,140,', y: this.y + 10 }; }
}
ENTITY_TYPES.roomLamp = TourRoomLamp;

/* ================= whack: critters pop out of the floor ================= */
TourRooms.def('whack', {
  title: 'WHACK-A-CRITTER!', rule: 'STOMP THE CRITTERS AS THEY POP UP', need: 'WIN THE GAME FIRST!', timed: true,
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, n = o.holes || 6, W = 32 + K.eastW(keep, o);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep) + 1, x1 = K.east(g, keep, A, o);
    const span = x1 - x0 - 2;
    const holes = []; for (let k = 0; k < n; k++) holes.push(x0 + 1 + Math.round(span * (k + 0.5) / n));
    holes.forEach((hx, k) => g.put(hx, Y, g.L(['spawn', 'roomHole', { k, look: o.critter || 'mole' }])));
    // a scoreboard shelf over the middle, the postcard on it
    const mid = Math.floor((x0 + x1) / 2);
    g.hline(mid - 2, mid + 2, 5, '-'); g.put(mid, 4, '*'); g.coins(mid - 2, mid + 2, 3);
    g.winSpot(A.id, mid, Y);
    g.data.need = o.need || 8; g.data.t = o.t || 22; g.data.look = o.critter || 'mole';
    g.dress(keep, [x0 - 1, x1 - 1], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.phase = 'ready'; R.score = 0; R.left = kit.data.t; R.popT = 0.8; } },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const holes = play.entities.filter(e => e instanceof TourRoomHole), p = play.player;
    if (R.phase === 'ready') { if (TourRoomKit.inside(play, A, R)) { R.phase = 'play'; Sound.play('whistle', { vol: 0.5 }); } return; }
    if (R.phase === 'rest') { R.restT -= dt; if (R.restT <= 0) { R.phase = 'play'; R.score = 0; R.left = kit.data.t; play.bannerText = 'AGAIN!'; play.bannerT = 1; } return; }
    R.left -= dt; R.popT -= dt;
    const quick = 1 - kit.d * 0.35;
    if (R.popT <= 0) {
      const free = holes.filter(h => h.up <= 0 && Math.abs(h.cx - p.cx) > TS * 0.8);
      if (free.length) { const h = free[Math.floor(Math.random() * free.length)]; h.pop(1.25 * quick); }
      R.popT = (0.55 + Math.random() * 0.4) * quick;
    }
    // a stomp: Brady coming down onto a critter that is up
    for (const h of holes) {
      if (h.up <= 0 || h.hitT > 0) continue;
      const box = { x: h.x + 4, y: h.y + h.h - 30 * h.rise, w: h.w - 8, h: 30 * h.rise };
      if (h.rise > 0.4 && p.vy > 0 && overlap(p, box) && p.y + p.h < box.y + 16) {
        h.bonk(); R.score++; p.vy = -PHYS.stompV; Sound.play('stomp', { pitch: 1 + R.score * 0.05 }); play.parts.text(h.cx, h.y - 10, R.score + '!', '#ffd84a');
      }
    }
    if (R.score >= kit.data.need) { for (const h of holes) h.up = 0; TourRooms.win(play, A, R, { text: 'GOT ' + R.score + '!', coins: 8 }); return; }
    if (R.left <= 0) { R.phase = 'rest'; R.restT = 2.5; for (const h of holes) h.up = 0; TourRoomKit.raspberry(play, 'TIME! ' + R.score + ' OF ' + kit.data.need); }
  },
  draw(play, ctx, A, R, kit) {
    if (R.won) return;
    if (R.phase !== 'ready') TourRooms.clock(play, ctx, R.phase === 'rest' ? 0 : R.left, kit.data.t);
    TourRooms.counter(play, ctx, R.score || 0, kit.data.need, (c, x, y, t) => TourRoomCritters.draw(c, kit.data.look, x, y + 10, 1, t));
  }
});
class TourRoomHole extends Ent {
  constructor(g, s) { super(g, s, 30, 34); this.look = s.look || 'mole'; this.up = 0; this.rise = 0; this.hitT = 0; this.back = true; }
  pop(t) { this.up = t; this.hitT = 0; }
  bonk() { this.hitT = 0.4; this.up = Math.min(this.up, 0.4); this.g.burst(this.cx, this.y + 10, 8, '#ffffff', 'spark'); }
  update(dt) {
    this.t += dt;
    if (this.up > 0) this.up -= dt;
    if (this.hitT > 0) this.hitT -= dt;
    this.rise = approach(this.rise, this.up > 0.15 && this.hitT <= 0 ? 1 : 0, dt * 9);
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.fillStyle = '#1c1426'; ctx.beginPath(); ctx.ellipse(x, y - 3, 15, 5, 0, 0, TAU); ctx.fill();
    if (this.rise > 0.02 || this.hitT > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 60, 40, 57); ctx.clip();
      TourRoomCritters.draw(ctx, this.look, x, y - 3 + (1 - this.rise) * 30, this.hitT > 0 ? 0.6 : 1, this.t, this.hitT > 0);
      ctx.restore();
    }
    ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.ellipse(x, y - 2, 16, 4, 0, 0, Math.PI); ctx.fill();
  }
}
ENTITY_TYPES.roomHole = TourRoomHole;

/* ================= shell: three cups, one prize ================= */
TourRooms.def('shell', {
  title: 'SHELL GAME!', rule: 'WATCH THE PRIZE, THEN STOMP THE CUP IT IS UNDER', need: 'FIND THE RIGHT CUP FIRST!',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 32 + K.eastW(keep, o);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o), mid = Math.floor((x0 + x1) / 2);
    // the dealer's table: a long one-way top Brady stands on to stomp the cups
    g.hline(mid - 6, mid + 6, 8, '-');
    g.fill(mid - 6, 9, mid - 6, 10, '|'); g.fill(mid + 6, 9, mid + 6, 10, '|');
    g.put(mid, 7, g.L(['spawn', 'roomDealer', { look: o.dealer || null }]));
    g.winSpot(A.id, mid - 3, 7);
    g.hline(x0 + 1, x0 + 3, 5, '-'); g.put(x0 + 2, 4, '*'); g.coins(x1 - 4, x1 - 2, 6); g.hline(x1 - 4, x1 - 2, 7, '-');
    g.data.slots = [mid - 4, mid, mid + 4]; g.data.row = 7; g.data.cup = o.cup || 'cup'; g.data.joke = o.joke || ['sock', 'chicken'];
    g.data.swaps = o.swaps || 6;
    g.dress(keep, [x0, x1 - 6], Y);
    return g;
  },
  enter(play, A, R, kit) {
    if (R.won) return;
    if (!R.cups) R.cups = kit.data.slots.map((s, k) => ({ k, x: s * TS + TS / 2, from: k, to: k, lift: 0 }));
    R.phase = 'idle'; R.prize = 1; R.pt = 0; R.swapsLeft = 0;
    R.cups.forEach((c, k) => { c.slot = k; c.x = kit.data.slots[k] * TS + TS / 2; c.lift = 0; });
  },
  update(play, dt, A, R, kit) {
    if (R.won) { R.cups.forEach(c => { c.lift = approach(c.lift, c.k === R.prizeCup ? 1 : 0, dt * 3); }); return; }
    const D = kit.data, p = play.player, rowY = (D.row + 1) * TS, slotX = k => D.slots[k] * TS + TS / 2;
    R.pt += dt;
    const onTable = p.y + p.h > rowY - 3 * TS && p.y + p.h <= rowY + TS && p.cx > slotX(0) - 3 * TS && p.cx < slotX(2) + 3 * TS;
    if (R.phase === 'idle') {
      R.cups.forEach(c => { c.lift = approach(c.lift, 0, dt * 3); });
      if (onTable || TourRoomKit.inside(play, A, R) && R.t > 1.5) { R.phase = 'show'; R.pt = 0; R.prizeCup = R.cups.find(c => c.slot === 1).k; }
      return;
    }
    if (R.phase === 'show') {
      const c = R.cups.find(c => c.k === R.prizeCup);
      c.lift = R.pt < 1.4 ? approach(c.lift, 1, dt * 4) : approach(c.lift, 0, dt * 4);
      if (R.pt > 1.9) { R.phase = 'shuffle'; R.pt = 0; R.swapsLeft = D.swaps + Math.round(kit.d * 4) + (R.tries || 0); R.swap = null; }
      return;
    }
    if (R.phase === 'shuffle') {
      const dur = Math.max(0.28, 0.5 - kit.d * 0.15);
      if (!R.swap) { const a = Math.floor(Math.random() * 3); let b = Math.floor(Math.random() * 2); if (b >= a) b++; R.swap = { a, b, t: 0 }; Sound.play('select', { vol: 0.3 }); }
      R.swap.t += dt;
      const k = clamp(R.swap.t / dur, 0, 1), e = easeInOut(k);
      const ca = R.cups.find(c => c.slot === R.swap.a), cb = R.cups.find(c => c.slot === R.swap.b);
      ca.x = lerp(slotX(R.swap.a), slotX(R.swap.b), e); cb.x = lerp(slotX(R.swap.b), slotX(R.swap.a), e);
      ca.hop = Math.sin(k * Math.PI) * 10; cb.hop = -Math.sin(k * Math.PI) * 4;
      if (k >= 1) { ca.slot = R.swap.b; cb.slot = R.swap.a; ca.hop = cb.hop = 0; R.swap = null; if (--R.swapsLeft <= 0) { R.phase = 'pick'; R.pt = 0; play.toast('WHICH ONE? STOMP IT!'); } }
      return;
    }
    if (R.phase === 'pick') {
      if (p.vy > 0) for (const c of R.cups) {
        const box = { x: c.x - 16, y: rowY - 34, w: 32, h: 34 };
        if (overlap(p, box) && p.y + p.h < box.y + 18) {
          p.vy = -PHYS.stompV; R.chosen = c.k; R.phase = 'reveal'; R.pt = 0; Sound.play('stomp');
          if (c.k === R.prizeCup) { TourRooms.win(play, A, R, { text: 'RIGHT CUP!', coins: 6 }); }
          else { R.tries = (R.tries || 0) + 1; R.joke = D.joke[(R.tries - 1) % D.joke.length]; TourRoomKit.raspberry(play, 'NOPE!'); }
          break;
        }
      }
      return;
    }
    if (R.phase === 'reveal') {
      R.cups.forEach(c => { c.lift = approach(c.lift, c.k === R.chosen || (R.pt > 1.2 && c.k === R.prizeCup) ? 1 : 0, dt * 4); });
      if (R.pt > 2.6) { R.phase = 'idle'; R.pt = 0; R.joke = null; }
    }
  },
  draw(play, ctx, A, R, kit) {
    if (!R.cups) return;
    const D = kit.data, rowY = (D.row + 1) * TS, t = play.t;
    for (const c of R.cups) {
      const x = c.x, base = rowY - (c.hop || 0), lift = c.lift * 30;
      // what is under it
      if (c.lift > 0.05) {
        if (c.k === R.prizeCup) { ctx.save(); TourItemArt.glow(ctx, x, base - 12, t, '#fff2a0'); ctx.restore(); TourRoomArt.star(ctx, x, base - 12, 9); ctx.fillStyle = '#ffd84a'; TourRoomArt.star(ctx, x, base - 12, 7); }
        else if (c.k === R.chosen && R.joke) TourRoomCritters.joke(ctx, R.joke, x, base, t);
      }
      TourRoomCritters.cup(ctx, D.cup, x, base - lift, t, R.phase === 'pick');
    }
  }
});
// the dealer behind the table: a land's critter, drawn from its own art, friendly and still
class TourRoomDealer extends Ent {
  constructor(g, s) { super(g, s, 30, 40); this.back = true; this.look = s.look; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    if (this.look && TourRoomCritters.dealers[this.look]) { TourRoomCritters.dealers[this.look](ctx, x, y, t); return; }
    TourRoomCritters.draw(ctx, 'dealer', x, y + 2, 1.3, t);
  }
}
ENTITY_TYPES.roomDealer = TourRoomDealer;

/* ================= prank: a too-good-to-be-true chest ================= */
TourRooms.def('prank', {
  title: 'TREASURE ROOM!', rule: 'A GIANT TREASURE CHEST! TOTALLY REAL. GO ON, OPEN IT', need: 'OPEN THE BIG CHEST FIRST!',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 30 + K.eastW(keep, o);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o), mid = Math.floor((x0 + x1) / 2);
    // the chest on a dais under a spotlight, velvet ropes, a high shelf with the postcard
    g.hline(mid - 3, mid + 3, 10, '#');
    g.put(mid, 9, g.L(['spawn', 'roomChest', { gag: o.gag || 'glove', label: o.label || 'TREASURE' }]));
    g.winSpot(A.id, mid - 2, 9);
    g.hline(x0 + 2, x0 + 5, 6, '-'); g.put(x0 + 3, 4, '*'); g.coins(x0 + 2, x0 + 5, 5);
    g.dress(keep, [x0, mid - 6, mid + 6], Y);
    g.data.gag = o.gag || 'glove'; g.data.line = o.line || "OK, OK. HERE'S THE REAL ONE.";
    return g;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const ch = play.entities.find(e => e instanceof TourRoomChest);
    if (ch && ch.sprung && ch.sprungT > 1.6) TourRooms.win(play, A, R, { text: kit.data.line, coins: 5 });
  }
});
class TourRoomChest extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 44); this.x = s.x - TS; this.gag = s.gag || 'glove'; this.label = s.label || 'TREASURE'; this.sprung = false; this.sprungT = 0; this.back = true; }
  update(dt) { this.t += dt; if (this.sprung) this.sprungT += dt; }
  touchPlayer(p) {
    if (this.sprung || p.state !== 'play') return;
    this.sprung = true; this.sprungT = 0;
    const g = this.g;
    TourRoomCritters.gagStart(g, this, p);
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, open = this.sprung ? Math.min(1, this.sprungT * 5) : 0;
    // a spotlight
    if (!this.sprung) { ctx.save(); ctx.fillStyle = 'rgba(255,240,180,0.12)'; ctx.beginPath(); ctx.moveTo(x - 14, y - 300); ctx.lineTo(x + 14, y - 300); ctx.lineTo(x + 50, y); ctx.lineTo(x - 50, y); ctx.fill(); ctx.restore(); }
    Ink.around(ctx, x - 36, y - 70, 72, 72, c => {
      c.fillStyle = '#8a4a1a'; rr(c, x - 30, y - 30, 60, 30, 4); c.fill();
      c.fillStyle = '#ffd84a'; c.fillRect(x - 30, y - 24, 60, 4); c.fillRect(x - 4, y - 30, 8, 30);
      c.save(); c.translate(x - 30, y - 30); c.rotate(-open * 1.2);
      c.fillStyle = '#a85a22'; rr(c, 0, -16, 60, 16, 6); c.fill(); c.fillStyle = '#ffd84a'; c.fillRect(26, -16, 8, 16);
      c.restore();
    }, { pad: 6 });
    if (!this.sprung) { for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; ctx.fillStyle = '#fff8c0'; TourRoomArt.star(ctx, x + Math.cos(a) * 34, y - 40 + Math.sin(a * 1.3) * 10, 4); } }
    if (!this.sprung) { ctx.save(); ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd84a'; ctx.fillText(this.label, x, y - 50); ctx.restore(); }
    if (this.sprung) TourRoomCritters.gagDraw(ctx, this, x, y - 30, this.sprungT, t);
  }
}
ENTITY_TYPES.roomChest = TourRoomChest;

/* ================= closing: grab what you can before the shutters come down ================= */
TourRooms.def('closing', {
  title: 'CLOSING TIME!', rule: 'GRAB WHAT YOU CAN: THE SHUTTERS COME DOWN, TOP SHELF FIRST', timed: true,
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 32 + K.eastW(keep, o, false);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o, { cage: false });
    // the counter by the door (the keeper dozes behind it), then three tiers of shelves
    const c0 = x0 + 1;
    g.put(c0 + 1, Y, g.L(['spawn', 'roomKeeper', { look: o.keeper || null }]));
    const s0 = c0 + 5, s1 = x1 - 1;
    // tiers: the floor under the shelves, the low shelf (row 8), the high shelf (row 5) with the boxes and the postcard
    g.hline(s0, s1, 8, '-'); g.hline(s0 + 2, s1, 5, '-');
    const items = TourRoomKit.prize(o, keep);
    g.coins(s0, s1 - 1, 7); g.coins(s0 + 2, s1 - 2, 4); g.coins(s0 + 1, s1 - 2, Y);
    items.forEach((it, k) => g.box(s0 + 4 + k * 3, 2, it));
    g.put(s1 - 2, 1, '*');
    g.data.tiers = [{ y0: 9, y1: 10, x0: s0, x1: s1 }, { y0: 6, y1: 8, x0: s0, x1: s1 }, { y0: 1, y1: 5, x0: s0 + 2, x1: s1 }];
    g.data.t = o.t || 14; g.data.word = o.word || 'CLOSED!';
    g.dress(keep, [s0 - 1], Y);
    return g;
  },
  enter(play, A, R, kit) {
    // shelves closed on the last visit open again (what Brady took stays taken)
    for (const c of R.shut || []) { if (c.t === 'pick') play.setTile(c.x, c.y, T.PICK); else if (c.t === 'box') { play.setTile(c.x, c.y, T.QBLOCK); A.contents[c.x + ',' + c.y] = c.it; } else if (c.t === 'gold' && c.e) c.e.y = c.y0; }
    R.shut = []; R.closed = 0; R.phase = 'ready'; R.left = kit.data.t; R.sweepT = 0;
  },
  update(play, dt, A, R, kit) {
    const D = kit.data;
    if (R.phase === 'ready') { if (TourRoomKit.inside(play, A, R) || R.t > 1.2) R.phase = 'run'; return; }
    if (R.phase === 'run') {
      R.left -= dt;
      // top tier at half time, the middle at three quarters, the bottom at the end
      const want = R.left <= 0 ? 3 : R.left <= D.t * 0.25 ? 2 : R.left <= D.t * 0.5 ? 1 : 0;
      while (R.closed < want) this.shutTier(play, A, R, D.tiers[2 - R.closed]);
      if (R.left <= 0) { R.phase = 'sweep'; R.sweepT = 0; play.bannerText = D.word; play.bannerT = 1.5; Sound.play('bell', { vol: 0.6 }); }
      return;
    }
    if (R.phase === 'sweep') {
      R.sweepT += dt;
      // the keeper sweeps Brady out of the door (never a hit)
      const door = play.entities.find(e => e instanceof Portal && e.target && e.target.area !== A.idx);
      if (R.sweepT > 1.2 && door) { R.phase = 'out'; play.enterPortal(door); }
      else if (R.sweepT > 1.2) R.phase = 'out';
    }
  },
  shutTier(play, A, R, tier) {
    R.closed++;
    Sound.play('crumble', { vol: 0.5 });
    for (let y = tier.y0; y <= tier.y1; y++) for (let x = tier.x0; x <= tier.x1; x++) {
      const t = tileAt(A, x, y);
      if (t === T.PICK) { play.setTile(x, y, T.EMPTY); R.shut.push({ t: 'pick', x, y }); }
      else if (t === T.QBLOCK) { const it = A.contents[x + ',' + y]; play.setTile(x, y, T.USED); delete A.contents[x + ',' + y]; R.shut.push({ t: 'box', x, y, it }); }
    }
    for (const e of play.entities) if (e instanceof Gold && !e.remove && e.y >= tier.y0 * TS - TS && e.y < (tier.y1 + 1) * TS) { R.shut.push({ t: 'gold', e, y0: e.y }); e.y = -9999; }
    tier.at = play.t;
  },
  draw(play, ctx, A, R, kit) {
    const D = kit.data;
    for (let k = 0; k < 3; k++) {
      const tier = D.tiers[2 - k];
      if (k >= R.closed) continue;
      const x = tier.x0 * TS, w = (tier.x1 - tier.x0 + 1) * TS, y0 = tier.y0 * TS - 4, h = (tier.y1 - tier.y0 + 1) * TS + 4;
      const drop = clamp((play.t - (tier.at || 0)) / 0.5, 0, 1) * h;
      ctx.save(); ctx.fillStyle = '#8a8a96'; ctx.fillRect(x, y0, w, drop);
      ctx.fillStyle = '#a8a8b4'; for (let yy = y0 + 4; yy < y0 + drop; yy += 8) ctx.fillRect(x, yy, w, 3);
      ctx.fillStyle = '#4a4a56'; ctx.fillRect(x, y0 + drop - 4, w, 4);
      ctx.restore();
    }
    if (R.phase === 'run' || R.phase === 'ready') TourRooms.clock(play, ctx, Math.max(0, R.phase === 'ready' ? D.t : R.left), D.t);
  }
});
// the keeper behind the counter: asleep (z's) until closing time, then awake with a broom
class TourRoomKeeper extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, 48); this.x = s.x - TS / 2 - TS; this.back = true; this.look = s.look; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, A = this.g.area, R = A.roomState || {}, awake = R.phase === 'sweep' || R.phase === 'out';
    Ink.around(ctx, x - 50, y - 70, 100, 72, c => {
      // the counter
      c.fillStyle = '#9a6a3a'; c.fillRect(x - 46, y - 30, 92, 30); c.fillStyle = '#c8945a'; c.fillRect(x - 48, y - 34, 96, 6);
      // the keeper's head over it
      TourRoomCritters.draw(c, this.look || 'keeper', x - 6, y - 32, 1.2, t, false, !awake);
      if (awake) { c.strokeStyle = '#7a5a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 18, y - 70); c.lineTo(x + 30 + Math.sin(t * 12) * 8, y - 30); c.stroke(); c.fillStyle = '#e8c860'; c.fillRect(x + 22 + Math.sin(t * 12) * 8, y - 34, 18, 8); }
    }, { pad: 6 });
    if (!awake) { ctx.save(); ctx.font = `12px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.fillText('z', x + 8 + ph * 14, y - 66 - ph * 22); } ctx.restore(); }
    else { ctx.save(); ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd84a'; ctx.fillText((A.roomKit && A.roomKit.data.word) || 'CLOSED!', x, y - 80); ctx.restore(); }
  }
}
ENTITY_TYPES.roomKeeper = TourRoomKeeper;

/* tokens' own pickup: a quiet one (a sparkle and the count), not the key's toast */
{
  const K = ENTITY_TYPES.key, touch0 = K.prototype.touchPlayer;
  K.prototype.touchPlayer = function (p) {
    if (!(this.s && this.s.look && /^tok/.test(this.s.look)) || this.remove) return touch0.call(this, p);
    this.remove = true; this.g.keys.add(this.id);
    Sound.play('pick', { pitch: 1.4 }); this.g.burst(this.cx, this.cy, 12, '#ffd84a', 'confetti');
  };
}
