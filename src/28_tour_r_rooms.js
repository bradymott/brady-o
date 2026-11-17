/* ============================================================
   World tour: the secret-room kit (docs/design/SECRET_ROOMS.md).
   A secret room's spec picks a kind and its options:
     { id: 'despensa', gen: 'room', role: 'secret', stamp: 'despensa', room: 'fetch', fetch: { title, ... } }
   The kind (src/28_tour_ra_kinds.js) builds a new room stamp from scratch, keeping what the old room carried for
   the level: its door back, its postcard spot, its secret gate (and fake wall), Bottle Mail, signs, its decor and
   its prize boxes (which become the room's reward). The checker sees everything as open tiles plus locks and
   virtual keys (a cage that a won game opens is a lock whose key is a spot in the room), so every room is proven
   finishable and escapable by tools/validate_levels.js; the games themselves run here, on TourHooks.
   Runtime: A.roomKit (built, shared) and A.roomState (per visit, on the runtime area).
   ============================================================ */
const TourRooms = {
  kinds: {},
  // stamp letters free for a room's own legend (the global legend's letters are never used)
  LETTERS: 'adefijklmnpqrtuwxzAEJKMNOPRUVXYZ0123456789!$%&+=:;,~_()[]{}<>',
  def(name, K) {
    this.kinds[name] = K;
    TourHooks.room(name, { spec: (A, ctx) => this.spec(name, A, ctx), build: (ctx, A, built) => this.build(name, ctx, A, built), timed: !!K.timed });
    if (TourHooks.ROOM_TYPES.indexOf(name) < 0) TourHooks.ROOM_TYPES.push(name);
    return K;
  },
  /* what an old room carried that the level relies on */
  keep(S, A) {
    const rows = (S && S.rows) || [], legend = (S && S.legend) || {}, txt = rows.join('');
    const items = [], hidden = [];
    let qi = 0, hi = 0;
    for (const ch of txt) { if (ch === '?') items.push((S.items || [])[qi++] || 'pick'); else if (ch === 'h') hidden.push((S.hidden || [])[hi++] || 'pick'); }
    const decor = [], extras = [];
    for (const ch in legend) {
      if (txt.indexOf(ch) < 0) continue;
      const e = legend[ch];
      if (e[0] === 'decor') decor.push(e[1]); else extras.push(e);
    }
    return {
      door: txt.indexOf('D') >= 0 ? ((S.doors || [])[0] || null) : null,
      gold: txt.indexOf('*') >= 0 ? ((S.gold && S.gold['*']) || 'hidden') : null,
      gate: txt.indexOf('g') >= 0, fake: txt.indexOf('F') >= 0,
      prize: items.concat(hidden), decor, extras, theme: A.theme || null
    };
  },
  // a deterministic random stream per room (the validator and the game must build the same room)
  rng(ctx, A) { return mulberry32(hashStr('room:' + ctx.id + ':' + A.id)); },
  spec(name, A, ctx) {
    const K = this.kinds[name];
    const S = TourStamp.get(A.stamp, ctx.C.id);
    if (!S) { ctx.problems.push(`area ${A.id}: room kind ${name} needs the room's old stamp '${A.stamp}'`); return A; }
    const keep = this.keep(S, A), o = Object.assign({}, K.defaults || {}, A[name] || {});
    const grid = K.make(o, keep, ctx, A, this.rng(ctx, A));
    const out = grid.finish(keep);
    const A2 = Object.assign({}, A, grid.area || {}, { gen: 'room', stamp: out.stamp, __room: { name, o, grid, keep } });
    return A2;
  },
  build(name, ctx, A, built) {
    const R = A.__room; if (!R) return;
    const B = built.B, area = built.area, aid = A.id, K = this.kinds[name];
    // the cage: the lock with this room's id draws and opens as a cage
    for (const s of B.spawns) if (s.type === 'lock' && s.id === 'room:' + aid) { s.type = 'roomCage'; s.need = R.o.need || K.need || null; }
    for (const gh of R.grid.ghosts) B.ghosts.push(gh);
    for (const z of R.grid.zones) B.zone(...z);
    const kit = { kind: name, aid, title: R.o.title || K.title || 'SECRET ROOM', rule: R.o.rule || K.rule || '', o: R.o, d: ctx.d, data: R.grid.data, keep: { gate: R.keep.gate, prize: R.keep.prize } };
    area.roomKit = kit;
    // what the checker must reach in this room (tools/validate_levels.js): the prize boxes from below, the room's
    // tokens, lamps and switches; the boxes' bump spots are added from the built tiles
    const needs = (R.grid.needs || []).slice();
    for (const key in area.contents) {
      const [x, y] = key.split(',').map(Number), t = area.tiles[y * area.W + x];
      if (t === T.QBLOCK || t === T.HIDDEN || t === T.QBRICK) needs.push({ what: 'box ' + area.contents[key] + ' at ' + x + ',' + y, x: x * TS + 4, y: (y + 1) * TS, w: TS - 8, h: TS });
    }
    area.roomNeeds = needs;
    if (K.build) K.build(ctx, A, built, R.o, R.grid);
  },
  /* ---------- the checker side (tools/validate_levels.js) ----------
     every room's needs are probes in one search per level: returns a list of failures */
  check(level, Validator) {
    const probes = [];
    level.areas.forEach((a, ai) => { for (const n of a.roomNeeds || []) probes.push(Object.assign({ ai, hit: false }, n, { x: n.x, y: n.y, w: n.w, h: n.h })); });
    if (!probes.length) return [];
    Validator.run(level, { probes, untilProbes: () => probes.every(q => q.hit), rules: 'all' });
    return probes.filter(q => !q.hit).map(q => `ROOM ${level.areas[q.ai].aid}: ${q.what} UNREACHABLE`);
  },

  /* ---------- run time ---------- */
  state(play, A) { return A.roomState || (A.roomState = { won: false, visits: 0 }); },
  enter(play, A) {
    const K = this.kinds[A.roomKit.kind], R = this.state(play, A), kit = A.roomKit;
    R.visits++; R.t = 0; R.inT = 0;
    play.bannerText = kit.title; play.bannerT = R.visits > 1 ? 1.2 : 2;
    if (kit.rule && !R.won) play.toast(kit.rule);
    if (K.enter) K.enter(play, A, R, kit);
  },
  update(play, dt) {
    const A = play.area, kit = A.roomKit; if (!kit) return;
    const K = this.kinds[kit.kind], R = this.state(play, A);
    R.t += dt;
    if (play.state !== 'play') return;
    if (K.update) K.update(play, dt, A, R, kit);
  },
  draw(play, ctx) {
    const A = play.area, kit = A && A.roomKit; if (!kit) return;
    const K = this.kinds[kit.kind], R = this.state(play, A);
    if (K.draw) K.draw(play, ctx, A, R, kit);
  },
  // the room is won: its cage opens, a fanfare, an optional coin shower
  win(play, A, R, opts) {
    if (R.won) return;
    opts = opts || {};
    R.won = true; R.wonT = R.t;
    play.keys.add('room:' + A.roomKit.aid);
    const p = play.player;
    Sound.play('secret', { vol: 0.8 }); Sound.play('oneup', { vol: 0.5 });
    play.burst(p.cx, p.y - 10, 30, '#ffd84a', 'confetti');
    if (opts.text !== false) { play.bannerText = opts.text || 'YOU DID IT!'; play.bannerT = 1.6; }
    if (opts.coins) this.coinShower(play, A, opts.coins);
    this.unbar(play, A, R);
  },
  // coins rain from the ceiling over Brady (picked up where they land, like any coin)
  coinShower(play, A, n) {
    const p = play.player, tx0 = Math.floor(p.cx / TS);
    let placed = 0;
    for (let k = 0; k < 40 && placed < n; k++) {
      const tx = clamp(tx0 + ((k % 2) ? 1 : -1) * Math.ceil(k / 2), 1, A.W - 2);
      for (let ty = A.H - 2; ty > 1; ty--) {
        if (tileAt(A, tx, ty) === T.EMPTY && SOLID[tileAt(A, tx, ty + 1)]) { play.setTile(tx, ty, T.PICK); play.burst(tx * TS + TS / 2, ty * TS, 4, '#ffd84a', 'spark'); placed++; break; }
      }
    }
  },
  // the room's way(s) out: bar them for a fight (the target is put back on unbar, on a win or a timeout)
  bar(play, A, R) {
    if (R.bars) return;
    R.bars = [];
    for (const e of play.entities) if (e instanceof Portal && e.target && e.target.area !== A.idx) { R.bars.push({ e, target: e.target }); e.target = null; e.barred = true; }
    if (R.bars.length) Sound.play('break', { vol: 0.6 });
  },
  unbar(play, A, R) {
    if (!R.bars) return;
    for (const b of R.bars) { b.e.target = b.target; b.e.barred = false; }
    R.bars = null;
  },
  // big text in the middle-top of the view, in world coordinates (afterEntities runs in the world transform)
  hudText(play, ctx, str, col, size, dy) {
    const x = play.camX + Game.viewW / 2, y = play.camY + (dy || 34);
    ctx.save(); ctx.font = `${size || 16}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(str).width + 22, h = (size || 16) + 12;
    ctx.fillStyle = 'rgba(14,8,26,0.72)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,216,74,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = col || '#ffd84a'; ctx.fillText(str, x, y + 1);
    ctx.restore();
  },
  // a round clock face with a sweeping hand and the seconds left
  clock(play, ctx, left, total, col) {
    const x = play.camX + Game.viewW / 2, y = play.camY + 36, r = 17, k = clamp(left / total, 0, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(14,8,26,0.78)'; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, TAU); ctx.fill();
    ctx.fillStyle = left < 4 && Math.floor(left * 4) % 2 ? '#ff6a5a' : (col || '#ffd84a');
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.font = `13px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1c1426'; ctx.fillText(String(Math.ceil(left)), x + 1, y + 2); ctx.fillStyle = '#ffffff'; ctx.fillText(String(Math.ceil(left)), x, y + 1);
    ctx.restore();
  },
  // a counter pill under the clock: "3 / 8" with an icon painter
  counter(play, ctx, n, of, icon, dx) {
    const x = play.camX + Game.viewW / 2 + (dx || 0), y = play.camY + 72;
    ctx.save(); ctx.font = `13px ${FONT_DISPLAY}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const str = n + ' / ' + of, w = ctx.measureText(str).width + 40;
    ctx.fillStyle = 'rgba(14,8,26,0.72)'; rr(ctx, x - w / 2, y - 12, w, 24, 12); ctx.fill();
    if (icon) { ctx.save(); ctx.translate(x - w / 2 + 14, y); ctx.scale(0.5, 0.5); icon(ctx, 0, 0, play.t); ctx.restore(); }
    ctx.fillStyle = n >= of ? '#7aff9a' : '#ffffff'; ctx.fillText(str, x - w / 2 + 28, y + 1);
    ctx.restore();
  },
  // spawn an entity at run time into the room (enemies of an ambush, a joke prop)
  add(play, type, tx, ty, props) {
    const C = ENTITY_TYPES[type];
    if (!C) return null;
    const s = Object.assign({ type, x: tx * TS + TS / 2, y: (ty + 1) * TS, dir: -1 }, props || {});
    let e = null;
    try { e = new C(play, s); } catch (err) { console.warn('room spawn failed', type, err); return null; }
    play.entities.push(e); play.refreshPlatforms();
    return e;
  }
};

/* ---------- a room drawn as rows of letters ----------
   new RoomGrid(W, H, floor): solid all round, open inside above `floor` (the ground's top row).
   Letters are the stamp's: the global legend ('#', '-', '^', 'o', '?', 'D', '@', 'g', ...) plus legend entries the
   grid gives letters to (grid.L(entry)). Prize boxes and doors are written with their contents and targets
   (box(), door()); finish() orders items[] and doors[] the way TourStamp.place reads them. */
class RoomGrid {
  constructor(W, H, floor) {
    this.W = W; this.H = H; this.F = floor;
    this.g = []; for (let y = 0; y < H; y++) this.g.push(new Array(W).fill('#'));
    this.fill(1, 1, W - 2, floor - 1, '.');
    this.legend = {}; this.byEntry = {}; this.next = 0;
    this.boxes = {}; this.doorsAt = {}; this.ghosts = []; this.zones = []; this.needs = []; this.data = {}; this.area = {};
    this.goldKind = 'hidden';
  }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
  put(x, y, ch) { if (this.inb(x, y)) this.g[y][x] = ch; return this; }
  get(x, y) { return this.inb(x, y) ? this.g[y][x] : '#'; }
  fill(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.put(x, y, ch); return this; }
  hline(x0, x1, y, ch) { return this.fill(x0, y, x1, y, ch); }
  vline(x, y0, y1, ch) { return this.fill(x, y0, x, y1, ch); }
  text(x, y, str) { for (let k = 0; k < str.length; k++) if (str[k] !== ' ') this.put(x + k, y, str[k]); return this; }
  // a letter for a legend entry (the same entry always gets the same letter)
  L(entry) {
    const key = JSON.stringify(entry);
    if (this.byEntry[key]) return this.byEntry[key];
    const ch = TourRooms.LETTERS[this.next++];
    if (!ch) throw new Error('RoomGrid: out of legend letters');
    this.legend[ch] = entry; this.byEntry[key] = ch; return ch;
  }
  spawn(x, y, type, props) { return this.put(x, y, this.L(['spawn', type, props || {}])); }
  enemy(x, y, type, props) { return this.put(x, y, this.L(['enemy', type, props || {}])); }
  decor(x, y, kind) { return this.put(x, y, this.L(['decor', kind])); }
  box(x, y, it) { this.put(x, y, '?'); this.boxes[x + ',' + y] = it || 'pick'; return this; }
  door(x, y, D) { this.put(x, y, 'D'); this.doorsAt[x + ',' + y] = D || {}; return this; }
  anchor(x, y, name) { return this.put(x, y, this.L(['anchor', name])); }
  coins(x0, x1, y) { for (let x = x0; x <= x1; x++) if (this.get(x, y) === '.') this.put(x, y, 'o'); return this; }
  coinsArc(x0, x1, yb, h) { const n = x1 - x0; for (let x = x0; x <= x1; x++) { const k = n ? (x - x0) / n : 0.5, y = Math.round(yb - Math.sin(k * Math.PI) * h); if (this.get(x, y) === '.') this.put(x, y, 'o'); } return this; }
  need(what, tx, ty, w, h) { this.needs.push({ what, x: tx * TS, y: ty * TS, w: (w || 1) * TS, h: (h || 1) * TS }); return this; }
  // a moving platform: its left tile at column x, its top on row y + 1, travelling ax / ay tiles; its whole path is
  // one-way floor for the checker (as the toolkit's mover and lift pieces do)
  mover(x, y, pw, ax, ay, speed) {
    this.spawn(x, y, 'mplat', { pw, ax: ax * TS, ay: ay * TS, speed: speed || 2 });
    for (let i = Math.min(0, ax); i <= Math.max(0, ax); i++) for (let j = 0; j < pw; j++) for (let k = Math.min(0, ay); k <= Math.max(0, ay); k++) this.ghosts.push([x + i + j, y + 1 + k]);
    return this;
  }

  /* ---------- the pieces every room shares ---------- */
  // the way in and out on the left: '@' where Brady arrives, the door next to it; the old room's signs, bottles and
  // drafts on the floor after it. Returns the first free column.
  west(keep, y) {
    y = y == null ? this.F - 1 : y;
    this.put(2, y, '@');
    let x = 4;
    if (keep.door) { this.door(3, y, keep.door); x = 5; }
    for (const e of keep.extras) {
      if (e[0] === 'spawn' && e[1] === 'tourDraft') continue;   // a draft belongs with a fake wall (gateWing)
      if (e[0] === 'spawn' && e[1] === 'gate') continue;        // a gate with a need (5-2): gateWing
      this.put(x, y, this.L(e)); x += e[0] === 'piece' ? 3 : 2;
    }
    return x;
  }
  // the old room's secret gate: on the floor at column x (five rows of air over it), behind a fake wall when it had
  // one (the fake wall, its dust draft and a roof over the pocket); a gate with a need (5-2's door 22) beside it
  gateWing(keep, x, y) {
    y = y == null ? this.F - 1 : y;
    const needGate = keep.extras.find(e => e[0] === 'spawn' && e[1] === 'gate');
    if (!keep.gate && !needGate) return x;
    const x1 = x + (keep.gate && needGate ? 2 : 0);
    this.fill(x - 1, y - 3, x1 + 1, y, '.');
    if (keep.gate) this.put(x, y, 'g');
    if (needGate) this.put(x1, y, this.L(needGate));
    if (keep.fake) {
      const fx = x - 2;
      this.vline(fx, y - 3, y, 'F');
      this.hline(fx, x1 + 2, y - 4, '#');
      const draft = keep.extras.find(e => e[0] === 'spawn' && e[1] === 'tourDraft');
      if (draft) this.put(fx - 1, y, this.L(draft));
    }
    return x1 + 2;
  }
  // the prize cage: a nook (w wide, h tall) closed by the cage on its left at column x, ceiling over it; the boxes
  // sit in its top row; returns the nook's first column. `key`: the vkey spot(s) the checker must reach to "win"
  cage(aid, x, y, items, opts) {
    opts = opts || {};
    const w = Math.max(3, opts.w || items.length + 2), h = opts.h || 5, top = y - h + 1;
    this.fill(x, top - 1, x + w, top - 1, '#');                 // ceiling
    this.fill(x + 1, top, x + w, y, '.');
    if (x + w + 1 < this.W - 1) this.vline(x + w + 1, top - 1, y, '#');
    this.put(x, top - 1, '#');
    const lock = ['lock', 'room:' + aid]; if (opts.needsAll) lock.push({ needsAll: opts.needsAll });
    this.vline(x, top, y, this.L(lock));
    const bx = x + 1 + Math.max(0, Math.floor((w - items.length) / 2));
    items.forEach((it, k) => this.box(bx + k, top + 1, it));
    this.data.cage = { x, top, y, w };
    return x + 1;
  }
  // the checker's "the room was won": a vkey the search must stand on
  winSpot(aid, x, y) {
    // the nearest open cell on that row with something to stand on under it
    for (let d = 0; d < this.W; d++) for (const xx of [x - d, x + d]) if (this.get(xx, y) === '.' && SOLIDISH(this.get(xx, y + 1))) { this.put(xx, y, this.L(['vkey', 'room:' + aid])); this.need('the win spot', xx, y); return this; }
    return this;
  }
  // decor along a row on the ground, spaced out, skipping occupied cells
  dress(keep, xs, y) {
    const kinds = (keep.decor || []).concat(this.extraDecor || []);
    if (!kinds.length) return;
    xs.forEach((x, k) => { if (this.get(x, y) === '.' && SOLIDISH(this.get(x, y + 1))) this.decor(x, y, kinds[k % kinds.length]); });
  }
  finish(keep) {
    const rows = this.g.map(r => r.join(''));
    const items = [], hidden = [], doors = [];
    let card = false;
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      const ch = this.g[y][x];
      if (ch === '?') items.push(this.boxes[x + ',' + y] || 'pick');
      else if (ch === 'D') doors.push(this.doorsAt[x + ',' + y] || {});
      else if (ch === '*') card = true;
    }
    // no postcard spot where the old room had none (the level's postcard pick must not change)
    if (card && keep && !keep.gold) for (let y = 0; y < rows.length; y++) rows[y] = rows[y].replace(/\*/g, 'o');
    const stamp = { floor: this.F, rows, legend: this.legend, items, hidden, doors };
    if (card && (!keep || keep.gold)) stamp.gold = { '*': (keep && keep.gold) || this.goldKind };
    return { stamp };
  }
}
// a stamp cell Brady can stand on (for dressing)
function SOLIDISH(ch) { return ch === '#' || ch === 'H' || ch === 'B' || ch === '-' || ch === 'I'; }

/* ---------- the prize cage: a lock that opens itself when the room is won ---------- */
class TourRoomCage extends ENTITY_TYPES.lock {
  constructor(g, s) { super(g, s); this.need = s.need; this.lookName = 'roomCage'; this.rise = 0; }
  update(dt) {
    this.t += dt;
    if (this.msgT > 0) this.msgT -= dt;
    if (!this.open && this.g.keys && this.g.keys.has(this.id)) {
      this.open = true; this.openT = 1;
      for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY);
      Sound.play('door', { vol: 0.7 }); this.g.burst(this.cx, this.cy, 22, '#ffd84a', 'confetti');
    }
    if (this.open) { this.rise = Math.min(1, this.rise + dt * 1.6); if (this.openT > 0) this.openT -= dt; }
  }
  touchPlayer(p) {
    if (this.open) return;
    if (this.msgT <= 0) { this.msgT = 2; this.g.parts.text(this.cx, this.y - 10, this.need || 'WIN THE ROOM FIRST!', '#ffd84a'); Sound.play('bump', { vol: 0.4 }); }
  }
  draw(ctx) {
    if (this.rise >= 1) return;
    const x = this.x + 4, w = this.w - 8, y = this.y - this.rise * this.h, h = this.h, t = this.g.t;
    Ink.around(ctx, x - 4, y - 6, w + 8, h + 8, c => {
      c.fillStyle = '#7a5a2a'; c.fillRect(x - 2, y - 4, w + 4, 6);
      c.fillStyle = '#e8b84a'; for (let k = 0; k < 4; k++) c.fillRect(x + 2 + k * (w - 6) / 3, y, 3, h);
      c.fillStyle = '#c8962a'; c.fillRect(x - 2, y + h * 0.45, w + 4, 4);
      // the padlock with a star: what opens it is the room's game
      const ly = y + h * 0.45 + 2;
      c.fillStyle = '#ffd84a'; rr(c, x + w / 2 - 8, ly - 2, 16, 13, 3); c.fill();
      c.strokeStyle = '#ffd84a'; c.lineWidth = 2.5; c.beginPath(); c.arc(x + w / 2, ly - 2, 5, Math.PI, 0); c.stroke();
      c.fillStyle = '#c0392b'; TourRoomArt.star(c, x + w / 2, ly + 4.5, 4 + Math.sin(t * 4) * 0.6);
    }, { pad: 6 });
  }
}
ENTITY_TYPES.roomCage = TourRoomCage;

/* small drawing helpers shared by the kinds */
const TourRoomArt = {
  star(c, x, y, r) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr2 = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); },
  outline(c, w) { c.strokeStyle = '#1c1426'; c.lineWidth = w || 2; c.stroke(); },
  // the four lamp / mural symbols: colour AND shape, so the order reads without colour vision
  SYMS: [{ col: '#ff5a4a', shape: 'circle' }, { col: '#ffd23a', shape: 'tri' }, { col: '#4aa8ff', shape: 'square' }, { col: '#5ad86a', shape: 'diamond' }],
  sym(c, k, x, y, r) {
    const S = this.SYMS[k % 4]; c.fillStyle = S.col; c.beginPath();
    if (S.shape === 'circle') c.arc(x, y, r, 0, TAU);
    else if (S.shape === 'tri') { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
    else if (S.shape === 'square') c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
    else { c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); }
    c.fill(); this.outline(c, 1.5);
  }
};

/* ---------- the hooks ---------- */
TourHooks.on('areaLoaded', (play, A) => { if (A && A.roomKit) TourRooms.enter(play, A); });
TourHooks.on('playUpdate', (play, dt) => { if (play.area && play.area.roomKit) TourRooms.update(play, dt); });
TourHooks.on('afterEntities', (play, ctx) => { if (play.area && play.area.roomKit) TourRooms.draw(play, ctx); });
try { Object.assign(window.BRADY_TOUR, { TourRooms }); } catch (e) { /* not in a browser */ }
