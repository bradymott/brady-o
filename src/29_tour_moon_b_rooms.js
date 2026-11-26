/* ============================================================
   THE MOON: the secret rooms' games (docs SECRETS_BRIEF, the Encore Tour's secrets pass). Every room in the land is
   its own thing, with a rule you can read in two seconds:
     moonPutt   18-1 PIWI'S PRACTICE GREEN   putt the forgotten golf ball into the cup in three kicks (too hard and
                                             it skips over the cup); low gravity, so it rolls a long way
     moonLights 18-2 THE PRESSURE PANEL      step on a lamp: it and its neighbours switch; light all four
     moonOdd    18-3 THE SPARE-WHEEL RACK    stand on the one wheel that is not like the others (a wrong one
                                             shuffles the rack)
     moonFuses  18-4 THE FUSE CUPBOARD        grab the four spare fuses, two on the floor and two on the magnet
                                             ceiling, before the clock runs out
     (18-5 is the toolkit's shell game, re-dressed: the headliner's hatboxes)
     moonEcho   18-6 THE OBSERVATORY          the telescope shows four stars in an order; step on them in that order
   Each room's prize waits in an alcove behind a lock with the room's id ('moon:<area>'): winning hands Brady that
   key (play.keys), so the lock opens on touch. The level checker sees the lock and a virtual key on the game's
   pieces (every pad, token or wheel reachable = the game can be played and won there); the shots tool wins and
   loses each game for real.
   ============================================================ */
(function () {
const MK = Tour.moonKit, INK = MK.INK, MoonArt = MK.MoonArt;
for (const k of ['moonPutt', 'moonLights', 'moonOdd', 'moonFuses', 'moonEcho']) { TourHooks.room(k, {}); if (TourHooks.ROOM_TYPES.indexOf(k) < 0) TourHooks.ROOM_TYPES.push(k); }
const RULES = {
  moonPutt: ['PIWI\'S PRACTICE GREEN', 'KICK THE BALL INTO THE CUP IN 3 KICKS. TOO HARD AND IT SKIPS OVER!'],
  moonLights: ['THE PRESSURE PANEL', 'STEP ON A LAMP: IT AND ITS NEIGHBOURS SWITCH. LIGHT ALL FOUR!'],
  moonOdd: ['THE SPARE-WHEEL RACK', 'STAND ON THE ONE WHEEL THAT IS NOT LIKE THE OTHERS'],
  moonFuses: ['THE FUSE CUPBOARD', 'GRAB ALL 4 SPARE FUSES BEFORE THE CLOCK RUNS OUT (TWO ARE ON THE CEILING)'],
  moonEcho: ['THE OBSERVATORY', 'WATCH THE STARS LIGHT UP, THEN STEP ON THEM IN THAT ORDER']
};
// where Brady stands: on a tile (x, floor row y)?
const standsOn = (p, x, y) => p && p.onGround && !p.flipped && p.groundTy === y && Math.abs(p.cx - (x * TS + TS / 2)) < TS * 0.6;

/* one controller per room: { kind, pads: [[x, y]...] (the game's floor tiles), ... } */
class MoonGame extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.kind = s.kind; this.pads = s.pads || []; this.t = 0; this.won = false; this.st = {}; this.told = false; this.lockId = s.lock; this.init(); }
  init() {
    const S = this.st, k = this.kind;
    if (k === 'moonLights') { S.on = [false, true, true, false]; S.was = -1; }
    if (k === 'moonOdd') { S.odd = 3; S.was = -1; S.shuffles = 0; }
    if (k === 'moonEcho') { S.order = [2, 0, 3, 1]; S.next = 0; S.show = 1.0; S.was = -1; S.lit = []; }
    if (k === 'moonFuses') { S.got = []; S.left = 0; S.running = false; }
    if (k === 'moonPutt') { S.kicks = 0; this.ballHome(); }
  }
  ballHome() { const S = this.st, [tx, ty] = this.s.tee; S.ball = { x: tx * TS + 8, y: ty * TS - 16, w: 16, h: 16, vx: 0, vy: 0, onGround: true, rest: 0 }; S.kicks = 0; S.sunk = false; }
  winGame(text) {
    if (this.won) return; this.won = true;
    const g = this.g; g.keys.add(this.lockId);
    Sound.play('secret', { vol: 0.8 }); g.bannerText = text || 'YOU DID IT!'; g.bannerT = 1.8;
    if (g.player) g.burst(g.player.cx, g.player.y - 10, 26, '#ffd84a', 'confetti');
  }
  fail(text) { const g = this.g, p = g.player; TourKit.sfx('fizz', 'bump', { vol: 0.5, pitch: 0.6 }); if (p) g.parts.text(p.cx, p.y - 20, text, '#ff9a9a'); }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player, S = this.st;
    if (!this.told && p) { this.told = true; const R = RULES[this.kind]; g.bannerText = R[0]; g.bannerT = 1.8; g.toast && g.toast(R[1]); }
    if (this.won || !p || p.dead) { if (this.kind === 'moonPutt') this.ballStep(dt); return; }
    const on = this.pads.findIndex(([x, y]) => standsOn(p, x, y));
    if (this.kind === 'moonLights') {
      if (on >= 0 && on !== S.was) { for (const k of [on - 1, on, on + 1]) if (k >= 0 && k < S.on.length) S.on[k] = !S.on[k]; TourKit.sfx('click', 'select', { vol: 0.5, pitch: 1.2 }); if (S.on.every(Boolean)) this.winGame('ALL LIT!'); }
      S.was = on;
    } else if (this.kind === 'moonOdd') {
      if (on >= 0 && on !== S.was) { if (on === S.odd) this.winGame('THAT\'S THE ONE!'); else { this.fail('NOT THAT ONE! (SHUFFLED)'); S.shuffles++; S.odd = (S.odd + 2 + S.shuffles) % this.pads.length; if (S.odd === on) S.odd = (S.odd + 1) % this.pads.length; } }
      S.was = on;
    } else if (this.kind === 'moonEcho') {
      if (S.show > 0) { S.show += dt; if (S.show > 1 + S.order.length * 0.8 + 0.6) S.show = 0; return; }
      if (on >= 0 && on !== S.was) {
        if (on === S.order[S.next]) { S.lit.push(on); S.next++; TourKit.sfx('chime', 'pick', { vol: 0.5, pitch: 1 + S.next * 0.15 }); if (S.next >= S.order.length) this.winGame('A CONSTELLATION!'); }
        else if (S.lit.indexOf(on) < 0) { this.fail('WRONG STAR! WATCH AGAIN'); S.next = 0; S.lit = []; S.show = 0.01; }
      }
      S.was = on;
    } else if (this.kind === 'moonFuses') {
      if (S.running) { S.left -= dt; if (S.left <= 0) { S.running = false; S.got = []; this.fail('TIME! THE FUSES ARE BACK IN PLACE'); } }
      this.s.fuses.forEach(([fx, fy, up], i) => {
        if (S.got.indexOf(i) >= 0) return;
        const box = { x: fx * TS + 4, y: fy * TS + 2, w: TS - 8, h: TS - 4 };
        if (overlap(p, box)) { if (!S.running) { S.running = true; S.left = this.s.time || 25; } S.got.push(i); Sound.play('pick', { vol: 0.6, pitch: 1.3 }); g.burst(box.x + 12, box.y + 12, 8, '#ffd84a', 'spark'); if (S.got.length >= this.s.fuses.length) { S.running = false; this.winGame('ALL FOUR FUSES!'); } }
      });
    } else if (this.kind === 'moonPutt') this.ballStep(dt);
  }
  // the golf ball: Brady kicks it by running into it; it rolls far in the low gravity; it drops into the cup only if
  // it crosses it slowly enough
  ballStep(dt) {
    const g = this.g, p = g.player, S = this.st, b = S.ball, A = g.area, cup = this.s.cup;
    if (S.sunk) return;
    if (!this.won && p && !p.dead && overlap(p, b) && Math.abs(p.vx) > 20 && S.kickT !== true) {
      const d = sign(p.vx); b.vx = d * Math.min(10.5, Math.abs(p.vx) / TS * 0.95 + 1.5) * TS; b.vy = -1.5 * TS; S.kicks++; S.kickT = true; TourKit.sfx('putt', 'bump', { vol: 0.6, pitch: 1.6 });
      g.parts.text(b.x + 8, b.y - 12, 'KICK ' + S.kicks, '#ffffff');
    }
    if (p && !overlap(p, b)) S.kickT = false;
    b.vy = Math.min(b.vy + PHYS.gDown * (A.gravity || 1) * dt, 12 * TS);
    const wasG = b.onGround; moveBody(b, A, dt, { semis: true });
    if (b.hitWall) b.vx = -b.vx * 0.6;
    if (b.onGround) b.vx = approach(b.vx, 0, 3.6 * TS * dt);
    // over the cup, slow enough: it drops in
    const cx = b.x + b.w / 2;
    if (b.onGround && Math.abs(cx - (cup[0] * TS + TS / 2)) < 10 && Math.abs(b.vx) < 5 * TS) { S.sunk = true; b.vx = 0; b.y = cup[1] * TS + 4; Sound.play('coin', { vol: 0.7 }); this.winGame('HOLE IN ' + S.kicks + '!'); return; }
    if (!this.won && b.onGround && Math.abs(b.vx) < 4 && S.kicks >= 3) { S.rest += dt; if (S.rest > 0.8) { this.fail('3 KICKS! BACK TO THE TEE'); this.ballHome(); } } else S.rest = 0;
  }
  touchPlayer() {}
  draw(ctx) {
    const S = this.st, g = this.g, t = this.t, k = this.kind;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    if (k === 'moonLights') this.pads.forEach(([x, y], i) => { const cx = x * TS + TS / 2, cy = y * TS - 6, on = S.on[i]; if (on) { ctx.fillStyle = 'rgba(255,230,140,0.35)'; ctx.beginPath(); ctx.arc(cx, cy - 10, 26, 0, TAU); ctx.fill(); } ctx.fillStyle = '#5a6276'; ctx.fillRect(cx - 14, cy, 28, 6); ctx.strokeRect(cx - 14, cy, 28, 6); ctx.fillStyle = on ? '#ffe27a' : '#3a3a4a'; ctx.beginPath(); ctx.arc(cx, cy - 6, 10, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    if (k === 'moonOdd') this.pads.forEach(([x, y], i) => {
      const cx = x * TS + TS / 2, cy = y * TS - 12, odd = i === S.odd && !this.won, spin = t * (odd ? 1.3 : 1.0);
      ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.ellipse(cx, cy, 14, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#8a92a6'; ctx.lineWidth = 1.5; const n = odd ? 5 : 6; for (let q = 0; q < n; q++) { const a = spin + q * TAU / n; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
    });
    if (k === 'moonEcho') {
      const showing = S.show > 0, step = showing ? Math.floor((S.show - 1) / 0.8) : -1;
      this.pads.forEach(([x, y], i) => { const cx = x * TS + TS / 2, cy = y * TS - 10, lit = (showing && step >= 0 && S.order[step] === i && (S.show - 1) % 0.8 < 0.6) || S.lit.indexOf(i) >= 0 || this.won; ctx.fillStyle = lit ? '#ffe8a0' : '#5a5aa0'; ctx.beginPath(); TourKit.star(ctx, cx, cy, 12, 5, 5); ctx.fill(); ctx.stroke(); if (lit) { ctx.fillStyle = 'rgba(255,232,160,0.3)'; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, TAU); ctx.fill(); } });
      if (showing && g.player) RoomText(g, ctx, 'WATCH...');
    }
    if (k === 'moonFuses') {
      this.s.fuses.forEach(([fx, fy, up], i) => { if (S.got.indexOf(i) >= 0) return; const cx = fx * TS + TS / 2, cy = fy * TS + TS / 2 + Math.sin(t * 3 + i) * 2; ctx.save(); ctx.translate(cx, cy); if (up) ctx.scale(1, -1); ctx.fillStyle = '#e8ecf4'; rr(ctx, -6, -11, 12, 22, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(-6, -3, 12, 6); ctx.strokeRect(-6, -3, 12, 6); ctx.restore(); });
      if (S.running && g.player) RoomText(g, ctx, Math.ceil(S.left) + 's   ' + S.got.length + ' / ' + this.s.fuses.length);
    }
    if (k === 'moonPutt') {
      const [cx0, cy0] = this.s.cup, hx = cx0 * TS + TS / 2, hy = cy0 * TS;
      ctx.fillStyle = '#1a1630'; ctx.beginPath(); ctx.ellipse(hx, hy + 2, 12, 4, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy - 46); ctx.stroke();
      ctx.fillStyle = Tour.moonKit.PIWI; ctx.beginPath(); ctx.moveTo(hx, hy - 46); ctx.lineTo(hx + 18, hy - 40); ctx.lineTo(hx, hy - 34); ctx.closePath(); ctx.fill();
      const b = S.ball; if (!S.sunk) MoonArt.golf(ctx, b.x + 8, b.y + 8, 8);
      if (g.player && !this.won) RoomText(g, ctx, 'KICKS ' + S.kicks + ' / 3');
    }
    ctx.restore();
  }
}
// a line of text at the top of the view (the room's counter)
function RoomText(g, ctx, str) {
  const x = g.camX + Game.viewW / 2, y = g.camY + 70;
  ctx.save(); ctx.font = '14px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(str).width + 24; ctx.fillStyle = 'rgba(14,8,26,0.75)'; rr(ctx, x - w / 2, y - 13, w, 26, 13); ctx.fill();
  ctx.fillStyle = '#ffd84a'; ctx.fillText(str, x, y + 1); ctx.restore();
}
ENTITY_TYPES.moonGame = MoonGame;

/* the piece: { kind, pads, tee, cup, fuses, time } at the letter; the lock and the checker's key */
Tour.pieces['moon.game'] = function (st, o) {
  const B = st.B, id = 'moon:' + (st.ctx && st.ctx.areaSpec ? st.ctx.areaSpec.id : o.id || 'room');
  const lock = o.lock || id;
  B.spawn('moonGame', st.x, st.gy - 1, Object.assign({}, o, { lock }));
  // the checker: every pad / token / the tee reached = the game is there to be played and won
  const tiles = (o.pads || []).map(([x, y]) => [x, y - 1]).concat((o.fuses || []).map(([x, y]) => [x, y])).concat(o.tee ? [[o.tee[0], o.tee[1] - 1], [o.cup[0], o.cup[1] - 1]] : []);
  B.vkey(lock, tiles, 'all');
  return st.x;
};
Tour.moonKit.MoonGame = MoonGame; Tour.moonKit.ROOM_RULES = RULES;
})();
