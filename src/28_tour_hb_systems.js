/* ============================================================
   World tour: area systems and the rest of the object library
   (LEVEL_OVERHAUL.md §7.4.6, §6.2 batch B and the level-flow
   entities). FLIP bands, LAMP light, PHASE day/night, TIDE wiring,
   the DOOM chase, CARRY pedestals, wheels, seesaws, balloons, the
   mirror beam, HOLD arenas, the THIEF and the RACE rival, SNEAK
   watchers, Bottle Mail and the Souvenir Stand counter.
   ============================================================ */

/* ---------- build-time wiring: tide groups, flip flags, lamp darkness ---------- */
{
  const gen = TourBuild.generateV2;
  TourBuild.generateV2 = function (C, spec, w, i, attempt) {
    const lvl = gen.call(this, C, spec, w, i, attempt);
    for (const a of lvl.areas) {
      // TIDE: an automatic toggle group the validator may flip anywhere (water line low <-> high)
      if (a.tide && !Object.values(a.toggles || {}).some(G => G.kind === 'tide')) { a.toggles = a.toggles || {}; let g = 0; while (a.toggles[g]) g++; a.toggles[g] = { A: [], B: [], auto: true, kind: 'tide', low: a.tide.low, high: a.tide.high, switches: [] }; }
      a.hasFlip = (a.zones || []).some(z => z.kind === 'flip');
      if (a.lamp) a.dark = true;
    }
    return lvl;
  };
}

/* ---------- FLIP: the painted line and the band ---------- */
// flipline { w }: a band of upside-down gravity, w tiles wide, the full height of the area
Tour.pieces.flipline = function (st, o) {
  const B = st.B, x = st.x, w = o.w || 20;
  if (!st.ceil) B.fill(x, 0, x + w + 3, 1, T.GROUND);      // a ceiling to walk on over the band
  st.floor(x, x + w + 3);
  if (o.spikes) for (let xx = x + 3; xx < x + w + 1; xx++) B.set(xx, st.gy, T.SPIKES);   // a spike floor: the ceiling is the only way
  B.zone(x + 2, 0, w, B.H, 0, 0, 0, 'flip');
  B.spawn('flipLine', x + 2, B.H - 1, { w, h: B.H, look: o.look || null });
  return x + w + 4;
};
class TourFlipLine extends Ent {
  constructor(g, s) { super(g, s, (s.w || 20) * TS, (s.h || 18) * TS); this.x = s.x - TS / 2; this.y = 0; this.back = true; this.skinName = s.look; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const g = this.g, y0 = g.camY - 20, y1 = g.camY + Game.viewH + 20;
    ctx.save();
    // a faint tint over the band, two glowing painted lines at its edges with chevrons pointing up
    ctx.fillStyle = 'rgba(255,220,90,0.06)'; ctx.fillRect(this.x, y0, this.w, y1 - y0);
    for (const x of [this.x, this.x + this.w]) {
      const gr = ctx.createLinearGradient(x - 8, 0, x + 8, 0); gr.addColorStop(0, 'rgba(255,214,60,0)'); gr.addColorStop(0.5, `rgba(255,214,60,${0.65 + 0.2 * Math.sin(this.t * 4)})`); gr.addColorStop(1, 'rgba(255,214,60,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 8, y0, 16, y1 - y0);
      ctx.fillStyle = '#fff4b0'; for (let y = y0 - ((this.t * 60) % 48); y < y1; y += 48) { ctx.beginPath(); ctx.moveTo(x - 6, y + 10); ctx.lineTo(x, y); ctx.lineTo(x + 6, y + 10); ctx.lineTo(x + 3, y + 10); ctx.lineTo(x, y + 5); ctx.lineTo(x - 3, y + 10); ctx.fill(); }
    }
    ctx.restore();
  }
}
ENTITY_TYPES.flipLine = TourFlipLine;

/* ---------- LAMP: Brady's light shrinks over time; lanterns relight it ---------- */
{
  const cl = Play.prototype.collectLights;
  Play.prototype.collectLights = function (camX, camY) {
    const L = cl.call(this, camX, camY), A = this.area, p = this.player;
    if (A && A.lamp && p && L.length) {
      const lp = A.lamp, k = clamp(((this.t - (this.lampLit || 0)) / (lp.decay || 25)), 0, 1);
      L[0].r = lerp(lp.r0 || 170, lp.r1 || 70, k); L[0].col = '#ffd890'; L[0].a = 0.45;
    }
    return L;
  };
}
// lantern { kind: 'relight' | 'phase', g, A, B }: a relight post, or the sun-moon lantern that flips the area to night
Tour.pieces.lantern = function (st, o) {
  const B = st.B, x = st.x;
  st.floor(x, x + 3);
  if (o.kind === 'phase') {
    const g = o.g != null ? o.g : 2;
    const rel = r => [x + r[0], st.gy + r[1], x + r[2], st.gy + r[3], r[4] != null ? r[4] : T.SEMI];
    const A = (o.A || []).map(rel), Bt = (o.B || []).map(rel);
    for (const r of A) for (let yy = r[1]; yy <= r[3]; yy++) for (let xx = r[0]; xx <= r[2]; xx++) B.set(xx, yy, r[4]);
    for (const r of Bt) for (let yy = r[1]; yy <= r[3]; yy++) for (let xx = r[0]; xx <= r[2]; xx++) B.set(xx, yy, T.EMPTY);
    B.toggle(g, A, Bt, { kind: 'phase' }); B.switchAt(g, x + 1, st.gy - 1);
    B.spawn('toggleSwitch', x + 1, st.gy - 1, { g, kind: 'phase', look: o.look || null });
    for (const r of A) B.spawn('phaseBlocks', r[0], r[1], { g, rect: r, state: 'A' });
    for (const r of Bt) B.spawn('phaseBlocks', r[0], r[1], { g, rect: r, state: 'B' });
    return x + 4;
  }
  B.spawn('lampPost', x + 2, st.gy - 1, { look: o.look || null });
  return x + 4;
};
class TourLampPost extends Ent {
  constructor(g, s) { super(g, s, 24, 70); this.skinName = s.look; this.flare = 0; }
  update(dt) { this.t += dt; this.flare = Math.max(0, this.flare - dt); }
  touchPlayer(p) { const g = this.g; if (g.t - (g.lampLit || 0) > 1) { g.lampLit = g.t; this.flare = 1; TourKit.sfx('relight', 'checkpoint', { vol: 0.6 }); g.burst(this.cx, this.y + 14, 14, '#ffd890', 'spark'); } }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.cx, y = this.y + this.h;
    ctx.fillStyle = '#ffd890'; ctx.globalAlpha = 0.25 + this.flare * 0.4; ctx.beginPath(); ctx.arc(x, y - 64, 16 + this.flare * 8, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#3a3440'; ctx.fillRect(x - 2, y - 56, 4, 56); ctx.fillRect(x - 9, y - 4, 18, 4); ctx.fillRect(x - 10, y - 58, 20, 3);
    const k = 0.8 + 0.2 * Math.sin(this.t * 7) + this.flare;
    ctx.fillStyle = `rgba(255,${190 + 30 * Math.sin(this.t * 5)},90,${Math.min(1, 0.85 * k)})`; rr(ctx, x - 8, y - 72, 16, 15, 4); ctx.fill();
    ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.5; rr(ctx, x - 8, y - 72, 16, 15, 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - 72); ctx.lineTo(x, y - 57); ctx.stroke();
  }
  get light() { return { r: 140 + this.flare * 80, c: 'rgba(255,214,140,', y: this.y + 6 }; }
}
// day-only / night-only blocks: drawn as glowing lantern planks at night, sun-bleached planks by day
class TourPhaseBlocks extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.gi = s.g; this.rect = s.rect; this.state = s.state; this.x = s.rect[0] * TS; this.y = s.rect[1] * TS; this.w = (s.rect[2] - s.rect[0] + 1) * TS; this.h = (s.rect[3] - s.rect[1] + 1) * TS; this.back = true; this.k = 0; }
  get solid() { return this.g.toggleBit(this.gi) === (this.state === 'B'); }
  update(dt) { this.t += dt; this.k = approach(this.k, this.solid ? 1 : 0, dt * 4); }
  draw(ctx) {
    const night = this.state === 'B';
    if (this.k < 0.05) { ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = night ? '#a8c8ff' : '#ffd890'; ctx.setLineDash([3, 4]); ctx.strokeRect(this.x + 2, this.y + 2, this.w - 4, 8); ctx.restore(); return; }
    ctx.save(); ctx.globalAlpha = this.k;
    for (let x = this.x; x < this.x + this.w; x += TS) {
      if (night) { ctx.fillStyle = '#2a2a5a'; rr(ctx, x + 1, this.y, TS - 2, 10, 3); ctx.fill(); ctx.fillStyle = `rgba(255,220,120,${0.7 + 0.3 * Math.sin(this.t * 3 + x)})`; ctx.beginPath(); ctx.arc(x + TS / 2, this.y + 5, 3, 0, TAU); ctx.fill(); }
      else TourObj.plank(ctx, x + 1, this.y, TS - 2, 10, ['#e8c890', '#c8a070', '#8a6a44', '#fff0c8']);
    }
    ctx.restore();
  }
  get light() { return this.state === 'B' && this.k > 0.5 ? { r: 60, c: 'rgba(255,220,140,' } : null; }
}
Object.assign(ENTITY_TYPES, { lampPost: TourLampPost, phaseBlocks: TourPhaseBlocks });

/* ---------- DOOM: the pursuer (a stampede cloud, a lava flow, a tidal wave) ---------- */
// area chase: { speed (t/s), ramp (+t/s per checkpoint, 0.2), period (s: the periodic variant), lethal: false, look }
class TourDoom extends Ent {
  constructor(g, s) {
    super(g, s, 3 * TS, 12 * TS); const c = s.chase || {};
    this.speed = c.speed || 5.5; this.ramp = c.ramp != null ? c.ramp : 0.2; this.look = c.look || 'dust'; this.period = c.period || 0; this.front = -4 * TS; this.always = true; this.friendly = true; this.cps = 0; this.pass = 0;
  }
  update(dt) {
    const g = this.g, p = g.player; this.t += dt; if (g.state !== 'play' || !p) return;
    const cps = g.entities.filter(e => e instanceof Checkpoint && e.active).length; if (cps > this.cps) { this.cps = cps; this.speed += this.ramp; }
    if (this.period) {
      // the periodic variant: a horn 1.5 s before it sweeps past the whole screen
      this.pass += dt; const k = this.pass % this.period;
      if (k > this.period - 1.5 && !this.warned) { this.warned = true; TourKit.sfx('horn', 'artcarHorn', { vol: 0.5 }); g.toast && g.toast('HERE IT COMES!'); }
      if (k < dt) { this.warned = false; this.front = g.camX - 4 * TS; this.running = true; }
      if (this.running) { this.front += this.speed * 3 * TS * dt; if (this.front > g.camX + Game.viewW + 8 * TS) this.running = false; }
    } else this.front = Math.max(this.front + this.speed * TS * dt * (g.worldScale ? g.worldScale() : 1), g.camX - 10 * TS);   // after a respawn it catches up to 10 tiles behind
    this.x = this.front - this.w; this.y = g.camY - 2 * TS; this.h = Game.viewH + 4 * TS;
    if ((!this.period || this.running) && p.x < this.front && !p.dead && p.state === 'play') {
      // its front costs a hit and shoves Brady forward (never into a pit: back to solid ground)
      p.hurt(this); p.x = this.front + 3 * TS; p.vy = Math.min(p.vy, -6 * TS); g.shake(6);
      if (this.s.chase && this.s.chase.lethal) p.die('doom');
    }
    if (g.onScreen({ x: this.front - 40, y: g.camY, w: 80, h: 80 }, 0)) { g.shakeAmt = Math.max(g.shakeAmt || 0, 1.2); }
  }
  draw(ctx) {
    const g = this.g, x = this.front, y0 = g.camY - 20, y1 = g.camY + Game.viewH + 20;
    if (x < g.camX - 200) return;
    ctx.save();
    const cols = { dust: ['#c8a070', '#8a6040', 'rgba(220,190,150,'], lava: ['#ff8a2a', '#c8320a', 'rgba(255,160,60,'], wave: ['#5ac8f0', '#1a6aa8', 'rgba(220,250,255,'] }[this.look] || ['#c8a070', '#8a6040', 'rgba(220,190,150,'];
    const gr = ctx.createLinearGradient(x - 220, 0, x + 30, 0); gr.addColorStop(0, cols[1]); gr.addColorStop(0.8, cols[0]); gr.addColorStop(1, cols[2] + '0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 400, y0);
    for (let y = y0; y <= y1; y += 18) ctx.lineTo(x + Math.sin(this.t * 6 + y * 0.05) * 14 + Math.sin(this.t * 2.3 + y * 0.013) * 10, y);
    ctx.lineTo(x - 400, y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cols[2] + '0.7)'; for (let k = 0; k < 14; k++) { const yy = y0 + ((k * 61 + this.t * 90) % (y1 - y0)), r = 10 + (k % 4) * 7; ctx.beginPath(); ctx.arc(x - 10 + Math.sin(k + this.t * 4) * 12, yy, r, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
ENTITY_TYPES.tourDoom = TourDoom;
{
  const mk = Play.prototype.makeRuntimeArea;
  Play.prototype.makeRuntimeArea = function (idx) {
    const a = mk.call(this, idx);
    if (a.chase && a.chase.speed) { const d = new TourDoom(this, { x: 0, y: 0, chase: a.chase }); a.entities.push(d); }
    return a;
  };
}

/* ---------- CARRY: pedestals and the fragile thing Brady carries ---------- */
// pedestal { item: 'egg' | 'hatchling' | 'lantern', start, deliver }
Tour.pieces.pedestal = function (st, o) {
  const B = st.B, x = st.x; st.floor(x, x + 3);
  B.spawn('pedestal', x + 2, st.gy - 1, { item: o.item || 'egg', start: !!o.start, deliver: !!o.deliver, look: o.look || null });
  if (o.deliver) B.vkey('deliver', [[x + 2, st.gy - 1]]);
  if (o.deliver && o.lockAt != null) { const lx = x + 4 + o.lockAt, h = o.h || 3; st.floor(x + 4, lx + 1); tourShutterLock(B, lx, st.gy - h, st.gy - 1, 'deliver', o.lockLook); B.fill(lx, Math.max(0, st.gy - h - 8), lx, st.gy - h - 1, T.HARD); return lx + 2; }
  return x + 4;
};
class TourPedestal extends Ent {
  constructor(g, s) { super(g, s, 30, 36); this.item = s.item; this.start = s.start; this.deliver = s.deliver; this.has = !!s.start; this.skinName = s.look; this.carryItem = this.has; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; if (this.backT > 0 && (this.backT -= dt) <= 0 && !this.has) { this.has = true; this.carryItem = true; this.g.burst(this.cx, this.y, 8, '#ffffff', 'spark'); } }
  touchPlayer(p) {
    const g = this.g;
    if (this.has && !p.carrying && !(this.cool > 0)) { this.has = false; this.carryItem = false; p.carrying = { item: this.item, from: this, fallY: p.y }; TourKit.sfx('pickup', 'pick'); g.toast && g.toast('CARRY IT GENTLY: NO FIGHTING, NO BIG FALLS'); return; }
    // set it down: always on the delivery pedestal, on any other one with THROW
    if (p.carrying && !this.has && (this.deliver || Input.actionPressed)) {
      this.has = true; this.cool = 1; this.carryItem = true; const it = p.carrying; p.carrying = null; it.home = this;
      if (this.deliver && !this.done) { this.done = true; TourLock.open(g, 'deliver'); g.burst(this.cx, this.y, 24, '#ffe8a0', 'confetti'); TourKit.sfx('deliver', 'checkpoint'); g.toast && g.toast('DELIVERED!'); }
      else TourKit.sfx('place', 'select');
    }
  }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.cx, y = this.y + this.h;
    Ink.around(ctx, this.x - 4, this.y - 2, this.w + 8, this.h + 4, c => { c.fillStyle = '#c8b090'; rr(c, x - 14, y - 10, 28, 10, 3); c.fill(); c.fillStyle = '#b09a78'; c.fillRect(x - 9, y - 26, 18, 16); c.fillStyle = '#e0cca8'; rr(c, x - 13, y - 30, 26, 5, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x - 7, y - 25, 3, 14); }, { pad: 6 });
    if (this.deliver) { ctx.fillStyle = this.done ? '#7ae07a' : `rgba(255,216,74,${0.6 + 0.4 * Math.sin(this.t * 4)})`; ctx.beginPath(); TourKit.star(ctx, x, y - 18, 5, 2.2, 5); ctx.fill(); }
    if (this.has) TourCarryArt.draw(ctx, this.item, x, y - 30, this.t);
  }
}
const TourCarryArt = {
  draw(ctx, item, x, y, t) {
    if (item === 'lantern') { ctx.fillStyle = '#3a3440'; ctx.fillRect(x - 6, y - 4, 12, 3); ctx.fillStyle = `rgba(255,${200 + 20 * Math.sin(t * 6)},110,0.95)`; rr(ctx, x - 6, y - 17, 12, 13, 3); ctx.fill(); return; }
    if (item === 'hatchling') { ctx.fillStyle = '#5a7a3a'; ctx.beginPath(); ctx.ellipse(x, y - 7, 9, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a9a4a'; ctx.beginPath(); ctx.arc(x + 8, y - 10, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x + 9.5, y - 11, 1, 0, TAU); ctx.fill(); return; }
    ctx.fillStyle = '#fff8e8'; ctx.beginPath(); ctx.ellipse(x, y - 9, 7, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(200,180,150,0.6)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 3 + (k % 2) * 5, y - 13 + k * 2.5, 1.2, 0, TAU); ctx.fill(); }
  }
};
ENTITY_TYPES.pedestal = TourPedestal;
// carrying: lower jumps, no attacks (THROW sets it down on a pedestal or plate), a hit / big fall / water sends it home
{
  const pu = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const c = this.carrying;
    if (c && this.state === 'play' && !this.dead) {
      if (this.onGround) { if (this.y - c.fallY > 6 * TS) this.dropCarry('FALL!'); c.fallY = this.y; } else c.fallY = Math.min(c.fallY, this.y);
      if (this.inWater) this.dropCarry('SPLASH!');
      if (inp.actionPressed) inp = Object.assign({}, inp, { actionPressed: false });
    }
    return pu.call(this, dt, inp);
  };
  Player.prototype.dropCarry = function (why) {
    const c = this.carrying; if (!c) return; this.carrying = null;
    this.g.parts.text(this.cx, this.y - 12, why || 'OOPS!', '#ffffff'); TourKit.sfx('oops', 'bump');
    const home = c.home || c.from; if (home) home.backT = 1.5;   // it reappears on its pedestal
  };
  const hurt = Player.prototype.hurt;
  Player.prototype.hurt = function (src) { if (this.carrying && this.invuln <= 0 && this.star <= 0) this.dropCarry('DROPPED IT!'); return hurt.call(this, src); };
  const dr = TourPlayerFx.over;
  TourPlayerFx.over = function (ctx, p, t) { dr.call(this, ctx, p, t); if (p.carrying && !p.dead) TourCarryArt.draw(ctx, p.carrying.item, p.cx, p.y - 2 + Math.sin(t * 6) * 1, t); };
  // a door to another area makes a new Player: whatever he carried goes home to its pedestal instead of vanishing
  const la = Play.prototype.loadArea;
  Play.prototype.loadArea = function (idx, x, y, power) { const p = this.player; if (p && p.carrying && p.dropCarry) p.dropCarry('SET DOWN'); return la.call(this, idx, x, y, power); };
  // and a door asks him to set it down first (on a pedestal, with THROW) rather than taking it through
  const ep = Play.prototype.enterPortal;
  Play.prototype.enterPortal = function (portal) { const p = this.player; if (p && p.carrying && portal && portal.target && portal.target.area !== this.area.idx) { if (!(this.carryToldT > this.t)) { this.carryToldT = this.t + 3; this.toast && this.toast('SET IT DOWN ON A STONE FIRST (THROW)'); } return; } return ep.call(this, portal); };
}

/* ---------- 9. wheel: platforms on rotating arms ---------- */
Tour.pieces.wheel = function (st, o) {
  const B = st.B, x = st.x, r = o.r || 4, arms = o.arms || 4, speed = o.speed || 0.6;
  st.floor(x, x + 1); const cx = x + 3 + r, cy = st.gy - r - 2; st.pit(x + 2, x + 4 + r * 2);
  const hub = 'wheel' + x;
  B.spawn('wheelHub', cx, cy, { r, arms, hub, skin: o.skin || null });
  for (let k = 0; k < arms; k++) B.spawn('mplat', cx - 1, cy, { pw: 3, orbit: r * TS, speed, phase: k * TAU / arms / speed, hub, skin: o.skin ? o.skin + 'Seat' : 'tourWheelSeat' });
  for (let a = 0; a < 8; a++) { const ang = a / 8 * TAU, gx = Math.round(cx + Math.cos(ang) * r), gy = Math.round(cy + 1 + Math.sin(ang) * r); for (let q = -1; q <= 1; q++) B.ghosts.push([gx + q, gy]); }
  st.floor(x + 5 + r * 2, x + 7 + r * 2);
  return x + 8 + r * 2;
};
class TourWheelHub extends Ent {
  constructor(g, s) { super(g, s, 2 * s.r * TS, 2 * s.r * TS); this.cxp = s.x; this.cyp = s.y - TS / 2; this.x = this.cxp - this.w / 2; this.y = this.cyp - this.h / 2; this.r = s.r * TS; this.arms = s.arms; this.back = true; this.skinName = s.skin; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const plats = this.g.entities.filter(e => e.isPlatform && e.orbit && e.s.hub === this.s.hub);
    if (plats[0]) { this.cxp = plats[0].hx + plats[0].w / 2; this.cyp = plats[0].hy + 4; }
    ctx.save(); ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 4;
    for (const p of plats) { ctx.beginPath(); ctx.moveTo(this.cxp, this.cyp); ctx.lineTo(p.x + p.w / 2, p.y + 4); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(122,90,58,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.cxp, this.cyp, this.r, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#c8902a'; ctx.beginPath(); ctx.arc(this.cxp, this.cyp, 9, 0, TAU); ctx.fill(); TourObj.bolt(ctx, this.cxp, this.cyp, 3.5);
    ctx.fillStyle = '#5e3417'; ctx.fillRect(this.cxp - 3, this.cyp, 6, this.r + 2 * TS);
    ctx.restore();
  }
}
PlatformArt.tourWheelSeat = (ctx, p, t) => { TourObj.plank(ctx, p.x, p.y, p.w, 10); ctx.fillStyle = '#c8902a'; ctx.fillRect(p.x + p.w / 2 - 2, p.y - 6, 4, 6); };
ENTITY_TYPES.wheelHub = TourWheelHub;

/* ---------- 8. seesaw: land hard on the raised end and it slams down, flinging what's on the other end (or Brady) ---------- */
Tour.pieces.seesaw = function (st, o) {
  const B = st.B, x = st.x, len = o.len || 6;
  st.floor(x, x + len + 3);
  B.spawn('seesaw', x + 2 + Math.floor(len / 2), st.gy - 1, { len, skin: o.skin || null });
  for (let q = 0; q < len; q++) B.ghosts.push([x + 2 + q, st.gy - 1]);
  B.springs.push([x + 2, st.gy - 1], [x + 1 + len, st.gy - 1]);
  return x + len + 4;
};
class TourSeesaw extends Ent {
  constructor(g, s) { super(g, s, (s.len || 6) * TS, 12); this.y = s.y - 26; this.tilt = -1; this.k = -1; this.isPlatform = true; this.dx = 0; this.dy = 0; this.skinName = s.skin; }
  endY(side) { return this.y + 13 + side * this.k * 11; }
  update(dt) {
    this.t += dt; this.k = approach(this.k, this.tilt, dt * 6);
    const p = this.g.player; if (!p || p.dead) return;
    const on = p.ride === this, landed = on && !this.wasOn; this.wasOn = on;
    if (!on) this.fallVy = p.vy;   // entities update before Brady: this is his speed the frame before he lands
    if (landed) {
      const side = p.cx < this.cx ? -1 : 1, raised = this.tilt === -side;
      if (raised && (this.fallVy || 0) > 6 * TS) {
        // slam: this end goes down, the other end flings up whatever is on it; Brady himself bounces at spring strength
        this.tilt = side; this.g.shake(3); TourKit.sfx('seesaw', 'spring', { vol: 0.7 });
        for (const e of this.g.entities) if (e !== this && (e.enemy || e.prop) && !e.dead && Math.abs(e.cx - (this.cx - side * this.w / 2.5)) < this.w / 3 && Math.abs(e.y + e.h - this.y) < 30) { e.vy = -14 * TS; if (e.prop && e.fling) e.fling(-side * 2 * TS, -14 * TS); }
        p.vy = -PHYS.springV * 0.85; p.jumping = false; p.onGround = false; p.ride = null; p.springT = 0.1; this.wasOn = false;   // a throw, not a jump: no jump cut
      } else if (!raised) this.tilt = side;
    }
  }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const cx = this.cx, cy = this.y + 13, a = Math.atan2(this.k * 22, this.w);
    ctx.save(); ctx.fillStyle = '#6a6470'; ctx.beginPath(); ctx.moveTo(cx - 12, cy + 14); ctx.lineTo(cx, cy); ctx.lineTo(cx + 12, cy + 14); ctx.fill();
    ctx.translate(cx, cy); ctx.rotate(a); TourObj.plank(ctx, -this.w / 2, -5, this.w, 10); ctx.restore(); TourObj.bolt(ctx, cx, cy, 3);
  }
}
ENTITY_TYPES.seesaw = TourSeesaw;

/* ---------- 12. balloon: stand in the basket and it rises, drifting; it sinks back when empty ---------- */
Tour.pieces.balloon = function (st, o) {
  const B = st.B, x = st.x, rise = o.rise || 8, drift = o.drift || 2;
  st.floor(x, x + 4);
  B.spawn('balloon', x + 2, st.gy - 1, { rise, drift, skin: o.skin || null });
  for (let k = 0; k <= rise; k++) { const gx = x + 1 + Math.round(drift * k / rise); for (let q = 0; q < 3; q++) B.ghosts.push([gx + q, st.gy - 1 - k]); }
  return x + 5 + drift;
};
class TourBalloon extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, 12); this.x = s.x - 1.5 * TS + TS / 2; this.y = s.y - 12; this.hx = this.x; this.hy = this.y; this.rise = (s.rise || 8) * TS; this.drift = (s.drift || 2) * TS; this.u = 0; this.isPlatform = true; this.dx = 0; this.dy = 0; this.skinName = s.skin; }
  update(dt) {
    this.t += dt; const p = this.g.player, on = p && p.ride === this;
    this.u = clamp(this.u + (on ? 0.8 * TS / this.rise : -0.6 * TS / this.rise) * dt, 0, 1);
    const nx = this.hx + this.drift * this.u, ny = this.hy - this.rise * this.u + Math.sin(this.t * 1.6) * 2;
    this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny;
  }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.cx, y = this.y, C = Tour.countryOf(this.g.id), col = (C && C.colors) || { a: '#ff4f8a', b: '#38c8ff', c: '#ffd84a' };
    Ink.around(ctx, this.x - 20, y - 130, this.w + 40, 145, c => {
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 1.5; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 18, y); c.lineTo(x + s * 24, y - 62); c.stroke(); }
      for (let k = 0; k < 6; k++) { c.fillStyle = [col.a, col.c, col.b][k % 3]; c.beginPath(); c.moveTo(x, y - 128); c.quadraticCurveTo(x - 46 + k * 15.3, y - 110, x - 26 + k * 10.5, y - 62); c.lineTo(x - 26 + (k + 1) * 10.5, y - 62); c.quadraticCurveTo(x - 46 + (k + 1) * 15.3, y - 110, x, y - 128); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(x - 14, y - 104, 6, 14, -0.3, 0, TAU); c.fill();
      c.fillStyle = '#a07a44'; rr(c, this.x + 6, y - 2, this.w - 12, 16, 4); c.fill(); c.strokeStyle = '#6a4a2a'; c.lineWidth = 1; for (let xx = this.x + 10; xx < this.x + this.w - 8; xx += 6) { c.beginPath(); c.moveTo(xx, y); c.lineTo(xx, y + 13); c.stroke(); }
    }, { pad: 10 });
  }
}
ENTITY_TYPES.balloon = TourBalloon;

/* ---------- 14. mirrors and a sun receptor: turn the mirrors so the sunbeam reaches the receptor ---------- */
// mirrors { mirrors: [[dx, dy], ...] (relative to the cursor and the ground row), receptor: [dx, dy], opens, lockAt, h }
Tour.pieces.mirrors = function (st, o) {
  const B = st.B, x = st.x, id = o.opens || 'sun' + x;
  const ms = (o.mirrors || [[4, -2], [4, -5]]).map(([dx, dy]) => [x + dx, st.gy + dy]), rc = o.receptor || [8, -5], rx = x + rc[0], ry = st.gy + rc[1];
  const src = [x, st.gy + (o.sourceDy != null ? o.sourceDy : ms[0][1] - st.gy)];
  // solve: which mirror angles ('/' or '\') carry the beam from the source to the receptor? (asserted here)
  const sol = TourBeam.solve(B, src, ms, [rx, ry]);
  if (!sol && st.ctx.problems) st.ctx.problems.push(`mirrors at ${x}: no setting carries the beam to the receptor`);
  const end = Math.max(rx, ...ms.map(m => m[0])) + 2;
  st.floor(x, end);
  B.spawn('sunSource', src[0], src[1], {});
  ms.forEach((m, k) => B.spawn('mirror', m[0], m[1], { k, set: sol ? sol[k] : 0, start: sol ? 1 - sol[k] : 0, opens: id }));
  B.spawn('sunReceptor', rx, ry, { opens: id });
  B.vkey(id, ms.map(m => [m[0], m[1] + 1]), 'all');
  if (o.lockAt != null) { const lx = end + o.lockAt, h = o.h || 3; st.floor(end, lx + 1); tourShutterLock(B, lx, st.gy - h, st.gy - 1, id, o.lockLook); B.fill(lx, Math.max(0, st.gy - h - 6), lx, st.gy - h - 1, T.HARD); return lx + 2; }
  return end + 1;
};
const TourBeam = {
  // trace a beam from (sx, sy) heading right over mirrors with states ('/' = 0 turns right->up, '\' = 1 turns right->down)
  trace(tiles, src, mirrors, states, maxSteps) {
    let x = src[0], y = src[1], dx = 1, dy = 0; const path = [[x, y]];
    for (let s = 0; s < (maxSteps || 120); s++) {
      x += dx; y += dy; path.push([x, y]);
      const k = mirrors.findIndex(m => m[0] === x && m[1] === y);
      if (k >= 0) { const st = states[k]; if (st === 0) { const t = dx; dx = -dy; dy = -t; } else { const t = dx; dx = dy; dy = t; } continue; }
      if (tiles(x, y)) return { path, hit: [x, y] };
    }
    return { path, hit: null };
  },
  solve(B, src, mirrors, rec) {
    const tiles = (x, y) => SOLID[B.get(x, y)];
    for (let mask = 0; mask < (1 << mirrors.length); mask++) {
      const states = mirrors.map((m, k) => (mask >> k) & 1), r = this.trace((x, y) => (x === rec[0] && y === rec[1]) || tiles(x, y), src, mirrors, states);
      if (r.hit && r.hit[0] === rec[0] && r.hit[1] === rec[1]) return states;
    }
    return null;
  }
};
class TourSunSource extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.y = s.y - TS; this.back = true; }
  update(dt) {
    this.t += dt; const g = this.g, ms = g.entities.filter(e => e instanceof TourMirror), rc = g.entities.find(e => e instanceof TourSunReceptor);
    const src = [Math.floor(this.cx / TS), Math.floor(this.cy / TS)], mpos = ms.map(m => [m.tx, m.ty]), states = ms.map(m => m.state);
    const r = TourBeam.trace((x, y) => (rc && x === rc.tx && y === rc.ty) || SOLID[tileAt(g.area, x, y)], src, mpos, states);
    this.path = r.path; this.lit = !!(rc && r.hit && r.hit[0] === rc.tx && r.hit[1] === rc.ty);
    if (rc) rc.setLit(this.lit);
  }
  draw(ctx) {
    const x = this.cx, y = this.cy;
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + this.t; ctx.fillRect(x + Math.cos(a) * 13 - 2, y + Math.sin(a) * 13 - 2, 4, 4); }
    if (this.path) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,240,170,0.75)'; ctx.lineWidth = 5; ctx.beginPath(); this.path.forEach(([px, py], i) => i ? ctx.lineTo(px * TS + 16, py * TS + 16) : ctx.moveTo(px * TS + 16, py * TS + 16)); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
  }
  get light() { return { r: 90, c: 'rgba(255,230,150,' }; }
}
class TourMirror extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.y = s.y - TS; this.tx = Math.floor(s.x / TS); this.ty = Math.floor((s.y - 1) / TS); this.state = s.start || 0; this.cool = 0; this.mirror = true; this.k = this.state; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; this.k = approach(this.k, this.state, dt * 6); }
  turn() { if (this.cool > 0) return; this.cool = 0.3; this.state = 1 - this.state; TourKit.sfx('mirror', 'select', { pitch: 1.4 }); this.g.burst(this.cx, this.cy, 6, '#ffffff', 'spark'); }
  touchPlayer(p) { if (Input.actionPressed || (p.inp && p.inp.actionPressed) || (p.vy < 0 && p.y > this.y + 10)) this.turn(); }
  hit(kind) { if (kind === 'plane' || kind === 'bump' || kind === 'kazoo') { this.turn(); return true; } return false; }
  draw(ctx) {
    const x = this.cx, y = this.cy, a = (this.k ? 1 : -1) * Math.PI / 4 + (this.k - Math.round(this.k)) * 0.5;
    ctx.fillStyle = '#6a6470'; ctx.fillRect(x - 3, y + 6, 6, 10);
    ctx.save(); ctx.translate(x, y); ctx.rotate(this.state ? Math.PI / 4 : -Math.PI / 4);
    ctx.fillStyle = '#c8902a'; rr(ctx, -15, -4, 30, 8, 3); ctx.fill(); const g = ctx.createLinearGradient(-13, 0, 13, 0); g.addColorStop(0, '#c8e0ff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#a8c0e8'); ctx.fillStyle = g; rr(ctx, -13, -2.5, 26, 5, 2); ctx.fill();
    ctx.restore();
  }
}
class TourSunReceptor extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.y = s.y - TS; this.tx = Math.floor(s.x / TS); this.ty = Math.floor((s.y - 1) / TS); this.opens = s.opens; this.lit = false; this.k = 0; }
  setLit(l) { if (l && !this.lit) { TourLock.open(this.g, this.opens); this.g.burst(this.cx, this.cy, 20, '#ffd84a', 'confetti'); TourKit.sfx('ding', 'checkpoint'); } this.lit = this.lit || l; }
  update(dt) { this.t += dt; this.k = approach(this.k, this.lit ? 1 : 0, dt * 3); }
  draw(ctx) { const x = this.cx, y = this.cy; ctx.fillStyle = '#4a4654'; rr(ctx, x - 13, y - 13, 26, 26, 6); ctx.fill(); ctx.fillStyle = this.lit ? `rgba(255,${200 + 40 * Math.sin(this.t * 6)},80,1)` : '#2a2430'; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.stroke(); }
  get light() { return this.lit ? { r: 110, c: 'rgba(255,220,120,' } : null; }
}
Object.assign(ENTITY_TYPES, { sunSource: TourSunSource, mirror: TourMirror, sunReceptor: TourSunReceptor });

/* Brady upside down in a flip band */
{
  const dr = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    if (!this.flipped) return dr.call(this, ctx, t);
    ctx.save(); ctx.translate(0, this.y + this.h / 2); ctx.scale(1, -1); ctx.translate(0, -(this.y + this.h / 2));
    dr.call(this, ctx, t); ctx.restore();
  };
}

/* ============================================================
   Level-flow entities (§6.2): HOLD arenas, the THIEF, the RACE
   rival, SNEAK watchers, Bottle Mail and the Souvenir Stand.
   ============================================================ */

// a white label with a dark outline (readable over any sky)
TourObj.label = function (ctx, text, x, y, size, col) {
  ctx.save(); ctx.font = `bold ${size || 11}px sans-serif`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(30,16,40,0.85)'; ctx.lineWidth = 4; ctx.strokeText(text, x, y); ctx.fillStyle = col || '#ffffff'; ctx.fillText(text, x, y); ctx.restore();
};

/* ---------- HOLD: an arena that shuts, plays waves, then opens ---------- */
// hold { w: 26, waves: [[type, ...], ...] (default: 3 waves of 3/4/5 from the level's mix), dur: 20 }
Tour.pieces.hold = function (st, o) {
  const B = st.B, x = st.x, w = o.w || 26, gy = st.gy;
  st.floor(x, x + w - 1);
  for (let yy = Math.max(0, gy - 13); yy < gy; yy++) for (let xx = x + 1; xx < x + w - 1; xx++) B.set(xx, yy, T.EMPTY);
  const waves = o.waves || [3, 4, 5].map(n => Array.from({ length: n }, () => st.pickEnemy())).map(L => L.filter(Boolean));
  B.spawn('holdArena', x, gy - 1, { w, waves, dur: o.dur || 20, gy });
  st.coins(x + 4, x + w - 5, gy - 4);
  return x + w;
};
class TourHoldArena extends Ent {
  constructor(g, s) {
    super(g, s, s.w * TS, 13 * TS); this.x = s.x - TS / 2; this.y = s.gy * TS - this.h; this.tx0 = Math.floor(this.x / TS); this.gy = s.gy;
    this.waves = s.waves || []; this.dur = s.dur || 20; this.state = 'idle'; this.wave = 0; this.wt = 0; this.spawned = 0; this.back = true; this.friendly = true; this.mine = [];
  }
  walls(on) {
    const g = this.g; for (const tx of [this.tx0, this.tx0 + this.s.w - 1]) for (let ty = this.gy - 6; ty < this.gy; ty++) g.setTile(tx, ty, on ? T.HARD : T.EMPTY);
    g.shake(on ? 4 : 2); TourKit.sfx(on ? 'slam' : 'door', 'bump', { vol: 0.8 });
  }
  change(k) {
    // each wave changes the arena: ledges appear, then the floor turns to a belt
    const g = this.g, c = this.tx0 + Math.floor(this.s.w / 2);
    if (k === 1) for (const dx of [-7, -6, -5, 5, 6, 7]) g.setTile(c + dx, this.gy - 4, T.SEMI);
    if (k === 2) for (let dx = -3; dx <= 3; dx++) g.setTile(c + dx, this.gy, dx < 0 ? T.CONV_R : T.CONV_L);
    g.burst(c * TS, (this.gy - 3) * TS, 16, '#ffffff', 'dust');
  }
  update(dt) {
    const g = this.g, p = g.player; this.t += dt; if (!p || p.dead) return;
    if (this.state === 'idle' && p.cx > this.x + 2 * TS && p.cx < this.x + this.w - 2 * TS && p.onGround) {
      this.state = 'run'; this.walls(true); g.bossLock = { x0: this.x, x1: this.x + this.w, hold: this }; this.startWave(0);
    }
    if (this.state !== 'run') return;
    this.wt += dt;
    const L = this.waves[this.wave] || [], every = Math.max(1.2, (this.dur * 0.6) / Math.max(1, L.length));
    while (this.spawned < L.length && this.wt > 0.8 + this.spawned * every) this.spawnFoe(L[this.spawned++]);
    this.mine = this.mine.filter(e => !e.dead && !e.remove);
    if (this.wt > this.dur || (this.spawned >= L.length && !this.mine.length && this.wt > 4)) {
      if (this.wave + 1 < this.waves.length) this.startWave(this.wave + 1);
      else { this.state = 'done'; this.walls(false); if (g.bossLock && g.bossLock.hold === this) g.bossLock = null; g.toast && g.toast('PLAZA CLEAR!'); g.burst(this.cx, this.y + this.h / 2, 30, '#ffd84a', 'confetti'); for (const e of this.mine) e.hit && e.hit('star', p); }
    }
  }
  startWave(k) { this.wave = k; this.wt = 0; this.spawned = 0; if (k) this.change(k); this.g.toast && this.g.toast('WAVE ' + (k + 1)); TourKit.sfx('wave', 'artcarHorn', { vol: 0.5 }); }
  spawnFoe(type) {
    const g = this.g, C = ENTITY_TYPES[type]; if (!C) return;
    const side = this.spawned % 2 ? 1 : -1, x = side < 0 ? this.x + 2.5 * TS : this.x + this.w - 2.5 * TS;
    const info = Tour.enemyInfo && Tour.enemyInfo[type], fly = info && info.place === 'fly';
    const e = new C(g, { type, x, y: fly ? (this.gy - 6) * TS : (this.gy - 3) * TS, dir: -side });
    g.spawn(e); this.mine.push(e); g.burst(x, e.y + e.h / 2, 10, '#ffffff', 'dust');
  }
  draw(ctx) {
    if (this.state !== 'run') return;
    // the wave bar over the arena
    const L = this.waves[this.wave] || [], k = clamp(this.wt / this.dur, 0, 1), x = this.cx - 60, y = Math.max(this.y + 10, this.g.camY + 96);
    ctx.fillStyle = 'rgba(20,10,30,0.6)'; rr(ctx, x - 4, y - 4, 128, 16, 6); ctx.fill(); ctx.fillStyle = '#ffd84a'; rr(ctx, x, y, 120 * (1 - k), 8, 4); ctx.fill();
    TourObj.label(ctx, 'WAVE ' + (this.wave + 1) + ' / ' + this.waves.length, this.cx, y + 26, 12);
  }
}
ENTITY_TYPES.holdArena = TourHoldArena;

/* ---------- THIEF: snatches the stamps, caught three times ---------- */
// thief { type: art type (an itemThief enemy), look }: the start; thiefStop { n: 1..3, lock: h } along the route
Tour.pieces.thief = function (st, o) {
  const B = st.B, x = st.x; st.floor(x, x + 7);
  B.spawn('tourThief', x + 6, st.gy - 1, { art: o.type || null, look: o.look || null });
  B.route.push([x + 6, st.gy - 1]);
  return x + 8;
};
Tour.pieces.thiefStop = function (st, o) {
  const B = st.B, x = st.x, n = o.n || 1; st.floor(x, x + 5);
  B.route.push([x + 3, st.gy - 1, n]);
  B.vkey('stamp' + n, [[x + 3, st.gy - 1]]);
  if (o.lock) { tourShutterLock(B, x + 6, st.gy - (o.lock === true ? 3 : o.lock), st.gy - 1, 'stamp3', o.lockLook); st.floor(x + 6, x + 8); B.fill(x + 6, Math.max(0, st.gy - 9), x + 6, st.gy - (o.lock === true ? 3 : o.lock) - 1, T.HARD); return x + 9; }
  return x + 6;
};
class TourThief extends Ent {
  constructor(g, s) {
    super(g, s, 26, 26); this.state = 'wait'; this.stop = 0; this.caught = 0; this.friendly = true; this.enemy = true;   // friendly: updated off screen too; it checks Brady itself
    this.cool = 0; this.skinName = s.look; this.hop = null;
    const A = g.area;
    this.route = ((A && A.route) || []).filter(r => r[2]).sort((a, b) => a[2] - b[2]).map(r => ({ x: r[0] * TS + TS / 2, y: (r[1] + 1) * TS, n: r[2] }));
    const C = s.art && ENTITY_TYPES[s.art]; this.artCfg = C && C.cfg ? C.cfg : null;
  }
  get light() { return null; }
  leapTo(pt) { this.hop = { x0: this.cx, y0: this.y + this.h, x1: pt.x, y1: pt.y, t: 0, T: clamp(Math.abs(pt.x - this.cx) / (9 * TS), 0.6, 3.5) }; this.state = 'run'; this.dir = sign(pt.x - this.cx) || 1; }
  update(dt) {
    const g = this.g, p = g.player; this.t += dt; if (this.cool > 0) this.cool -= dt;
    if (p && !p.dead && p.state === 'play') this.collidePlayer(p);
    if (this.hop) {
      const H = this.hop; H.t += dt; const k = clamp(H.t / H.T, 0, 1), hops = Math.max(1, Math.round(Math.abs(H.x1 - H.x0) / (5 * TS)));
      const arc = Math.abs(Math.sin(k * Math.PI * hops)) * 2.2 * TS + Math.sin(k * Math.PI) * Math.max(0, Math.min(H.y0, H.y1) - Math.min(H.y0, H.y1)) ;
      this.x = lerp(H.x0, H.x1, k) - this.w / 2; this.y = lerp(H.y0, H.y1, k) - this.h - arc - Math.sin(k * Math.PI) * 3 * TS;
      if (k >= 1) { this.hop = null; this.state = 'wait'; }
      return;
    }
    if (!p) return;
    // the snatch gag: Brady comes close, it grabs the stamps and runs
    if (this.stop === 0 && this.state === 'wait' && Math.abs(p.cx - this.cx) < 6 * TS) {
      this.state = 'snatch'; this.st = 0; g.parts.text(this.cx, this.y - 14, 'MY STAMPS NOW!', '#ffd84a'); TourKit.sfx('snatch', 'pick', { pitch: 0.7 });
    }
    if (this.state === 'snatch') { this.st += dt; if (this.st > 0.8 && this.route[0]) { this.stop = 1; this.leapTo(this.route[0]); } return; }
    if (this.state === 'wait' && this.stop > 0) {
      this.dir = sign(p.cx - this.cx) || 1;
      if (Math.abs(p.cx - this.cx) > 12 * TS && Math.floor(this.t * 2) % 4 === 0 && !this.taunted) { this.taunted = true; g.parts.text(this.cx, this.y - 14, 'CATCH ME!', '#ffffff'); }
      if (Math.floor(this.t * 2) % 4 !== 0) this.taunted = false;
    }
  }
  catchIt() {
    if (this.cool > 0 || this.hop || this.stop === 0 || this.state === 'snatch') return false;
    const g = this.g; this.cool = 1; this.caught++;
    TourLock.open(g, 'stamp' + this.caught); g.burst(this.cx, this.y, 18, '#ff9ad8', 'confetti'); g.parts.text(this.cx, this.y - 16, 'STAMP ' + this.caught + '/3', '#ffd84a'); TourKit.sfx('stamp', 'checkpoint');
    const next = this.route[this.stop];
    if (this.caught >= 3 || !next) { this.state = 'gone'; this.leapTo({ x: this.cx + 30 * TS, y: this.y + this.h - 8 * TS }); this.hop.T = 1.5; this.done = true; return true; }
    this.stop++; this.leapTo(next); return true;
  }
  collidePlayer(p) {
    if (!overlap(p, this)) return;
    if (p.vy > 0 && p.prevBottom <= this.y + this.h * 0.6) { if (this.catchIt()) { p.vy = -PHYS.stompV; p.jumping = true; } }
    else if (p.star > 0 || p.dashT > 0) this.catchIt();
  }
  hit(kind) { return this.catchIt(); }
  draw(ctx) {
    if (this.done && !this.hop) return;
    if (TourObj.skin(ctx, this, this.skinName)) return;
    if (this.artCfg && this.artCfg.art) { this.artCfg.art(ctx, this, this.cx, this.y + this.h, this.hop ? 'flee' : this.state === 'snatch' ? 'grab' : 'idle', this.t); }
    else {
      // a masked raccoon-ish bandit in a striped shirt with a satchel of stamps
      const x = this.cx, y = this.y + this.h, d = this.dir || 1, b = this.hop ? Math.sin(this.t * 20) * 2 : 0;
      Ink.around(ctx, this.x - 10, this.y - 12, this.w + 20, this.h + 14, c => {
        c.fillStyle = '#8a8a9a'; c.beginPath(); c.ellipse(x, y - 11 + b, 11, 10, 0, 0, TAU); c.fill();
        c.fillStyle = '#e8e8f0'; c.fillRect(x - 9, y - 12 + b, 18, 3); c.fillRect(x - 9, y - 7 + b, 18, 3);
        c.fillStyle = '#9a9aaa'; c.beginPath(); c.arc(x + d * 6, y - 22 + b, 8, 0, TAU); c.fill();
        c.fillStyle = '#2a2430'; c.fillRect(x + d * 6 - 7, y - 25 + b, 14, 4);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x + d * 8, y - 23 + b, 1.6, 0, TAU); c.fill();
        c.fillStyle = '#c8902a'; rr(c, x - d * 12, y - 16 + b, 9, 8, 2); c.fill();
        c.strokeStyle = '#8a8a9a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - d * 10, y - 8); c.quadraticCurveTo(x - d * 20, y - 14 + Math.sin(this.t * 8) * 3, x - d * 18, y - 24); c.stroke();
      }, { pad: 8 });
    }
    for (let k = 0; k < 3 - this.caught; k++) { ctx.fillStyle = ['#ff6a8a', '#5ac8ff', '#ffd84a'][k]; rr(ctx, this.cx - 12 + k * 9, this.y - 16, 7, 8, 1.5); ctx.fill(); }
  }
}
ENTITY_TYPES.tourThief = TourThief;

/* ---------- RACE: the rival runs the course to the gate ---------- */
// rival { look, speed (t/s, 6), name }: the starting line. The rival's path is read from the tiles at run time.
Tour.pieces.rival = function (st, o) {
  const B = st.B, x = st.x; st.floor(x, x + 7);
  B.spawn('tourRival', x + 5, st.gy - 1, { speed: o.speed || 6, look: o.look || null, name: o.name || 'RIVAL', art: o.type || null });
  return x + 8;
};
class TourRival extends Ent {
  constructor(g, s) {
    super(g, s, 26, 30); this.friendly = true; this.speed = (s.speed || 6) * TS; this.state = 'count'; this.ct = 3.4; this.name = s.name; this.skinName = s.look; this.dir = 1;
    const C = s.art && ENTITY_TYPES[s.art]; this.artCfg = C && C.cfg ? C.cfg : null;
    this.path = this.plan(); this.pi = 0; this.hop = null;
  }
  // the course: the surface the rival runs on, one point per column, from the start to the main gate
  plan() {
    const A = this.g.area || this.g.level.areas[0], W = A.W, H = A.H, tiles = A.tiles;
    const gate = (this.g.level.areas[A.idx || 0].spawns || []).find(s => s.type === 'gate' && !s.secret);
    const gx = gate ? Math.floor(gate.x / TS) : W - 4; this.gateX = gate ? gate.x : (W - 4) * TS;
    const solid = (x, y) => y >= 0 && y < H && (SOLID[tiles[y * W + x]] || tiles[y * W + x] === T.SEMI) && tiles[y * W + x] !== T.SPIKES && tiles[y * W + x] !== T.LAVA;
    const free = (x, y) => y < 0 || !SOLID[tiles[y * W + x]];
    const pts = []; let y = Math.floor((this.y + this.h) / TS);
    for (let x = Math.floor(this.cx / TS); x <= gx; x++) {
      let best = null;
      for (let dy = -5; dy <= 6 && best == null; dy++) { for (const s of dy ? [-1, 1] : [1]) { const yy = y + dy * s; if (yy > 0 && yy < H && solid(x, yy) && free(x, yy - 1) && free(x, yy - 2)) { best = yy; break; } } }
      if (best != null) { pts.push({ x: x * TS + TS / 2, y: best * TS }); y = best; }
    }
    return pts;
  }
  update(dt) {
    const g = this.g, p = g.player; this.t += dt; if (!p) return;
    if (this.state === 'count') {
      const was = Math.ceil(this.ct); this.ct -= dt; const now = Math.ceil(this.ct);
      if (now !== was && now > 0) { TourKit.sfx('count', 'select', { pitch: 1 + (3 - now) * 0.15 }); }
      if (this.ct <= 0) { this.state = 'run'; g.parts.text(this.cx, this.y - 20, 'GO!', '#7aff7a'); TourKit.sfx('go', 'checkpoint'); }
      return;
    }
    if (this.state === 'run') {
      // Brady far behind: the rival waits at the next checkpoint
      const cpAhead = g.entities.find(e => e instanceof Checkpoint && !e.active && e.x > this.cx - TS && e.x < this.cx + TS);
      if (cpAhead && p.cx < this.cx - 15 * TS) { this.dir = -1; return; }
      let move = this.speed * dt;
      while (move > 0 && this.pi < this.path.length - 1) {
        const a = this.path[this.pi], b = this.path[this.pi + 1], seg = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        this.u = (this.u || 0) + move / seg; move = 0;
        if (this.u >= 1) { move = (this.u - 1) * seg; this.u = 0; this.pi++; }
      }
      const a = this.path[this.pi], b = this.path[Math.min(this.pi + 1, this.path.length - 1)];
      if (a) {
        const gap = Math.abs(b.x - a.x) > TS * 1.5 || Math.abs(b.y - a.y) > TS * 0.5, hop = gap ? Math.sin((this.u || 0) * Math.PI) * (Math.abs(b.x - a.x) / TS * 0.5 + 1) * TS : 0;
        this.x = lerp(a.x, b.x, this.u || 0) - this.w / 2; this.y = lerp(a.y, b.y, this.u || 0) - this.h - hop; this.dir = 1;
      }
      if (this.pi >= this.path.length - 1 || this.cx >= this.gateX - TS) { this.state = 'won'; g.parts.text(this.cx, this.y - 20, this.name + ' WINS!', '#ff9a9a'); TourKit.sfx('lose', 'bump'); }
      if (p.cx >= this.gateX - 3 * TS && this.state === 'run') this.bradyWins();
    }
  }
  bradyWins() {
    const g = this.g, p = g.player; this.state = 'lost';
    g.toast && g.toast('YOU WIN THE RACE!'); g.addLife(p.cx, p.y); for (let k = 0; k < 10; k++) g.addPick(); g.burst(p.cx, p.y - 20, 40, '#ffd84a', 'confetti');
    const T2 = Save.data.tour; if (T2) { T2.races = T2.races || {}; T2.races[g.id] = true; Save.save(); }
  }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const x = this.cx, y = this.y + this.h, run = this.state === 'run', b = run ? Math.abs(Math.sin(this.t * 14)) * 3 : 0;
    if (this.artCfg && this.artCfg.art) this.artCfg.art(ctx, this, x, y, run ? 'chase' : 'idle', this.t);
    else Ink.around(ctx, this.x - 14, this.y - 20, this.w + 28, this.h + 22, c => {
      // a long-legged bird runner in a racing bib
      c.strokeStyle = '#e8902a'; c.lineWidth = 2.5; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 3, y - 12); c.lineTo(x + s * 3 + (run ? Math.sin(this.t * 14 + s) * 6 : 0), y); c.stroke(); }
      c.fillStyle = '#5a6a8a'; c.beginPath(); c.ellipse(x, y - 17 - b, 12, 8, -0.2, 0, TAU); c.fill();
      c.fillStyle = '#fff'; rr(c, x - 5, y - 21 - b, 10, 8, 2); c.fill(); c.fillStyle = '#e83a3a'; c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillText('1', x, y - 15 - b);
      c.strokeStyle = '#5a6a8a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 8, y - 20 - b); c.quadraticCurveTo(x + 10, y - 30 - b, x + 13, y - 32 - b); c.stroke();
      c.fillStyle = '#5a6a8a'; c.beginPath(); c.arc(x + 14, y - 33 - b, 5, 0, TAU); c.fill(); c.fillStyle = '#ffb83a'; c.beginPath(); c.moveTo(x + 18, y - 34 - b); c.lineTo(x + 25, y - 32 - b); c.lineTo(x + 18, y - 31 - b); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 15, y - 35 - b, 1.8, 0, TAU); c.fill(); c.fillStyle = '#1a1020'; c.beginPath(); c.arc(x + 15.6, y - 35 - b, 0.9, 0, TAU); c.fill();
    }, { pad: 8 });
    if (this.state === 'count' && this.ct > 0) TourObj.label(ctx, String(Math.ceil(this.ct)), x, this.y - 30, 24, '#ffd84a');
  }
}
ENTITY_TYPES.tourRival = TourRival;

/* ---------- SNEAK: searchlights and guards; hide spots ---------- */
// watcher { kind: 'light' | 'guard', h (light: rows above the floor), sweep (tiles each way), type (guard art enemy) }
// alarmShutter { h }: a shutter ahead that slams for 6 s on an alarm; hideSpot { look: 'bush' | 'rock' }
Tour.pieces.watcher = function (st, o) {
  const B = st.B, x = st.x, n = o.len || 12; st.floor(x, x + n - 1);
  if ((o.kind || 'light') === 'light') { B.fill(x + Math.floor(n / 2) - 1, Math.max(0, st.gy - (o.h || 7) - 1), x + Math.floor(n / 2) + 1, Math.max(0, st.gy - (o.h || 7) - 1), T.HARD); B.spawn('watcher', x + Math.floor(n / 2), st.gy - (o.h || 7), { kind: 'light', sweep: o.sweep || 4, reach: (o.h || 7) + 1, spawn: o.spawn || st.pickEnemy() }); }
  else B.spawn('watcher', x + Math.floor(n / 2), st.gy - 1, { kind: 'guard', sweep: o.sweep || 4, spawn: o.spawn || st.pickEnemy(), dir: -1 });
  if (o.hide !== false) B.spawn('hideSpot', x + Math.floor(n / 2) - 3, st.gy - 1, { look: o.hideLook || 'bush' });
  return x + n;
};
Tour.pieces.alarmShutter = function (st, o) { const B = st.B, x = st.x, h = o.h || 3; st.floor(x, x + 2); B.spawn('alarmShutter', x + 1, st.gy - 1, { id: 'alarm', h, look: o.look || null }); B.fill(x + 1, Math.max(0, st.gy - h - 7), x + 1, st.gy - h - 1, T.HARD); return x + 3; };
Tour.pieces.hideSpot = function (st, o) { st.floor(st.x, st.x + 2); st.B.spawn('hideSpot', st.x + 1, st.gy - 1, { look: o.look || 'bush' }); return st.x + 3; };
const TourSneak = {
  // in the box, or ducking (DOWN held on the ground; big Brady crouches) inside a bush or behind a rock
  hidden(p) { return !!(p && (p.boxed || (p.hands && p.hands.id === 'box' && p.crouch) || (p.hideT > 0 && (p.crouch || (p.onGround && p.inp && p.inp.down))))); },
  alarm(g, at) {
    if (g.alarmT > 0) return; g.alarmT = 6;
    g.toast && g.toast('ALARM!'); TourKit.sfx('alarm', 'artcarHorn', { vol: 0.8 }); g.shake(3);
    for (const e of g.entities) if (e instanceof TourAlarmShutter) e.setOpen(false);
    const type = at.s.spawn; const C = type && ENTITY_TYPES[type];
    if (C) for (const s of [-1, 1]) { const e = new C(g, { type, x: at.cx + s * 4 * TS, y: at.g.camY + 2 * TS, dir: -s }); g.spawn(e); }
  }
};
class TourWatcher extends Ent {
  constructor(g, s) { super(g, s, s.kind === 'guard' ? 26 : 30, s.kind === 'guard' ? 34 : 20); this.kind = s.kind; this.sweep = (s.sweep || 4) * TS; this.reach = (s.reach || 8) * TS; this.seen = 0; this.ang = 0; this.hx = this.cx; this.dir = s.dir || -1; this.friendly = s.kind !== 'guard'; this.enemy = s.kind === 'guard'; if (s.kind !== 'guard') this.y = s.y - TS; }
  cone() {
    // a triangle: apex at the lamp / the guard's eyes, base on the floor (light) or ahead (guard)
    if (this.kind === 'light') { const bx = this.cx + Math.sin(this.ang) * this.sweep, by = this.y + this.reach; return [[this.cx, this.y + 10], [bx - 1.6 * TS, by], [bx + 1.6 * TS, by]]; }
    const ex = this.cx + this.dir * 6, ey = this.y + 8; return [[ex, ey], [ex + this.dir * 6 * TS, ey - 1.5 * TS], [ex + this.dir * 6 * TS, ey + 2 * TS]];
  }
  update(dt) {
    const g = this.g, p = g.player; this.t += dt; g.alarmT = Math.max(0, (g.alarmT || 0) - dt / Math.max(1, g.entities.filter(e => e instanceof TourWatcher).length));
    if (g.alarmT <= 0 && g.alarmWas) { for (const e of g.entities) if (e instanceof TourAlarmShutter) e.setOpen(true); }
    g.alarmWas = g.alarmT > 0;
    if (this.kind === 'light') this.ang = Math.sin(this.t * 0.9) * 0.9;
    else { this.x += this.dir * 1.2 * TS * dt; if (Math.abs(this.cx - this.hx) > this.sweep) { this.dir = sign(this.hx - this.cx); this.x += this.dir * 2; } }
    if (!p || p.dead) return;
    const [a, b, c] = this.cone(), pt = [p.cx, p.cy];
    const sgn = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
    const d1 = sgn(pt, a, b), d2 = sgn(pt, b, c), d3 = sgn(pt, c, a), inside = !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    if (inside && !TourSneak.hidden(p)) { this.seen += dt; if (this.seen > 0.4) { TourSneak.alarm(g, this); this.seen = 0; } } else this.seen = Math.max(0, this.seen - dt);
  }
  hit(kind) { if (this.kind !== 'guard') return false; this.dead = true; this.remove = true; this.g.burst(this.cx, this.cy, 12, '#ffffff', 'dust'); return true; }
  touchPlayer(p) { if (this.kind === 'guard' && !(p.vy > 0)) p.hurt(this); }
  draw(ctx) {
    const [a, b, c] = this.cone(), hot = this.seen > 0.05 || this.g.alarmT > 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createLinearGradient(a[0], a[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2); gr.addColorStop(0, hot ? 'rgba(255,90,70,0.45)' : 'rgba(255,240,170,0.4)'); gr.addColorStop(1, 'rgba(255,240,170,0.05)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.fill(); ctx.restore();
    if (this.kind === 'light') {
      ctx.fillStyle = '#4a4654'; rr(ctx, this.cx - 12, this.y, 24, 12, 4); ctx.fill(); ctx.fillStyle = hot ? '#ff6a5a' : '#fff8d0'; ctx.beginPath(); ctx.arc(this.cx, this.y + 12, 6, 0, Math.PI); ctx.fill();
    } else {
      const x = this.cx, y = this.y + this.h, d = this.dir;
      Ink.around(ctx, this.x - 10, this.y - 10, this.w + 20, this.h + 12, k => {
        k.fillStyle = '#3a5a8a'; rr(k, x - 10, y - 26, 20, 22, 6); k.fill(); k.fillStyle = '#e8c8a0'; k.beginPath(); k.arc(x, y - 30, 8, 0, TAU); k.fill();
        k.fillStyle = '#2a3a5a'; k.fillRect(x - 9, y - 39, 18, 5); k.fillStyle = '#ffd84a'; k.beginPath(); k.arc(x + d * 7, y - 20, 4, 0, TAU); k.fill();
        k.fillStyle = '#1a1020'; k.beginPath(); k.arc(x + d * 3, y - 31, 1.5, 0, TAU); k.fill(); k.fillRect(x - 6, y - 4, 4, 4); k.fillRect(x + 2, y - 4, 4, 4);
      }, { pad: 8 });
    }
    if (this.seen > 0.05) { ctx.fillStyle = '#ff5a4a'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', this.cx, this.y - 6); }
  }
  get light() { return { r: 70, c: 'rgba(255,240,170,', y: this.y + 12 }; }
}
class TourAlarmShutter extends TourShutter {
  constructor(g, s) { super(g, s); this.open = true; this.k = 1; }
}
class TourHideSpot extends Ent {
  constructor(g, s) { super(g, s, 52, 36); this.look = s.look || 'bush'; this.back = false; this.friendly = true; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && overlap(p, this)) p.hideT = 0.1; else if (p && p.hideT > 0) p.hideT -= dt; }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.look)) return;
    const x = this.cx, y = this.y + this.h, p = this.g.player, hid = p && TourSneak.hidden(p) && overlap(p, this);
    ctx.save(); if (hid) ctx.globalAlpha = 0.85;
    Ink.around(ctx, this.x - 6, this.y - 6, this.w + 12, this.h + 8, c => {
      if (this.look === 'rock') { c.fillStyle = '#8a8478'; c.beginPath(); c.ellipse(x, y - 15, 26, 17, 0, Math.PI, 0); c.lineTo(x + 26, y); c.lineTo(x - 26, y); c.fill(); c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(x - 8, y - 22, 9, 5, -0.4, 0, TAU); c.fill(); return; }
      for (const [dx, dy, r, col] of [[-14, -12, 13, '#3a8a3a'], [13, -12, 13, '#3a8a3a'], [0, -20, 15, '#4aa04a'], [-4, -9, 12, '#5ab85a'], [9, -8, 10, '#4aa04a']]) { c.fillStyle = col; c.beginPath(); c.arc(x + dx + Math.sin(this.t * 2 + dx) * (hid ? 0 : 0.8), y + dy, r, 0, TAU); c.fill(); }
    }, { pad: 6 });
    ctx.restore();
  }
}
Object.assign(ENTITY_TYPES, { watcher: TourWatcher, alarmShutter: TourAlarmShutter, hideSpot: TourHideSpot });
// Brady is drawn behind a bush he crouches in: the hide spot draws over him
{
  const dr = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) { dr.call(this, ctx, t); if (this.hideT > 0 && TourSneak.hidden(this) && this.g.entities) for (const e of this.g.entities) if (e instanceof TourHideSpot && overlap(this, e)) e.draw(ctx); };
}

/* ---------- the ROLL ball: kick it along; it grows as it rolls and smashes ball walls ---------- */
// ball { kind: 'snow' | 'dung' | 'cheese', r (tiles, 0.6), maxScale }
Tour.pieces.ball = function (st, o) {
  const B = st.B, x = st.x; st.floor(x, x + 3);
  B.spawn('tourBall', x + 2, st.gy - 1, { kind: o.kind || 'snow', r: o.r || 0.6, maxScale: o.maxScale || 2 });
  B.vkey('ball', [[x + 2, st.gy - 1]]);
  return x + 4;
};

// a rolling ball that reaches a ball wall smashes it
{
  const up = TourBreakWall.prototype.update;
  TourBreakWall.prototype.update = function (dt) {
    up.call(this, dt);
    if (this.remove || (this.needs !== 'ball' && this.needs !== 'sig')) return;
    const box = { x: this.x - 4, y: this.y, w: this.w + 8, h: this.h };
    for (const e of this.g.entities) if (e.ball && !e.remove && overlap(box, e)) { this.smash(); e.vx *= 0.3; break; }
  };
}

/* ---------- Bottle Mail ---------- */
Tour.pieces.bottle = function (st, o) { st.floor(st.x, st.x + 2); st.B.spawn('bottle', st.x + 1, st.gy - 2, { n: o.n || 1, note: o.note || null }); return st.x + 3; };
const TOUR_BOTTLE_NOTES = ['"The sea is huge. Keep looking. - C"', '"Every coast hides something. - C"', '"Three more out there! - C"', '"Lighthouses see everything. - C"', '"All five! Look for the light. - C"'];
class TourBottle extends Ent {
  constructor(g, s) { super(g, s, 22, 30); this.n = s.n || 1; this.note = s.note; this.item = true; this.baseY = this.y; const T2 = Save.data.tour; this.had = !!(T2 && T2.bottles && T2.bottles[this.n]); }
  update(dt) { this.t += dt; this.y = this.baseY + Math.sin(this.t * 2.2) * 3; }
  touchPlayer(p) {
    if (this.remove) return; this.remove = true;
    const g = this.g, T2 = TourProgress.data(); T2.bottles[this.n] = true; Save.save();
    const n = Object.keys(T2.bottles).filter(k => T2.bottles[k]).length;
    g.toast && g.toast(n >= 5 ? 'ALL FIVE BOTTLES: THE POSTCARD LIGHTHOUSE APPEARS!' : 'BOTTLE MAIL ' + n + '/5: ' + (this.note || TOUR_BOTTLE_NOTES[(this.n - 1) % 5]));
    g.burst(this.cx, this.cy, 20, '#7ad8ff', 'confetti'); TourKit.sfx('bottle', 'checkpoint');
    if (n >= 5) { T2.pending = T2.pending || []; T2.pending.push({ kind: 'house', id: 'lighthouse' }); }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.save(); if (this.had) ctx.globalAlpha = 0.5;
    ctx.translate(x, y - 15); ctx.rotate(Math.sin(this.t * 1.7) * 0.25);
    ctx.fillStyle = 'rgba(120,220,200,0.85)'; rr(ctx, -7, -8, 14, 20, 5); ctx.fill(); ctx.fillRect(-3, -15, 6, 8); ctx.fillStyle = '#a0703a'; ctx.fillRect(-3.5, -18, 7, 4);
    ctx.fillStyle = '#fff4d0'; ctx.fillRect(-4, -4, 8, 11); ctx.strokeStyle = '#c8902a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(3, -1); ctx.moveTo(-3, 2); ctx.lineTo(3, 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-5, -6, 2, 14);
    ctx.restore();
  }
  get light() { return { r: 60, c: 'rgba(160,240,255,' }; }
}
ENTITY_TYPES.bottle = TourBottle;

/* ---------- the Souvenir Stand counter ---------- */
// shop { stock: [kinds...] (the country's list; three shown, rotating after every level clear) }
const TOUR_SHOP_PRICES = [30, 60, 90];   // 100 is out of reach: the coin counter rolls over into a 1-up at 100
Tour.pieces.shop = function (st, o) {
  const B = st.B, x = st.x; st.floor(x, x + 11);
  const stock = o.stock || (st.ctx.C && st.ctx.C.shop) || ['mushroom', 'oneup', 'plane', 'hat', 'magnet', 'star'];
  B.spawn('souvenirShop', x + 6, st.gy - 1, { stock, look: o.look || null });
  return x + 12;
};
class TourShop extends Ent {
  constructor(g, s) {
    super(g, s, 8 * TS, 40); this.back = true; this.skinName = s.look;
    const L = s.stock, done = Object.keys((Save.data && Save.data.done) || {}).length, rng = mulberry32(hashStr('shop:' + g.id + ':' + done));
    const pool = L.slice(); this.items = [];
    for (let k = 0; k < 3 && pool.length; k++) this.items.push({ kind: pool.splice(Math.floor(rng() * pool.length), 1)[0], price: TOUR_SHOP_PRICES[k], sold: false });
    this.items.sort((a, b) => a.price - b.price);
  }
  slotX(k) { return this.x + TS * (1.3 + k * 2.7); }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player; if (!p) return;
    this.near = -1; this.items.forEach((it, k) => { if (Math.abs(p.cx - this.slotX(k)) < TS && Math.abs(p.y + p.h - (this.y + this.h)) < TS) this.near = k; });
    if (this.near >= 0 && (Input.actionPressed || (p.inp && p.inp.actionPressed))) this.buy(this.near, p);
  }
  buy(k, p) {
    const g = this.g, it = this.items[k]; if (!it || it.sold) return;
    if (g.picks < it.price) { g.parts.text(this.slotX(k), this.y - 10, 'NEED ' + it.price, '#ff9a9a'); TourKit.sfx('nope', 'bump', { vol: 0.4 }); return; }
    g.picks -= it.price; Save.data.picks = g.picks; it.sold = true;
    if (!p.pack) { p.pack = it.kind; g.toast && g.toast('INTO THE BACKPACK!'); } else if (p.dropKind) p.dropKind(it.kind, 6); else p.collect(it.kind);
    g.burst(this.slotX(k), this.y, 16, '#ffd84a', 'confetti'); TourKit.sfx('buy', 'checkpoint'); Save.save();
  }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.skinName)) return;
    const C = Tour.countryOf(this.g.id), col = (C && C.colors) || { a: '#ff4f8a', b: '#38c8ff', c: '#ffd84a' }, y = this.y + this.h;
    // counter, a striped awning on two posts, a price tag under each item
    ctx.fillStyle = '#8a5a34'; rr(ctx, this.x, y - 22, this.w, 22, 4); ctx.fill(); ctx.fillStyle = '#a8744a'; rr(ctx, this.x - 4, y - 26, this.w + 8, 6, 3); ctx.fill();
    ctx.fillStyle = '#6a4024'; ctx.fillRect(this.x + 2, y - 110, 5, 88); ctx.fillRect(this.x + this.w - 7, y - 110, 5, 88);
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#fff4e0' : col.a; ctx.beginPath(); ctx.moveTo(this.x - 6 + k * (this.w + 12) / 8, y - 118); ctx.lineTo(this.x - 6 + (k + 1) * (this.w + 12) / 8, y - 118); ctx.lineTo(this.x - 6 + (k + 1) * (this.w + 12) / 8, y - 104); ctx.arc(this.x - 6 + (k + 0.5) * (this.w + 12) / 8, y - 104, (this.w + 12) / 16, 0, Math.PI); ctx.fill(); }
    TourObj.label(ctx, 'SOUVENIRS', this.cx, y - 124, 12);
    this.items.forEach((it, k) => {
      const x = this.slotX(k);
      if (!it.sold) { TourItemArt.draw(ctx, it.kind, x, y - 40 + Math.sin(this.t * 2 + k) * 2, this.t, this.g); }
      ctx.fillStyle = it.sold ? '#8a8a8a' : this.near === k ? '#ffd84a' : '#fff4d0'; rr(ctx, x - 14, y - 18, 28, 13, 3); ctx.fill();
      ctx.fillStyle = '#3a2410'; ctx.font = 'bold 10px sans-serif'; ctx.fillText(it.sold ? 'SOLD' : it.price + '¢', x, y - 8);
    });
    if (this.near >= 0 && !this.items[this.near].sold) TourObj.label(ctx, 'THROW: BUY', this.slotX(this.near), y - 68, 11);
  }
}
ENTITY_TYPES.souvenirShop = TourShop;
try { Object.assign(window.BRADY_TOUR, { TourDoom, TourBeam, TourThief, TourRival, TourSneak, TourShop, TourHoldArena }); } catch (e) { /* not in a browser */ }
