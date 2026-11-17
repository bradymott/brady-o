/* ============================================================
   World tour: secret-room kinds, part 2 (docs/design/SECRET_ROOMS.md §2): the rooms that are a place to get
   through. gauntlet (Gauntlet), climb (Chimney Climb), grotto (Flooded Grotto), lantern (Lantern Walk), doors
   (Door Maze), pick (Pick One), wormhole (Wormhole), bouncy (Bouncy Castle), floaty (Low Gravity).
   The prize sits where the challenge ends; the checker proves it (validate_levels' room needs).
   ============================================================ */

/* ================= gauntlet: a run of obstacle beats, the prize at the end ================= */
const TOUR_GAUNTLET_BEATS = {
  // a spike pit with a crumbling bridge over it
  crumble(g, x, Y) { g.fill(x + 1, Y, x + 6, Y, '^'); g.hline(x, x + 7, 7, 'C'); g.coins(x + 1, x + 6, 6); return x + 9; },
  // a moving platform over a spiked trench
  mover(g, x, Y) { g.fill(x + 2, Y + 1, x + 9, Y + 2, '.'); g.hline(x + 2, x + 9, Y + 2, '^'); g.mover(x + 2, Y, 3, 5, 0, 1.8); g.coins(x + 4, x + 7, 7); return x + 11; },
  // a low passage under ceiling spikes (no jumping!)
  ceiling(g, x, Y) { g.fill(x, 1, x + 7, 7, '#'); g.hline(x, x + 7, 8, 'v'); g.coins(x + 1, x + 6, Y); return x + 9; },
  // a high wall and the spring that clears it
  wall(g, x, Y) { g.put(x + 1, Y, 's'); g.fill(x + 3, 4, x + 4, Y, '#'); g.coins(x + 3, x + 4, 2); return x + 7; },
  // a conveyor that pushes back, a spike block at its far end to hop
  conveyor(g, x, Y) { g.hline(x, x + 7, Y + 1, '<'); g.put(x + 8, Y, '^'); g.coins(x + 2, x + 6, 7); return x + 10; },
  // falling platforms over a spiked trench
  fallers(g, x, Y) {
    g.fill(x + 1, Y + 1, x + 10, Y + 2, '.'); g.hline(x + 1, x + 10, Y + 2, '^');
    for (const k of [0, 3, 6]) { g.spawn(x + 3 + k, Y, 'fplat', { pw: 2 }); g.ghosts.push([x + 2 + k, Y + 1], [x + 3 + k, Y + 1]); }
    g.coins(x + 2, x + 9, 7); return x + 12;
  },
  // steps of spikes and one-way perches
  steps(g, x, Y) { g.fill(x, Y, x + 8, Y, '^'); g.hline(x + 1, x + 2, 8, '-'); g.hline(x + 4, x + 5, 6, '-'); g.hline(x + 7, x + 8, 8, '-'); g.coins(x + 4, x + 5, 4); return x + 10; },
  // a stretch with the level's critters on it
  critters(g, x, Y, o, ctx) { const pool = ((ctx.spec && ctx.spec.enemies) || []).map(e => Array.isArray(e) ? e[0] : e).filter(t => !Tour.enemyInfo[t] || Tour.enemyInfo[t].place === 'walk'); if (pool[0]) { g.enemy(x + 3, Y, pool[0]); g.enemy(x + 7, Y, pool[1] || pool[0]); } g.hline(x + 4, x + 6, 7, '-'); g.coins(x + 4, x + 6, 6); return x + 10; }
};
const TOUR_GAUNTLET_W = { crumble: 9, mover: 11, ceiling: 9, wall: 7, conveyor: 10, fallers: 12, steps: 10, critters: 10 };
TourRooms.def('gauntlet', {
  title: 'GAUNTLET!', rule: 'RUN IT TO THE END: THE PRIZE WAITS AT THE FINISH',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, beats = o.beats || ['crumble', 'ceiling', 'mover'];
    const W = 8 + beats.reduce((s, b) => s + TOUR_GAUNTLET_W[b], 0) + 12 + K.eastW(keep, o, false);
    const g = K.room(W), Y = K.Y;
    let x = Math.max(g.west(keep), 6);
    const starts = [];
    for (const b of beats) { starts.push(x); x = TOUR_GAUNTLET_BEATS[b](g, x, Y, o, ctx); }
    // the finish: a flag, the prize boxes over a podium, the way straight back out
    const fx = x + 1;
    g.put(fx, Y, g.L(['spawn', 'roomFlag', {}]));
    const items = K.prize(o, keep);
    g.hline(fx + 1, fx + 2, 8, '-');
    items.forEach((it, k) => g.box(fx + 4 + k * 2, 6, it));
    if (keep.door) { g.door(fx + 5 + items.length * 2, Y, keep.door); g.need('the door at the finish', fx + 5 + items.length * 2, Y); }
    g.need('the finish', fx, Y);
    // the postcard over the podium's perch
    g.put(fx + 2, 4, '*');
    K.east(g, keep, A, o, { cage: false });
    g.data.finish = fx;
    return g;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (play.player.cx > kit.data.finish * TS && play.player.onGround) TourRooms.win(play, A, R, { text: 'MADE IT!', coins: 4 });
  }
});
// the finish flag (a checkered pennant on a pole)
class TourRoomFlag extends Ent {
  constructor(g, s) { super(g, s, 20, 90); this.back = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    Ink.around(ctx, x - 6, y - 92, 40, 94, c => {
      c.fillStyle = '#e8e0d0'; c.fillRect(x - 2, y - 90, 4, 90);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { c.fillStyle = (i + j) % 2 ? '#1c1426' : '#ffffff'; const wv = Math.sin(t * 6 + i * 0.8) * 2; c.fillRect(x + 2 + i * 7, y - 88 + j * 7 + wv, 7, 7); }
    }, { pad: 4 });
  }
}
ENTITY_TYPES.roomFlag = TourRoomFlag;

/* ================= climb: a tall shaft to the prize at the top ================= */
TourRooms.def('climb', {
  title: 'CHIMNEY CLIMB!', rule: 'UP, UP, UP: THE PRIZE IS AT THE TOP',
  make(o, keep, ctx, A, rng) {
    const H = o.H || 36, F = H - 3, W = 22;
    const g = new RoomGrid(W, H, F), Y = F - 1;
    const x0 = g.west(keep);
    const style = o.style || ['plain', 'crumble', 'spikes'][Math.floor(rng() * 3)];
    // the top room: a floor with a one-way hatch in it, the prize boxes, the gate (if the old room had one)
    const top = 6;
    g.hline(1, W - 2, top, '#'); g.hline(8, 12, top, '-');
    const items = TourRoomKit.prize(o, keep);
    items.forEach((it, k) => g.box(3 + k * 2, top - 3, it));
    g.need('the top', 10, top - 1);
    const needGate = keep.extras.some(e => e[0] === 'spawn' && e[1] === 'gate');
    if (keep.gate || needGate) { const k2 = Object.assign({}, keep, { fake: false }); g.gateWing(k2, W - 5, top - 1); }
    g.coins(14, 16, 3);
    // the ledges, side to side, three rows apart
    let left = true, n = 0;
    for (let y = F - 3; y > top + 1; y -= 3, n++) {
      const a = left ? 1 : 11, b = left ? 10 : W - 2;
      const ch = style === 'crumble' && n % 3 === 2 ? 'C' : '-';
      g.hline(a, b, y, ch);
      if (style === 'spikes' && n % 2 === 1) g.put(left ? 1 : W - 2, y - 1, '^');
      if (n % 2 === 0) g.coins(left ? 2 : 13, left ? 5 : 16, y - 2);
      left = !left;
    }
    // a spring on the floor for a big first leap; the postcard out on a ledge end
    g.put(W - 4, Y, 's');
    g.put(left ? 3 : W - 4, Math.floor(H / 2) - 2, '*');
    g.dress(keep, [x0 + 1, W - 7], Y);
    return g;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (play.player.y + play.player.h <= 6 * TS + 2 && play.player.onGround) TourRooms.win(play, A, R, { text: 'TOP OF THE CHIMNEY!', coins: 6 });
  }
});

/* ================= grotto: a flooded room ================= */
TourRooms.def('grotto', {
  title: 'FLOODED GROTTO!', rule: 'HOLD YOUR BREATH... JUST KIDDING. SWIM TO THE BACK',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, half = o.half != null ? o.half : rng() < 0.5;
    const W = 34 + K.eastW(keep, o, false);
    const g = K.room(W), Y = K.Y;
    if (half) g.area = { waterLine: 5 }; else g.area = { water: true };
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o, { cage: false });
    // rock fingers from the floor and the roof make a winding channel; spikes on two of the floor stretches
    const span = x1 - x0, at = f => x0 + Math.round(span * f);
    g.fill(at(0.2), 6, at(0.2) + 1, 10, '#'); g.fill(at(0.4), 1, at(0.4) + 1, 6, '#'); g.fill(at(0.62), 5, at(0.62) + 1, 10, '#');
    g.hline(at(0.28), at(0.36), 10, '^'); g.hline(at(0.7), at(0.78), 10, '^');
    g.coins(at(0.24), at(0.38), 3); g.coins(at(0.44), at(0.58), 8); g.coins(at(0.66), at(0.8), 3);
    // the prize in the back pocket, on a ledge
    const items = K.prize(o, keep);
    g.hline(at(0.84), x1, 7, '#');
    items.forEach((it, k) => g.box(at(0.86) + k * 2, half ? 3 : 4, it));
    g.put(at(0.48), half ? 2 : 2, '*');
    const swim = ((ctx.spec && ctx.spec.enemies) || []).map(e => Array.isArray(e) ? e[0] : e).filter(t => Tour.enemyInfo[t] && Tour.enemyInfo[t].place === 'swim');
    if (swim.length && !half) { g.enemy(at(0.5), 8, swim[0]); if (swim[1]) g.enemy(at(0.75), 4, swim[1]); }
    g.dress(keep, [x0 + 1, at(0.5)], Y);
    g.need('the back pocket', at(0.88), 6);
    return g;
  }
});

/* ================= lantern: Brady's light fades; stones show only in the light ================= */
TourRooms.def('lantern', {
  title: 'LANTERN WALK!', rule: 'YOUR LIGHT FADES: STAND BY A LANTERN TO RELIGHT IT. THE STEPPING STONES SHOW ONLY IN THE LIGHT',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 40 + K.eastW(keep, o, false);
    const g = K.room(W), Y = K.Y;
    g.area = { lamp: { decay: o.decay || 9, r0: 170, r1: 46 } };
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o, { cage: false });
    const stone = g.L(['tile', 'GROUND', { hide: 3 }]);
    // a spike floor from the start ledge to the far side, a lantern island halfway
    const a = x0 + 2, b = x1 - 6, mid = Math.floor((a + b) / 2);
    g.hline(a, b, Y, '^');
    g.fill(mid - 1, 8, mid + 2, Y, '#'); g.put(mid, 7, g.L(['spawn', 'lampPost', { look: o.post || null }]));
    g.put(x0, Y, g.L(['spawn', 'lampPost', { look: o.post || null }]));
    const path = (from, to, y0, dy) => { let y = y0; for (let x = from; x <= to; x += 3) { g.put(x, y, stone); g.put(x + 1, y, stone); y += dy; dy = -dy; } };
    path(a + 1, mid - 3, 8, -1);
    path(mid + 4, b - 1, 8, 1);
    // a high branch to the postcard
    g.put(mid - 5, 4, stone); g.put(mid - 4, 4, stone); g.put(mid - 4, 2, '*');
    g.coins(mid - 1, mid + 2, 5);
    const items = K.prize(o, keep);
    g.fill(b + 1, Y, x1, Y, '.');
    items.forEach((it, k) => g.box(b + 2 + k * 2, 6, it));
    g.need('the far side', b + 2, Y);
    return g;
  },
  enter(play, A) { play.lampLit = play.t; }
});

/* ================= doors: closets and lofts joined by doors ================= */
TourRooms.def('doors', {
  title: 'DOOR MAZE!', rule: 'WHICH DOOR GOES WHERE? THE PRIZE IS IN ONE OF THESE CUPBOARDS',
  make(o, keep, ctx, A, rng) {
    const W = 38;
    const g = new RoomGrid(W, 14, 11), aid = A.id;
    // two storeys (rows 1-4 and 7-10) of four closets each
    g.fill(1, 5, W - 2, 6, '#');
    for (const wx of [9, 18, 27]) g.vline(wx, 1, 10, '#');
    const cl = []; for (const [y, sy] of [[10, 0], [4, 1]]) for (const [a, b] of [[1, 8], [10, 17], [19, 26], [28, W - 2]]) cl.push({ a, b, y, up: sy, doors: [] });
    // roles: 0 the entrance (lower left), then a chain to the prize and dead ends off it
    const order = [1, 2, 3, 4, 5, 6, 7]; for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
    const [c1, c2, c3, prize, coins, card, joke] = order.map(k => cl[k]);
    const links = [[cl[0], c1], [c1, c2], [c2, c3], [c3, prize], [cl[0], coins], [c1, card], [c2, joke]];
    g.put(2, 10, '@'); if (keep.door) g.door(3, 10, keep.door);
    cl[0].slots = [5, 7];
    const look = o.look || 'tourDoor';
    let n = 0;
    const slot = c => { const L = c.slots || (c.slots = [c.a + 1, c.a + 3, c.a + 5]); return L.length ? L.shift() : null; };
    for (const [p, q] of links) {
      const xp = slot(p), xq = slot(q); if (xp == null || xq == null) continue;
      const ip = n++, iq = n++;
      g.door(xp, p.y, { to: aid + '@d' + iq, look }); g.anchor(xp + 1, p.y, 'd' + ip);
      g.door(xq, q.y, { to: aid + '@d' + ip, look }); g.anchor(xq + 1, q.y, 'd' + iq);
    }
    // what is in them
    const items = TourRoomKit.prize(o, keep), free = c => { for (let x = c.b; x >= c.a; x--) if (g.get(x, c.y) === '.') return x; return c.b; };
    items.forEach((it, k) => g.box(free(prize) - k * 2, prize.y - 2, it));
    g.need('the prize cupboard', free(prize), prize.y);
    g.coins(coins.a + 1, coins.b - 1, coins.y - 2);
    g.put(free(card), card.y - 2, '*');
    g.put(free(joke), joke.y, g.L(['spawn', 'sign', { text: o.joke || 'BROOM CUPBOARD. NOTHING TO SEE HERE. (ONE COIN, MAYBE.)' }])); g.put(joke.a + 2, joke.y - 1, 'o');
    // the gate (if the old room had one) in the coin closet, the dressing round the entrance
    const needGate = keep.extras.some(e => e[0] === 'spawn' && e[1] === 'gate');
    if (keep.gate || needGate) { const gx = free(coins); if (keep.gate) g.put(gx, coins.y, 'g'); if (needGate) g.put(gx - 2, coins.y, g.L(keep.extras.find(e => e[0] === 'spawn' && e[1] === 'gate'))); }
    // the old room's signs, bottles and drafts: in the coin closet too
    // (in a closet of the lower storey: a bottle's piece lays floor under itself, which would fill a lower closet)
    for (const e of keep.extras) {
      if (e[0] === 'spawn' && (e[1] === 'gate' || e[1] === 'tourDraft')) continue;
      let done = false;
      for (const c of cl.slice(1, 4)) { for (let x = c.a; x + 2 <= c.b && !done; x++) if ([0, 1, 2].every(d => g.get(x + d, c.y) === '.' && g.get(x + d, c.y - 1) === '.')) { g.put(x, c.y, g.L(e)); g.put(x + 1, c.y, '.'); done = true; } if (done) break; }
    }
    g.dress(keep, [7, 8], 10);
    g.data.prize = [prize.a, prize.b, prize.y];
    return g;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const [a, b, y] = kit.data.prize, p = play.player, tx = Math.floor(p.cx / TS), ty = Math.floor((p.y + p.h - 1) / TS);
    if (tx >= a && tx <= b && ty === y && p.state === 'play') TourRooms.win(play, A, R, { text: 'FOUND IT!', coins: 3 });
  }
});

/* ================= pick: three boxes, take one ================= */
TourRooms.def('pick', {
  title: 'PICK ONE!', rule: 'THREE BOXES, THREE PRIZES. YOU ONLY GET ONE',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 30 + K.eastW(keep, o, false);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o, { cage: false }), mid = Math.floor((x0 + x1) / 2);
    const main0 = K.prize(o, keep)[0], main = main0 === 'pick' || main0 === 'picks' ? 'oneup' : main0;
    const pool = (o.choices || ['power', 'star', 'oneup', 'magnet', 'sundial']).filter(it => it !== main);
    const choices = [main, pool[0], pool[1]];
    for (let k = 2; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [choices[k], choices[j]] = [choices[j], choices[k]]; }
    const xs = [mid - 5, mid, mid + 5];
    xs.forEach((x, k) => { g.fill(x, 9, x + 1, Y, '#'); g.box(x, 5, choices[k]); g.put(x + 1, 5, '.'); });
    g.data.boxes = xs.map((x, k) => ({ x, y: 5, it: choices[k] }));
    // the old room's other boxes (5-2 had one, 2-6 two): on a shelf by the door
    K.prize(o, keep).slice(1).filter(it => it !== 'picks').forEach((it, k) => { g.box(x0 + 1 + k * 2, 6, it); });
    g.put(mid, 1, '*'); g.coins(mid - 7, mid - 6, 8); g.coins(mid + 7, mid + 8, 8);
    g.dress(keep, [x0, x1 - 1], Y);
    return g;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const B = kit.data.boxes, taken = B.find(b => tileAt(A, b.x, b.y) === T.USED);
    if (!taken) return;
    for (const b of B) if (b !== taken && tileAt(A, b.x, b.y) === T.QBLOCK) { play.setTile(b.x, b.y, T.USED); delete A.contents[b.x + ',' + b.y]; play.burst(b.x * TS + TS / 2, b.y * TS + TS / 2, 16, '#ffffff', 'dust'); }
    R.won = true; R.choice = taken.it; Sound.play('select');
  },
  draw(play, ctx, A, R, kit) {
    // a picture of what is in each box, over it
    for (const b of kit.data.boxes) {
      if (tileAt(A, b.x, b.y) !== T.QBLOCK) continue;
      const x = b.x * TS + TS / 2, y = b.y * TS - 18 + Math.sin(play.t * 2 + b.x) * 2;
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x, y - 6, 15, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.translate(x, y + 5); ctx.scale(0.62, 0.62);
      const kind = b.it === 'power' ? 'mushroom' : b.it === 'eclipse' ? 'star' : b.it;
      try { TourItemArt.draw(ctx, kind, 0, 0, play.t, play); } catch (e) { /* an item without art */ }
      ctx.restore();
    }
  }
});

/* ================= wormhole: a floaty room with a Wormhole that shoots Brady ahead ================= */
TourRooms.def('wormhole', {
  title: 'WORMHOLE!', rule: 'HOP IN THE WORMHOLE (UP) AND IT SHOOTS YOU FAR AHEAD',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 30 + K.eastW(keep, o, false);
    const g = K.room(W), Y = K.Y;
    g.area = { gravity: 0.6 };
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o, { cage: false }), mid = Math.floor((x0 + x1) / 2);
    // a ring of coins round the middle, the Wormhole on a plinth at the far end, the prize up on two perches
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, x = Math.round(mid + Math.cos(a) * 4), y = Math.round(6 + Math.sin(a) * 3); if (g.get(x, y) === '.') g.put(x, y, 'o'); }
    g.fill(x1 - 3, 9, x1, Y, '#');
    if (o.to) { g.door(x1 - 1, 8, { to: o.to, look: 'roomWormhole' }); g.need('the wormhole', x1 - 1, 8); }
    const items = K.prize(o, keep);
    g.hline(x0 + 2, x0 + 4, 4, '-'); items.forEach((it, k) => g.box(x0 + 3 + k * 2, 1, it));
    g.hline(mid - 1, mid + 1, 2, '-'); g.put(mid, 1, '*');
    g.dress(keep, [x0, mid + 6], Y);
    return g;
  },
  update(play, dt, A, R, kit) {
    // going through the Wormhole: a WHOOSH on the far side (TourRooms' areaLoaded hook shows it)
    const w = play.entities.find(e => e instanceof Portal && e.s && e.s.look === 'roomWormhole');
    if (w && overlap(play.player, w) && (Input.upPressed || Input.up)) play.roomWarpT = 1;
  }
});
TourHooks.on('areaLoaded', play => { if (play.roomWarpT > 0) { play.roomWarpT = 0; play.bannerText = 'WHOOSH!'; play.bannerT = 1.4; Sound.play('portal'); const p = play.player; play.burst(p.cx, p.cy, 30, '#b89aff', 'confetti'); } });

/* ================= bouncy: an inflatable room ================= */
TourRooms.def('bouncy', {
  title: 'BOUNCY CASTLE!', rule: 'THE FLOOR BOUNCES! ONLY THE TOWERS ARE FIRM. THE PRIZE IS ON THE TALLEST',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 32 + K.eastW(keep, o, false);
    const g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o, { cage: false });
    const a = x0 + 1, b = x1 - 1;
    g.hline(a, b, Y + 1, 'b');
    // the towers: [offset, height]
    const span = b - a, gap = 2, tw = [3, 5, 7, 5, 3];
    const tops = tw.map((h, k) => { const x = a + 1 + k * (3 + gap); g.fill(x, Y - h + 1, x + 2, Y, '#'); return [x, Y - h + 1]; });
    // the prize over the tallest, coins in arcs over the trampoline, a spring for the checker's sake
    const [tx, ty] = tops[2];
    const items = K.prize(o, keep); items.forEach((it, k) => g.box(tx + 1 + k, ty - 3, it));
    for (let k = 0; k < 4; k++) g.coinsArc(tops[k][0] + 3, tops[k + 1][0] - 1, Math.min(tops[k][1], tops[k + 1][1]) - 2, 1);
    g.put(tops[4][0] + 1, tops[4][1] - 3, '*');
    g.put(tops[4][0] + 4, Y, 's');
    g.need('the tallest tower', tx, ty - 1);
    g.data.towers = tops; g.data.span = [a, b]; g.data.skin = o.skin || ['#ff6a8a', '#ffd84a', '#5ac8ff'];
    return g;
  },
  draw(play, ctx, A, R, kit) {
    // the inflatable: fat striped cushions over the towers' tops, a soft lip along the floor
    const D = kit.data, cols = D.skin, t = play.t;
    D.towers.forEach(([x, y], k) => {
      const px = x * TS, py = y * TS, w = 3 * TS, h = (11 - y) * TS, col = cols[k % cols.length], wob = Math.sin(t * 3 + k) * 1.5;
      ctx.save();
      // a fat inflatable column: soft sides, light stripes, a puffy cap with a pennant
      ctx.fillStyle = col; rr(ctx, px - 3, py + 4, w + 6, h - 4, 10); ctx.fill(); ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; for (let j = 0; j < 3; j++) rr(ctx, px + 8 + j * 28, py + 12, 9, h - 20, 4), ctx.fill();
      ctx.fillStyle = cols[(k + 1) % cols.length]; rr(ctx, px - 6, py - 6 + wob, w + 12, 16, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; rr(ctx, px + 2, py - 3 + wob, w - 4, 4, 2); ctx.fill();
      ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + w / 2, py - 6 + wob); ctx.lineTo(px + w / 2, py - 30); ctx.stroke();
      ctx.fillStyle = cols[(k + 2) % cols.length]; ctx.beginPath(); ctx.moveTo(px + w / 2, py - 30); ctx.lineTo(px + w / 2 + 16 + Math.sin(t * 5 + k) * 3, py - 25); ctx.lineTo(px + w / 2, py - 20); ctx.fill(); ctx.stroke();
      ctx.restore();
    });
    const [a, b] = D.span, yy = (10 + 1) * TS;
    ctx.save();
    for (let x = a; x <= b; x++) { ctx.fillStyle = cols[x % cols.length]; const s = Math.sin(t * 5 + x * 0.7) * 2; rr(ctx, x * TS, yy - 3 + s, TS, 10, 5); ctx.fill(); }
    ctx.restore();
  }
});

/* ================= floaty: someone left the gravity off ================= */
TourRooms.def('floaty', {
  title: 'LOW GRAVITY!', rule: 'SOMEBODY LEFT THE GRAVITY OFF. BIG FLOATY JUMPS!',
  make(o, keep, ctx, A, rng) {
    const K = TourRoomKit, W = 32 + K.eastW(keep, o, false);
    const g = K.room(W), Y = K.Y;
    g.area = { gravity: o.gravity || 0.45 };
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o, { cage: false }), mid = Math.floor((x0 + x1) / 2);
    // a constellation of coins (a star), rafters up top with the prize, a few floating perches
    const pts = [];
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.6 : 3.6; pts.push([Math.round(mid + Math.cos(a) * r * 1.4), Math.round(6 + Math.sin(a) * r)]); }
    for (let k = 0; k < pts.length; k++) { const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length]; const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)); for (let j = 0; j < n; j += 2) { const x = Math.round(ax + (bx - ax) * j / n), y = Math.round(ay + (by - ay) * j / n); if (g.get(x, y) === '.') g.put(x, y, 'o'); } }
    g.hline(x0 + 1, x0 + 4, 7, '-'); g.hline(x1 - 4, x1 - 1, 6, '-');
    g.hline(x1 - 7, x1 - 1, 4, '-');
    const items = K.prize(o, keep); items.forEach((it, k) => g.box(x1 - 6 + k * 2, 1, it));
    g.put(x0 + 2, 2, '*');
    g.dress(keep, [x0, mid + 4], Y);
    g.need('the rafters', x1 - 4, 1);
    return g;
  },
  draw(play, ctx) {
    // drifting motes, so the room reads as floaty even standing still
    ctx.save(); ctx.fillStyle = 'rgba(232,240,255,0.7)';
    for (let k = 0; k < 18; k++) { const ph = (play.t * 0.08 + k * 0.137) % 1, x = play.camX + ((k * 97) % 100) / 100 * Game.viewW + Math.sin(play.t + k) * 8, y = play.camY + Game.viewH * (1 - ph); ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.8; ctx.beginPath(); ctx.arc(x, y, 1.5 + (k % 3), 0, TAU); ctx.fill(); }
    ctx.restore();
  }
});
