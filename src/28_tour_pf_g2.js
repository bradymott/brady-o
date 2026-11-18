/* ============================================================
   World tour: Pupo's rollout to Morocco, Spain and France
   (docs/design/PUPO.md §8.2, group P2-G2). Small, generic additions
   to the shipped Pupo objects, by wrapping only (the engine files
   28_tour_p*.js and the G1 wrappers in 28_tour_pe_g1.js are not
   edited):
   - pupoBar { need: { g, on } }: the bar is there only while toggle
     group g is in state `on` (false = state 0): Chefchaouen's washing
     line is hung out by day only (5-3), La Mancha's sail stops only
     when the wind is off (6-7). Out of its state it can't be grabbed,
     and Pupo hanging from it drops off (with s.dropSay, his line);
     bar.up says which (for its look)
   - pupoBar { say }: Pupo's line the first time he hangs from it
   - pupoClimb { slick, squeak }: Brady alone touching the strip gets
     the `slick` line (a hint that only Pupo climbs it); while Pupo
     climbs, `squeak` puffs out every few steps (the soaped pole, 6-1)
   - a poke key for the level checker: any spawn with
     { pokeKey: id, pokeAt: [[x, y] px...] } holds the virtual key `id`
     at every riding standing spot with one of those points within
     poke reach and in sight (PupoVal.derive, wrapped): 7-2's
     dovecote, whose magpie is caught only by a poke into its hole
   - the thief in hiding: a TourThief with `dove` set is out of sight
     (not drawn), can't be stomped, kazooed or hit, and is caught only
     by whoever hid it calling catchIt()
   Nothing here allocates per frame.
   ============================================================ */
const PupoG2 = {
  // Brady is riding and Pupo is in mode `mode` on entity e
  on(g, mode, e) {
    const p = g && g.player, R = g && g.pupo; if (!p || !p.pupoRide || !R || R.mode !== mode) return false;
    if (mode === 'hang') return !!(R.hg && R.hg.e === e);
    if (mode === 'climb') return !!(R.cl && R.cl.e === e);
    return true;
  },
  // a bar's state rule: toggle group g in state on (true = bit set)
  barUp(e) { const n = e.s && e.s.need; if (!n || !e.g || !e.g.toggleBit) return true; return !!e.g.toggleBit(n.g || 0) === !!n.on; }
};
if (typeof PupoBar !== 'undefined') {
  const B = PupoBar.prototype, up0 = B.update;
  B.update = function (dt) {
    up0.call(this, dt);
    const s = this.s; if (!s) return;
    if (s.need) {
      this.up = PupoG2.barUp(this);
      if (!this.up) {
        this.cool = Math.max(this.cool, 0.1);
        const g = this.g, p = g.player;
        if (PupoG2.on(g, 'hang', this)) { PupoRide.leave(g, p); p.vy = 0; if (s.dropSay) PupoRide.say(g, p.cx, p.y - 18, s.dropSay); }
      }
    } else this.up = true;
    if (s.say && !this.said && PupoG2.on(this.g, 'hang', this)) { this.said = true; const p = this.g.player; PupoRide.say(this.g, p.cx, p.y - 18, s.say); }
  };
  B.up = true; B.said = false;
}
if (typeof PupoClimb !== 'undefined') {
  const C = PupoClimb.prototype, up0 = C.update;
  C.update = function (dt) {
    up0.call(this, dt);
    const s = this.s; if (!s || !(s.slick || s.squeak)) return;
    const g = this.g, p = g.player; if (!p || p.dead) return;
    if (this.hintT > 0) this.hintT -= dt;
    if (s.slick && !p.pupoRide && this.hintT <= 0 && overlap(p, this)) {
      this.hintT = 2.5; g.parts.text(this.cx, Math.max(this.top + 10, p.y - 12), s.slick, '#ffd84a'); Sound.play('bump', { vol: 0.35, pitch: 1.5 });
    }
    if (s.squeak && PupoG2.on(g, 'climb', this) && Math.abs(p.vy) > 1) {
      this.sqT = (this.sqT || 0) + dt;
      if (this.sqT > 0.55) { this.sqT = 0; g.parts.text(this.cx + (this.sqN++ % 2 ? 16 : -16), p.y + 14, s.squeak, '#ffffff'); PupoRide.sfx('pupoSqueak', 'pick', { pitch: 2.4, vol: 0.25 }); }
    }
  };
  C.hintT = 0; C.sqN = 0;
}
// pupoGrab { say }: Pupo's line the first time he zips to (or swings from) it
if (typeof PupoRide !== 'undefined' && PupoRide.modes) for (const m of ['zip', 'swing']) {
  const M = PupoRide.modes[m]; if (!M) continue;
  const e0 = M.enter;
  M.enter = function (p, g, R, e) { e0.call(this, p, g, R, e); if (e && e.s && e.s.say && !e.g2said) { e.g2said = true; PupoRide.say(g, p.cx, p.y - 18, e.s.say); } };
}
// the level checker: a poke key (PupoVal.derive builds the riding search's copy of the level)
if (typeof PupoVal !== 'undefined') {
  const d0 = PupoVal.derive;
  PupoVal.derive = function (level) {
    const D = d0.call(this, level);
    level.areas.forEach((a, ai) => {
      let gr = null;
      for (const s of a.spawns) {
        if (!s.pokeKey || !s.pokeAt) continue;
        if (!gr) { gr = []; for (const q of a.spawns) if (q.type === 'pupoGrille') { const tx = Math.floor(q.x / TS), ty1 = Math.floor(q.y / TS) - 1; gr.push({ x0: tx, y0: ty1 - (q.h || 1) + 1, x1: tx + (q.w || 1) - 1, y1: ty1 }); } }
        const seen = {}, tiles = [];
        for (const pt of s.pokeAt) for (const q of this.reachCells(a, gr, pt[0], pt[1], PupoReach.K.POKE)) { const k = q[0] + ',' + q[1]; if (!seen[k]) { seen[k] = 1; tiles.push([q[0], q[1] - 1]); } }
        if (tiles.length) D.areas[ai].vkeys.push({ id: s.pokeKey, tiles, mode: 'any' });
      }
    });
    return D;
  };
}
// the thief in hiding (7-2's magpie in the dovecote): out of sight and untouchable until whoever hid it catches it
if (typeof TourThief !== 'undefined') {
  const T0 = TourThief.prototype, dr0 = T0.draw, cp0 = T0.collidePlayer, hit0 = T0.hit;
  T0.draw = function (ctx) { if (this.dove) return; dr0.call(this, ctx); };
  T0.collidePlayer = function (p) { if (this.dove) return; cp0.call(this, p); };
  T0.hit = function (kind) { if (this.dove) return false; return hit0.call(this, kind); };
}
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoG2 }); } catch (e) { /* not in a browser */ }
