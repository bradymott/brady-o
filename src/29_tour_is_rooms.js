/* ============================================================
   ICELAND: the secret rooms (world 17; docs/design/SECRET_ROOMS.md, /home/user/wt/SECRETS_BRIEF.md).
   Every room in the land is its own game, and none sits behind a plain door in plain sight but the turf hut's (17-5).
   The land's tell is consistent: a tiny painted folk door on a rock (isElfDoor) is never far from a secret.
   Three kinds are new to the game:
   - isBells   (17-1, THE FOLK'S BELLS): the hidden folk's three bells ring a tune; ring it back in the same order
                by touching them. A wrong bell rings flat and the tune plays again.
   - isOrgan   (17-4, THE TROLL'S LULLABY): five organ pipes of five heights; a slate shows the lullaby as a row of
                pipe heights. Stand on the pipes in that order (each plays its note). A wrong one: a sour chord.
   - isFolkLights (17-6, THE SHY LANTERNS): the folk's lanterns are there only while Brady looks away from them (THROW
                to look back). Gather all five.
   The others are kit kinds re-dressed in Iceland's own things: rush (17-2's puffin eggs in the ice cave), ambush
   (17-3's sheep shelter in a lava tube) and shell (17-5's three bowls of skyr).
   Also here: the hidden entrances' own parts (the crack in the glacier, the steaming fissure's tell, the shy door).
   ============================================================ */
(function () {
if (!Tour.countries.is || typeof TourRooms === 'undefined') return;
const KIT = Tour.isKit, IsArt = KIT.IsArt, INK = KIT.INK;
const RK = TourRoomKit;
const NOTE = k => Math.pow(2, [0, 4, 7, 9, 12, 16][k % 6] / 12);
const chime = (k, ok) => Sound.play('select', { vol: 0.5, pitch: ok === false ? 0.45 : NOTE(k) });
if (TourRoomArt && TourRoomArt.CUPS) TourRoomArt.CUPS.isSkyr = { body: '#f4f8fc', band: '#3a7ad8', w: 34, h: 22, round: true };

/* ================= isBells: THE FOLK'S BELLS (a listen-and-repeat tune) ================= */
TourRooms.def('isBells', {
  title: 'THE FOLK\'S BELLS', rule: 'LISTEN TO THE BELLS, THEN RING THEM BACK IN THE SAME ORDER', need: 'RING THE TUNE FIRST!',
  make(o, keep, ctx, A, rng) {
    const W = 32 + RK.eastW(keep, o), g = RK.room(W), Y = RK.Y;
    const x0 = g.west(keep), x1 = RK.east(g, keep, A, o), span = x1 - x0, at = f => x0 + Math.round(span * f);
    // three bells on posts, one on the floor, one on a ledge, one on the floor again (touch = ring)
    const spots = [[at(0.2), Y], [at(0.5), 6], [at(0.8), Y]];
    g.hline(at(0.5) - 2, at(0.5) + 2, 7, '-'); g.hline(at(0.35) - 1, at(0.35) + 1, 8, '-'); g.hline(at(0.65) - 1, at(0.65) + 1, 8, '-');
    spots.forEach((s, k) => g.put(s[0], s[1], g.L(['spawn', 'isBell', { k }])));
    // the tune: four rings, never the same bell twice in a row
    const tune = []; let last = -1; for (let k = 0; k < (o.n || 4); k++) { let b; do b = Math.floor(rng() * 3); while (b === last); tune.push(b); last = b; }
    g.data.tune = tune;
    g.winSpot(A.id, at(0.5), 6);
    g.coins(at(0.5) - 1, at(0.5) + 1, 4); g.put(at(0.5), 2, '*');
    g.dress(keep, [x0, at(0.35), at(0.65)], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.step = 0; R.demo = 0.8; R.di = 0; } },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const tune = kit.data.tune, bells = play.entities.filter(e => e instanceof IsBell);
    if (R.demo > 0) {
      // the demo: each bell of the tune glows and rings in turn (0.7 s apart); Brady's touches wait for it
      R.demo -= dt;
      if (R.demo <= 0) {
        if (R.di < tune.length) { const b = bells.find(e => e.k === tune[R.di]); if (b) { b.ring(true); chime(b.k); } R.di++; R.demo = 0.7; }
        else { R.demo = 0; R.step = 0; play.parts.text(play.player.cx, play.player.y - 16, 'YOUR TURN!', '#ffe28a'); }
      }
      return;
    }
    if (!RK.inside(play, A, R)) return;
    for (const b of bells) {
      if (!overlap(play.player, b)) { b.armed = true; continue; }
      if (!b.armed) continue;
      b.armed = false;
      if (b.k === tune[R.step]) { b.ring(true); chime(b.k); R.step++; if (R.step >= tune.length) TourRooms.win(play, A, R, { text: 'THE FOLK APPLAUD!', coins: 6 }); }
      else { b.ring(false); chime(b.k, false); RK.raspberry(play, 'A FLAT NOTE! LISTEN AGAIN'); R.step = 0; R.demo = 1.2; R.di = 0; }
    }
  },
  draw(play, ctx, A, R, kit) {
    // the tune's progress: four little notes over the room, the rung ones gold
    const n = kit.data.tune.length;
    for (let k = 0; k < n; k++) { const x = play.camX + Game.viewW / 2 - (n - 1) * 14 + k * 28, y = TourRooms.hudY(play, 0) + 30; ctx.fillStyle = R.won || k < (R.step || 0) ? '#ffd84a' : 'rgba(255,255,255,0.45)'; ctx.font = `18px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('♪', x, y); }
  }
});
class IsBell extends Ent {
  constructor(g, s) { super(g, s, 26, 60); this.k = s.k; this.glow = 0; this.bad = 0; this.armed = true; this.swing = 0; }
  ring(ok) { if (ok) this.glow = 1; else this.bad = 1; this.swing = 1; }
  update(dt) { this.t += dt; this.glow = Math.max(0, this.glow - dt * 1.6); this.bad = Math.max(0, this.bad - dt * 1.6); this.swing = Math.max(0, this.swing - dt * 1.2); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, col = ['#d83a2a', '#3a7ad8', '#2a8a4a'][this.k % 3], a = Math.sin(this.t * 14) * 0.35 * this.swing;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 3, y - 50, 6, 50); ctx.strokeRect(x - 3, y - 50, 6, 50); ctx.fillRect(x - 12, y - 52, 24, 5); ctx.strokeRect(x - 12, y - 52, 24, 5);
    ctx.translate(x, y - 47); ctx.rotate(a);
    if (this.glow > 0) { ctx.fillStyle = `rgba(255,230,140,${0.6 * this.glow})`; ctx.beginPath(); ctx.arc(0, 14, 22, 0, TAU); ctx.fill(); }
    ctx.fillStyle = this.bad > 0 ? '#6a6a76' : col; ctx.beginPath(); ctx.moveTo(-10, 22); ctx.quadraticCurveTo(-10, 2, 0, 2); ctx.quadraticCurveTo(10, 2, 10, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, 24, 3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

/* ================= isOrgan: THE TROLL'S LULLABY (read the slate, play the pipes) ================= */
TourRooms.def('isOrgan', {
  title: 'THE TROLL\'S LULLABY', rule: 'THE SLATE SHOWS THE TUNE AS PIPE HEIGHTS: STAND ON THE PIPES IN THAT ORDER', need: 'PLAY THE LULLABY FIRST!',
  make(o, keep, ctx, A, rng) {
    const n = 5, W = 34 + RK.eastW(keep, o), g = RK.room(W), Y = RK.Y;
    const x0 = g.west(keep), x1 = RK.east(g, keep, A, o), span = x1 - x0;
    // five pipes in a row, their tops 1..5 rows over the floor in a shuffled order, two columns apart
    const hs = [1, 2, 3, 4, 5]; for (let k = hs.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [hs[k], hs[j]] = [hs[j], hs[k]]; }
    const px = k => x0 + 2 + Math.round((span - 6) * k / (n - 1));
    for (let k = 0; k < n; k++) {
      const top = Y + 1 - hs[k];
      g.put(px(k), top, g.L(['spawn', 'isOrganKey', { k, h: hs[k] }]));
      g.ghosts.push([px(k), top], [px(k) + 1, top]);
      g.need('organ pipe ' + k, px(k), top - 1);
    }
    // the lullaby: four pipes (by height, read off the slate)
    const tune = []; let last = -1; for (let k = 0; k < 4; k++) { let p; do p = Math.floor(rng() * n); while (p === last); tune.push(p); last = p; }
    g.data.tune = tune; g.data.hs = hs; g.data.slate = [x0 + 1, 3];
    // the checker's win: all five pipes stood on (the order is the player's part)
    g.winSpot(A.id, Math.round((x0 + x1) / 2), Y);
    g.put(px(2) + 1, 2, '*'); g.coins(px(0), px(1), 3);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) R.step = 0; },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const p = play.player;
    for (const e of play.entities) {
      if (!(e instanceof IsOrganKey)) continue;
      const on = p.ride === e && p.onGround && Math.abs(p.y + p.h - e.y) < 4 && p.x + p.w > e.x && p.x < e.x + e.w;
      if (on && !e.was) {
        if (e.k === kit.data.tune[R.step]) { e.glow = 1; chime(e.k); R.step++; if (R.step >= kit.data.tune.length) TourRooms.win(play, A, R, { text: 'THE TROLL SNORES HAPPILY', coins: 6 }); }
        else { e.bad = 1; chime(e.k, false); if (R.step > 0) RK.raspberry(play, 'A SOUR CHORD! FROM THE TOP'); R.step = e.k === kit.data.tune[0] ? 1 : 0; }
      }
      e.was = on;
    }
  },
  draw(play, ctx, A, R, kit) {
    // the slate: the tune as four little pipes of the right heights, the played ones gold
    const [sx, sy] = kit.data.slate, x = sx * TS, y = sy * TS, tune = kit.data.tune, hs = kit.data.hs;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#3a3640'; rr(ctx, x, y - 10, 30 * tune.length + 14, 74, 6); ctx.fill(); ctx.stroke();
    tune.forEach((pk, k) => { const h = hs[pk] * 10; ctx.fillStyle = R.won || k < (R.step || 0) ? '#ffd890' : '#a8a2b4'; ctx.fillRect(x + 10 + k * 30, y + 58 - h, 18, h); ctx.strokeRect(x + 10 + k * 30, y + 58 - h, 18, h); });
    ctx.restore();
  }
});
class IsOrganKey extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.k = s.k; this.hh = s.h; this.isPlatform = true; this.dx = 0; this.dy = 0; this.glow = 0; this.bad = 0; this.always = true; }
  update(dt) { this.t += dt; this.glow = Math.max(0, this.glow - dt * 1.4); this.bad = Math.max(0, this.bad - dt * 2); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, bot = (this.g.area.H - 3) * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = this.bad > 0 ? '#8a4a4a' : '#4e4a58'; ctx.fillRect(x + 2, y + 4, w - 4, bot - y); ctx.strokeRect(x + 2, y + 4, w - 4, bot - y);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 6, y + 6, 6, bot - y - 4);
    IsArt.hexCap(ctx, x + 2, y, w - 4, this.glow > 0 ? '#ffd890' : '#8a8494');
    ctx.fillStyle = '#1c1820'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 22, 6, 9, 0, 0, TAU); ctx.fill();
    if (this.glow > 0) { ctx.fillStyle = `rgba(255,220,150,${this.glow})`; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('♪', x + w / 2, y - 10 - (1 - this.glow) * 16); }
    ctx.restore();
  }
}

/* ================= isFolkLights: THE SHY LANTERNS (gather what is there only when you look away) ================= */
TourRooms.def('isFolkLights', {
  title: 'THE SHY LANTERNS', rule: 'THE FOLK\'S LANTERNS HIDE WHEN YOU LOOK AT THEM: LOOK BACK (THROW) AND GATHER ALL FIVE', need: 'GATHER THE LANTERNS FIRST!',
  make(o, keep, ctx, A, rng) {
    const W = 36 + RK.eastW(keep, o), g = RK.room(W), Y = RK.Y;
    const x0 = g.west(keep);
    const ids = []; for (let k = 0; k < 5; k++) ids.push('folk:' + A.id + ':' + k);
    const x1 = RK.east(g, keep, A, o, { needsAll: ids }), span = x1 - x0, at = f => x0 + Math.round(span * f);
    g.put(1, Y, g.L(['spawn', 'isShyEye', {}]));
    g.hline(at(0.25) - 2, at(0.25) + 1, 7, '-'); g.hline(at(0.5) - 1, at(0.5) + 2, 4, '-'); g.hline(at(0.75) - 2, at(0.75) + 1, 7, '-');
    const spots = [[at(0.12), Y], [at(0.25), 6], [at(0.5) + 1, 3], [at(0.75), 6], [at(0.92), Y]];
    // (a lantern's cell is also the checker's key spot for it: added in build, a cell holds one letter)
    spots.forEach((s, k) => { g.put(s[0], s[1], g.L(['spawn', 'isFolkLight', { k, vkey: ids[k] }])); g.need('lantern ' + k, s[0], s[1]); });
    g.put(at(0.5), 1, '*');
    g.dress(keep, [x0 + 1, at(0.4)], Y);
    return g;
  },
  build(ctx, A, built, o, grid) {
    // the lanterns double as the checker's key spots
    for (const s of built.B.spawns) if (s.type === 'isFolkLight' && s.vkey) built.B.vkey(s.vkey, [[Math.floor(s.x / TS), Math.floor((s.y - 1) / TS)]]);
  },
  enter(play, A, R, kit) { if (!R.won) { R.got = 0; for (const e of play.entities) if (e instanceof IsFolkLight) e.got = false; } },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const p = play.player;
    for (const e of play.entities) {
      if (!(e instanceof IsFolkLight) || e.got || !e.there || !overlap(p, e)) continue;
      e.got = true; R.got = (R.got || 0) + 1; Sound.play('pick', { vol: 0.6, pitch: 1.3 }); play.burst(e.cx, e.cy, 10, '#ffe28a', 'spark');
      if (R.got >= 5) TourRooms.win(play, A, R, { text: 'THE FOLK LEAVE THEIR LIGHTS ON FOR YOU', coins: 5 });
    }
  },
  draw(play, ctx, A, R, kit) { TourRooms.counter(play, ctx, R.won ? 5 : (R.got || 0), 5, (c, x, y) => { c.fillStyle = '#ffe28a'; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); }); }
});
class IsFolkLight extends Ent {
  constructor(g, s) { super(g, s, 22, 28); this.k = s.k; this.got = false; this.there = false; this.a = 0; this.always = true; }
  update(dt) { this.t += dt; const p = this.g.player; this.there = !this.got && !!p && KIT.lookingAway(p, this.cx); this.a = approach(this.a, this.there ? 1 : 0, dt * 6); }
  touchPlayer() {}
  draw(ctx) {
    if (this.got) return;
    const x = this.cx, y = this.y + this.h, a = this.a, t = this.t;
    ctx.save();
    if (a < 0.99) { ctx.fillStyle = `rgba(255,240,200,${0.35 * (1 - a)})`; for (let q = 0; q < 3; q++) { ctx.beginPath(); TourKit.star(ctx, x - 8 + q * 8, y - 14 - ((t * 12 + q * 7) % 12), 3, 1, 4); ctx.fill(); } }
    if (a > 0.01) {
      ctx.globalAlpha = a; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
      ctx.fillStyle = 'rgba(255,226,138,0.35)'; ctx.beginPath(); ctx.arc(x, y - 14, 18, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 1, y - 28, 2, 4);
      ctx.fillStyle = ['#d83a2a', '#3a7ad8', '#2a8a4a', '#f2c84a', '#b05ad8'][this.k % 5]; rr(ctx, x - 7, y - 24, 14, 18, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffe28a'; rr(ctx, x - 4, y - 20, 8, 10, 2); ctx.fill();
    }
    ctx.restore();
  }
}

/* the room test's scripted wins (tools/sbw_rooms_test.js calls K.testWin(g, A, R, kit, frame) for a kind it has no
   script for): each plays the game the way a player does, through the room's own entities */
const step = (g, frame, n, keys) => { for (let k = 0; k < n; k++) frame(g, keys || {}); };
const onTop = (p, e) => { p.x = e.cx - p.w / 2; p.y = e.y - p.h; p.vx = p.vy = 0; };
TourRooms.kinds.isBells.testWin = function (g, A, R, kit, frame) {
  const bells = g.entities.filter(e => e instanceof IsBell), p = g.player, away = bells[0].x - 3 * TS;
  p.x = bells[0].cx + 4 * TS; for (let q = 0; q < 1200 && (R.demo > 0 || R.demo == null); q++) frame(g, {}); step(g, frame, 6);
  for (const k of kit.data.tune) { const b = bells.find(e => e.k === k); p.x = b.cx - p.w / 2; p.y = b.y + b.h - p.h; p.vy = 0; step(g, frame, 6); p.x = b.cx + 2.5 * TS; step(g, frame, 6); }
};
TourRooms.kinds.isOrgan.testWin = function (g, A, R, kit, frame) {
  const keys = g.entities.filter(e => e instanceof IsOrganKey), p = g.player;
  for (const k of kit.data.tune) { const e = keys.find(x => x.k === k); onTop(p, e); step(g, frame, 12); p.x = A.anchors.in.x; p.y = (RK.Y + 1) * TS - p.h; step(g, frame, 12); }
};
TourRooms.kinds.isFolkLights.testWin = function (g, A, R, kit, frame) {
  const p = g.player; p.isLookBack = true; step(g, frame, 2);
  for (const e of g.entities.filter(x => x instanceof IsFolkLight)) { p.x = e.cx - 14 - p.w / 2; p.y = e.y + e.h - p.h; p.vy = 0; step(g, frame, 4); }
};

/* ================= the hidden entrances' parts ================= */
// a crack in the glacier ice (17-2): just a thin blue split with a puff of cold mist now and then; up to go in
// a door into a rock that the folk keep shy (17-6): there only while Brady looks back (s.shy on a portal)
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'isCrack') {
      ctx.save(); ctx.strokeStyle = '#14507a'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 3, y - 14); ctx.lineTo(x - 3, y - 26); ctx.lineTo(x + 2, y - 40); ctx.lineTo(x - 1, y - 50); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,240,255,0.8)'; ctx.lineWidth = 1; ctx.stroke();
      const k = (t * 0.4) % 1; ctx.fillStyle = `rgba(235,250,255,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(x + 4 + k * 10, y - 30 - k * 12, 4 + k * 6, 0, TAU); ctx.fill();
      if (near) { ctx.fillStyle = 'rgba(160,220,255,0.35)'; ctx.fillRect(x - 6, y - 52, 12, 52); }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
  const tp0 = Portal.prototype.touchPlayer, pd0 = Portal.prototype.draw;
  Portal.prototype.touchPlayer = function (p) { if (this.s && this.s.shy && !p.isLookBack) { this.near = false; return; } return tp0.call(this, p); };
  Portal.prototype.draw = function (ctx) {
    if (!(this.s && this.s.shy)) return pd0.call(this, ctx);
    const p = this.g.player, back = !!(p && p.isLookBack);
    this.shyA = approach(this.shyA || 0, back ? 1 : 0, 0.12);
    if (this.shyA < 0.02) return;
    ctx.save(); ctx.globalAlpha = this.shyA; pd0.call(this, ctx); ctx.restore();
  };
}
// the steaming fissure's tell (17-3): warm steam rising from one narrow crack, the only crack that has any
class IsSteamTell extends Ent {
  constructor(g, s) { super(g, s, (s.w || 2) * TS, 4 * TS); this.x = s.x - TS / 2; this.y = s.y - 4 * TS; this.back = true; this.always = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) { for (let k = 0; k < 5; k++) IsArt.steam(ctx, this.x + this.w * (0.2 + 0.15 * k), this.y + this.h, (this.t * 0.35 + k / 5) % 1, 9); }
}
TourSeams.TELLS.isSteamTell = true;
Object.assign(ENTITY_TYPES, { isBell: IsBell, isOrganKey: IsOrganKey, isFolkLight: IsFolkLight, isSteamTell: IsSteamTell });
Object.assign(Tour.isKit, { IsBell, IsOrganKey, IsFolkLight });
})();
