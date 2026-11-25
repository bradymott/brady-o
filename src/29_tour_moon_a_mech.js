/* ============================================================
   THE MOON: the land's mechanics (docs/design/ENCORE_TOUR.md §4, world 18).
   Shared: an area's `moon` system (copied onto the built area and the level checker's copy of it), enemies that
   feel the low gravity too.
   18-1 LOWG   low gravity (the engine's area gravity: the game and the checker run the same physics), dust
               geysers (steady ones are lifts the checker knows; pulsing ones rumble first and are never needed),
               golf balls that rain down on a shadow, ceiling spikes that punish a full jump.
   (18-2 DRIFT, 18-3 ROVER, 18-4 MAG and 18-6 STARS follow below.)
   ============================================================ */
(function () {
const MK = Tour.moonKit, INK = MK.INK, MoonArt = MK.MoonArt;
const MOON_G = 0.55;   // the land's gravity (18-1, 18-3, 18-4, the stage)

/* ---------------- the `moon` area system ---------------- */
// an area spec's `moon: { ... }` rides along onto the built area (TourBuild.areaSystems) and onto the level checker's
// proxy of it, so the land's physics wrappers see it in both
if (TourBuild.SYSTEMS.indexOf('moon') < 0) TourBuild.SYSTEMS.push('moon');
{
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.moon) A.moon = area.moon; return A; };
}
// walkers feel the area's gravity on the moon (the engine's Walker always falls at full gravity): a moon bunny hops
// sky-high and floats down
{
  const wk0 = Walker.prototype.walk;
  Walker.prototype.walk = function (dt) {
    const A = this.g && this.g.area;
    if (A && A.moon && A.gravity && A.gravity < 1 && !this.onGround) this.vy -= PHYS.gDown * (1 - A.gravity) * dt;
    return wk0.call(this, dt);
  };
}

/* ---------------- 18-1: dust geysers ---------------- */
// a geyser: a vent in the dust that blows a column of moon dust up to row `top`. Steady ones blow all the time (the
// checker rides them); pulsing ones rumble and spit for 1 s (the tell), blow for `on` seconds, rest for `off`
class MoonGeyser extends Ent {
  constructor(g, s) {
    super(g, s, (s.w || 2) * TS, (s.h || 10) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.back = true;
    this.steady = !!s.steady; this.on = s.on || 2.4; this.off = s.off || 2.2; this.ph = s.phase || 0; this.zi = s.zi;
    this.k = this.steady ? 1 : 0; this.faint = !!s.faint;
  }
  zone() { const A = this.g.area; return A && A.zones ? A.zones.find(z => z.moonGeyser === this.s.gid) : null; }
  cycle() { const P = this.on + this.off + 1, k = ((this.g.t + this.ph) % P + P) % P; return k < this.off ? 'rest' : k < this.off + 1 ? 'warn' : 'blow'; }
  update(dt) {
    this.t += dt;
    if (this.steady) return;
    const st = this.cycle(), z = this.zone();
    if (z) z.off = st !== 'blow';
    this.k = approach(this.k, st === 'blow' ? 1 : 0, dt * 4);
    if (st === 'warn' && this.st !== 'warn' && this.g.onScreen(this, 80)) TourKit.sfx('rumble', 'bump', { vol: 0.3, pitch: 0.5 });
    this.st = st;
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, w = this.w, bot = this.y + this.h, t = this.t, top = this.y, k = this.k;
    const warn = !this.steady && this.st === 'warn';
    ctx.save();
    // the vent: a little dark crater mouth on the floor
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#5a546a';
    ctx.beginPath(); ctx.ellipse(x + w / 2, bot - 2, w / 2 + 6, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1630'; ctx.beginPath(); ctx.ellipse(x + w / 2, bot - 2, w / 2 - 2, 3, 0, 0, TAU); ctx.fill();
    if (warn) {
      // the tell: the vent shudders and spits little puffs
      for (let q = 0; q < 4; q++) { const ph = (t * 3 + q / 4) % 1; ctx.fillStyle = `rgba(230,226,240,${0.8 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + w / 2 + Math.sin(q * 2.3 + t * 9) * w * 0.3, bot - 6 - ph * 40, 4 + ph * 6, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#ffd84a'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('!', x + w / 2, bot - 52 + Math.sin(t * 20) * 2);
    }
    if (k > 0.02) {
      const a = (this.faint ? 0.45 : 1) * k;
      ctx.fillStyle = `rgba(225,220,240,${0.16 * a})`; ctx.fillRect(x, top, w, this.h);
      ctx.fillStyle = `rgba(240,236,250,${0.12 * a})`; ctx.fillRect(x + w * 0.2, top, w * 0.6, this.h);
      // dust puffs rising up the column, thinning out at the top
      for (let q = 0; q < 9; q++) { const ph = (t * 0.9 + q / 9) % 1, yy = bot - ph * this.h, xx = x + w / 2 + Math.sin(t * 3 + q * 1.7) * w * 0.32, r = 5 + ph * 9; ctx.fillStyle = `rgba(236,232,246,${0.7 * a * (1 - ph * 0.8)})`; ctx.beginPath(); ctx.arc(xx, yy, r, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * a})`; ctx.lineWidth = 2; for (let q = 0; q < 3; q++) { const ph = (t * 1.4 + q / 3) % 1, yy = bot - ph * this.h; ctx.beginPath(); ctx.moveTo(x + 4, yy + 8); ctx.lineTo(x + 4, yy - 6); ctx.moveTo(x + w - 4, yy + 2); ctx.lineTo(x + w - 4, yy - 12); ctx.stroke(); }
    }
    ctx.restore();
  }
}
// golf balls from the sky: a target ring on the ground (and a whistle) for WARN seconds, then a long-forgotten golf
// ball comes down on it, fast. { period, phase }
class MoonGolfRain extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, TS); this.x = s.x - TS; this.y = s.y - TS; this.back = true; this.period = s.period || 3.2; this.ph = s.phase || 0; this.WARN = 1.0; this.n = -1; }
  phaseK() { const P = this.period; return ((this.g.t + this.ph) % P + P) % P; }
  update(dt) {
    this.t += dt; const k = this.phaseK(), n = Math.floor((this.g.t + this.ph) / this.period);
    if (k > this.period - this.WARN && this.warned !== n) { this.warned = n; if (this.g.onScreen(this, 120)) TourKit.sfx('whistle', 'select', { vol: 0.25, pitch: 2.2 }); }
    if (n !== this.n) {
      if (this.n >= 0 && this.g.onScreen(this, 200)) {
        const top = this.g.camY - 30;
        tourFire(this.g, this.cx, Math.min(top, this.y - 6 * TS), { vx: 0, vy: 16 * TS, w: 16, h: 16, life: 3, col: '#ffffff', art: (c, s) => MoonArt.golf(c, s.x + s.w / 2, s.y + s.h / 2, 8) });
      }
      this.n = n;
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const k = this.phaseK(), warn = k > this.period - this.WARN, x = this.cx, y = this.y + this.h;
    if (!warn) return;
    const q = (k - (this.period - this.WARN)) / this.WARN;
    ctx.save(); ctx.strokeStyle = `rgba(255,90,90,${0.5 + 0.5 * q})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y - 3, 22 - q * 10, 6 - q * 2, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = `rgba(20,10,40,${0.25 + 0.35 * q})`; ctx.beginPath(); ctx.ellipse(x, y - 3, 6 + q * 6, 2 + q * 2, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 8, y - 3); ctx.lineTo(x + 8, y - 3); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 2); ctx.stroke();
    ctx.restore();
  }
}
// a sign card on a little crate (the land's tips, in Piwi's stage crew's voice)
Object.assign(ENTITY_TYPES, { moonGeyser: MoonGeyser, moonGolfRain: MoonGolfRain });
TourHats.NOT && ['moonGeyser', 'moonGolfRain'].forEach(k => TourHats.NOT.add(k));

let geyserN = 0;
Object.assign(Tour.pieces, {
  // a dust geyser at the letter (the vent's floor is the row under it): { w, top (row the column reaches), steady,
  // on, off, phase, force, faint }
  'moon.geyser'(st, o) {
    const B = st.B, w = o.w || 2, x = st.x, bot = st.gy - 1, top = o.top != null ? o.top : bot - (o.up || 10), gid = 'g' + (++geyserN);
    const z = B.zone(x, top, w, bot - top + 1, 0, -(o.force || 95) * TS, (o.vmax || 7.6) * TS, 'updraft', { pull: 3, moonGeyser: gid });
    if (!o.steady) z.pulse = true;
    B.spawn('moonGeyser', x, bot, { w, h: bot - top + 1, steady: !!o.steady, on: o.on, off: o.off, phase: o.phase || 0, gid, faint: !!o.faint });
    return st.x;
  },
  // golf balls rain on this spot: { period, phase }
  'moon.golfRain'(st, o) { st.B.spawn('moonGolfRain', st.x, st.gy - 1, { period: o.period || 3.2, phase: o.phase || 0 }); return st.x; }
});

Object.assign(TourLandscape.ARCH_LABEL, { lowg: 'LOW-G', drift: 'SPACEWALK', rover: 'BUGGY', mag: 'MAG BOOTS', stars: 'STARS' });
Tour.moonKit.MOON_G = MOON_G;
// for the shots tool's autopilot: the game's own physics, run on a copy of Brady's body
try { if (typeof window !== 'undefined') window.BRADY_MOON = { phys: (b, inp, A, dt, pl, o) => playerPhysicsFlip(b, inp, A, dt, pl, o), spikeContact: (b, A) => spikeContact(b, A), lavaContact: (b, A) => lavaContact(b, A), moveBody: (b, A, dt, o) => moveBody(b, A, dt, o), kit: Tour.moonKit }; } catch (e) { /* not in a browser */ }
})();
