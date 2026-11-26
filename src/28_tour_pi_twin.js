/* ============================================================
   World tour: the second Pupo (Brady, 26 Nov 2026: "If I'm riding
   Pupo and then I go to another Pupo, the other Pupo just sits there,
   but maybe it could give another power-up").
   When Brady is ALREADY riding and reaches another Pupo (he opens a
   second Nap Box, or rides into a Pupo left sitting or asleep
   somewhere else), that Pupo is not a second steed: he wakes, turns to
   Brady and, very slowly, holds a present out to him on one long arm
   ("...FOR... YOU."). The moment the paw reaches Brady the present is
   his; then the twin waves, packs himself into his own carton and is
   gone. Once per Pupo: the box stays open (empty), so it never gives
   twice. On foot, a Nap Box is a normal mount as before.
   The present is something Brady does not hold, from the core set
   every land has, in this order: the magic mushroom (if small), the
   joint (if not puffing), the land's signature item (only in a level
   whose own item blocks hold it, and only with empty HANDS), the
   star (not when already glittering), else a water bottle. Never the
   LSD tab (it would float him off Pupo), a jump power (off while
   riding; budget rule 8) or gear.
   The level checker needs nothing: the present only exists while
   Brady already rides, it is in no item block, and the Nap Box is
   still not a power-up (Validator.budget, 28_tour_pc_pupoval.js).
   Pupo is the only mount Brady rides. The other animals he stands on
   (Kenya's wildebeest, giraffes and flamingos, The Red-Eye's sloth and
   gull, Australia's kangaroo pouch, the Moon buggy) are moving floors
   or a whole-area mode: hopping from one to the next is their level,
   so they are left as they are.
   ============================================================ */
const PupoTwin = {
  SPEED: 44,          // px/s: how fast the arm creeps out (slow: he is a sloth)
  BACK: 120,          // px/s: the arm coming home
  REACH: 5 * TS,      // the stretch arms' reach (PUPO.md §0)
  WAIT: 7,            // s: holding it out to a Brady who rode off, before he sets it down for him
  ORDER: ['mushroom', 'joint', 'sig', 'star', 'oneup'],
  // does Brady already have it?
  held(p, kind) {
    if (kind === 'mushroom') return p.power >= 1;
    if (kind === 'joint') return p.power === 2;
    if (kind === 'sig' || (kind && kind.startsWith('sig:'))) return !!(p.handsKind && p.handsKind());
    if (kind === 'star') return p.star > 0;
    return false;
  },
  // the level's own signature item: one of its item blocks holds it
  offersSig(g) {
    const L = g.level; if (!L || !L.areas) return false;
    for (const a of L.areas) for (const k in a.contents || {}) { const c = a.contents[k]; if (c === 'sig' || (typeof c === 'string' && c.startsWith('sig:'))) return true; }
    return false;
  },
  pick(g, p) {
    for (const k of this.ORDER) {
      if (k === 'sig') { if (!this.offersSig(g)) continue; const it = TourPowers.blockItem('sig', g); if (!it || !it.startsWith('sig:') || this.held(p, it)) continue; return it; }
      if (!this.held(p, k)) return k;
    }
    return 'oneup';
  },
  // a Nap Box opened while riding: a twin unfolds out of it instead of a second steed
  fromBox(g, tx, ty) {
    const A = g.area, p = g.player, side = p && p.cx < tx * TS + TS / 2 ? -1 : 1;
    const fits = (cx, by) => regionFree(A, cx - 14, by - 40, 28, 40);
    let x = null, y = null;
    for (const s of [side, -side]) { const cx = (tx + s) * TS + TS / 2, by = (ty + 1) * TS; if (fits(cx, by)) { x = cx; y = by; break; } }
    if (x == null && fits(tx * TS + TS / 2, ty * TS)) { x = tx * TS + TS / 2; y = ty * TS; }
    if (x == null) { x = tx * TS + TS / 2; y = (ty + 1) * TS; }
    const e = new PupoGift(g, { x, y, facing: -side, mode: 'unfold', box: { tx, ty } });
    g.spawn(e); return e;
  },
  // a Pupo left sitting or asleep (not the one under Brady): he gives instead of being ridden
  fromFree(g, f) {
    const e = new PupoGift(g, { x: f.cx, y: f.y + f.h, facing: f.facing, mode: f.mode === 'sleep' ? 'wake' : 'turn', hang: f.hangAt });
    f.remove = true; g.spawn(e); return e;
  }
};
Object.assign(PupoRide.says, { twin: '...OH. HI... PUPO.', gift: '...FOR... YOU.', bye: '...BYE... PUPO.', here: "...I'LL... PUT IT... HERE." });

/* ---------- the twin: wakes, holds the present out on one long arm, hands it over, packs up ---------- */
class PupoGift extends PupoFree {
  constructor(g, s) {
    super(g, s);
    this.armed = false; this.pupoGift = true; this.kind = null; this.L = 0; this.ang = 0; this.given = false; this.waitT = 0;
    this.hx = this.cx; this.hy = this.y; this.an = Pupo.newAnchors();
  }
  // shoulder in world space (the front arm of the sitting pose)
  shoulder() { if (this.hangAt) return { x: this.cx, y: this.hangAt.y + 22 }; const an = Pupo.anchors('idle', this.t, this.an), S = PupoRide.ART; return { x: this.cx + this.facing * an.shoulderF.x * S, y: this.y + this.h + an.shoulderF.y * S }; }
  update(dt) {
    this.t += dt; this.mt += dt;
    const g = this.g, A = g.area, p = g.player;
    if (this.hangAt) { this.vy = 0; this.x = this.hangAt.x - 14; this.y = this.hangAt.y + 2; }
    else {
      this.vy = Math.min(this.vy + PHYS.gDown * dt, PHYS.maxFall); this.vx = 0;
      moveBody(this, A, dt, { semis: true, platforms: g.platforms });
      if (this.ride) { this.x += this.ride.dx || 0; this.y += this.ride.dy || 0; }
      if (this.y > A.H * TS + 20 || lavaContact(this, A)) { PupoRide.zPuff(g, this.cx, this.y + 10); this.remove = true; return; }
    }
    const m = this.mode;
    if (m === 'unfold') { if (this.mt > 0.35 && this.mt < 0.95) this.yawnPoke(); if (this.mt >= 1.2) this.setMode('turn'); return; }
    if (m === 'wake') { if (this.mt >= PupoRide.K.WAKE) this.setMode('turn'); return; }
    if (m === 'pack') { if (this.mt > 1.6) { this.remove = true; PupoRide.zPuff(g, this.cx, this.y + 20); } return; }
    const alive = p && !p.dead && p.state === 'play';
    if (m === 'turn') {
      // he turns to Brady, has a look at the other Pupo, and picks something Brady does not have
      if (alive) this.facing = p.cx < this.cx ? -1 : 1;
      if (this.mt < dt * 1.5) { PupoRide.say(g, this.cx, this.y - 10, 'twin'); PupoRide.sfx('pupoBoop', 'pick', { pitch: 0.55, vol: 0.5 }); }
      if (this.mt >= 0.8) { this.kind = alive ? PupoTwin.pick(g, p) : 'oneup'; this.setMode('offer'); PupoRide.say(g, this.cx, this.y - 10, 'gift'); Sound.play('appear', { pitch: 1.3, vol: 0.5 }); }
      return;
    }
    if (m === 'offer') {
      // the arm creeps out towards Brady's chest, as far as it reaches
      const s = this.shoulder();
      if (alive) {
        this.facing = p.cx < this.cx - 4 ? -1 : p.cx > this.cx + 4 ? 1 : this.facing;
        const tx = p.cx, ty = p.y + Math.min(p.h * 0.4, 26), dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
        this.ang = Math.atan2(dy, dx);
        this.L = Math.min(this.L + PupoTwin.SPEED * dt, PupoTwin.REACH, d);
        this.hx = s.x + Math.cos(this.ang) * this.L; this.hy = s.y + Math.sin(this.ang) * this.L;
        if (this.mt > 1.0 && (d - this.L < 10 || overlap(p, { x: this.hx - 10, y: this.hy - 12, w: 20, h: 20 }))) { this.handOver(p); return; }
      }
      this.waitT += dt;
      if (this.waitT > PupoTwin.WAIT || !alive) this.putDown();
      return;
    }
    if (m === 'back') {
      // the arm comes home, then a happy wave and he packs himself away
      const s = this.shoulder();
      this.L = Math.max(0, this.L - PupoTwin.BACK * dt); this.hx = s.x + Math.cos(this.ang) * this.L; this.hy = s.y + Math.sin(this.ang) * this.L;
      if (this.L <= 0 && this.mt > 0.5) this.setMode('wave');
      return;
    }
    if (m === 'wave' && this.mt >= 1.3) { PupoRide.say(g, this.cx, this.y - 10, 'bye'); this.setMode('pack'); }
  }
  handOver(p) {
    const g = this.g;
    if (PupoTwin.held(p, this.kind)) this.kind = PupoTwin.pick(g, p);   // he got one meanwhile: something else
    const kind = this.kind; this.given = true; this.kind = null;
    g.burst(this.hx, this.hy, 12, '#ffe08a', 'spark');
    p.collect(kind, null);
    this.setMode('back');
  }
  // Brady rode off: the present is set down where the paw is (it stays put), for him to come back for
  putDown() {
    const g = this.g, kind = this.kind; this.kind = null; this.given = true;
    const s = this.shoulder(), x = this.cx + this.facing * 26, y = this.y + this.h - 24;
    if (kind) { const it = new TourItem(g, x, y, kind); it.emerge = 0; it.speedX = 0; it.vx = 0; it.hoverY = y; g.spawn(it); }
    PupoRide.say(g, this.cx, this.y - 10, 'here');
    this.ang = Math.atan2(y - s.y, x - s.x);
    this.setMode('back');
  }
  pose(o) {
    const m = this.mode;
    if (m === 'unfold' || m === 'wake' || m === 'pack') return super.pose(o);
    o.reach = 0; o.phase = null; o.still = false;
    if (this.hangAt) { o.pose = 'hang'; o.mood = 'happy'; o.armsOff = false; o.y = this.hangAt.y; return; }
    if (m === 'wave') { o.pose = 'happy'; o.mood = 'happy'; o.armsOff = false; return; }
    o.pose = 'idle'; o.mood = m === 'turn' ? (this.mt < 0.3 ? 'blink' : 'puzzled') : 'happy';
    o.armsOff = m === 'offer' || m === 'back';
  }
  draw(ctx) {
    const o = PupoFree.o, m = this.mode;
    if (m === 'unfold' || m === 'wake' || m === 'pack') return super.draw(ctx);
    o.x = this.cx; o.y = this.y + this.h; o.t = this.t; o.scale = PupoRide.ART; o.facing = this.facing; o.rider = null; o.spiral = 0;
    this.pose(o);
    PupoFree.cur = o;
    Ink.around(ctx, this.cx - 44, o.y - 62, 88, 66, PupoFree.inkFn, { pad: 6, rim: Ink.keyline });
    if (m === 'offer' || m === 'back') {
      // the long arm, with its own outline, and the present on the open paw
      const s = this.shoulder();
      Pupo.arm(ctx, s.x, s.y, this.hx, this.hy, { w: 6.5, t: this.t, point: false, sag: -3 * this.facing });
      if (this.kind) {
        const bob = Math.sin(this.t * 3) * 1.2;
        ctx.save(); ctx.translate(this.hx, this.hy - 3 + bob); ctx.scale(0.8, 0.8);
        TourItemArt.draw(ctx, this.kind, 0, 0, this.t, this.g);
        ctx.restore();
      }
    }
  }
}
// (spawned only here, never from level data: not an ENTITY_TYPES entry, so the hats list needs nothing)

/* ---------- the wrappers ---------- */
{
  // a Nap Box opened while Brady rides: the twin, not a second steed (a used box bumped while riding still only rattles)
  const em0 = PupoRide.emerge;
  PupoRide.emerge = function (g, tx, ty, again) {
    if (!again && this.riding(g)) return PupoTwin.fromBox(g, tx, ty);
    return em0.apply(this, arguments);
  };
  // another Pupo, sitting or asleep, that Brady rides into: he gives instead
  const fu0 = PupoFree.prototype.update;
  PupoFree.prototype.update = function (dt) {
    const p = this.g.player;
    if (!this.pupoGift && p && p.pupoRide && !p.dead && p.state === 'play' && (this.mode === 'sit' || this.mode === 'sleep') && overlap(p, this)) {
      const R = PupoRide.st(this.g); if (R.free === this) { R.free = null; R.freeArea = -1; }
      PupoTwin.fromFree(this.g, this); return;
    }
    return fu0.call(this, dt);
  };
}
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoTwin, PupoGift }); } catch (e) { /* not in a browser */ }
