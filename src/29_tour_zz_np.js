/* ============================================================
   Boss arenas are walls, not suggestions (Nepal fix, 26 Nov 2026).
   Brady clipped through the summit's door wall in 12-5 and walked to
   the gate with Piwi still fighting. The cause: while a boss reels
   after a hit (or offers its weak spot) touching it does no harm but
   nudges Brady 2 px away per frame (Boss.touchPlayer), with no look at
   the tiles. Piwi's phase changes keep him harmless for 2.4-3 s, so a
   Showtrunk crashing (or the mech standing) on Brady at a wall pushed
   him 240 px/s straight through the one-tile wall. A pushed landmark
   nudged him the same way (TourProp.touchPlayer).
   Now, for every boss and every prop:
   - a nudge that would put Brady inside solid tiles is undone;
   - while a boss fight is locked Brady is kept between the arena walls
     (the jump powers already did this, now everyone does);
   - the exit gate ignores him while the boss still fights.
   ============================================================ */
(() => {
  // undo a sideways nudge that would leave Brady in a wall
  const keepOut = (p, x0) => {
    const A = p && p.g && p.g.area; if (!A || p.x === x0) return;
    if (!regionFree(A, p.x, p.y, p.w, p.h) && regionFree(A, x0, p.y, p.w, p.h)) p.x = x0;
  };
  for (const C of [Boss, TourProp]) {
    const tp = C.prototype.touchPlayer;
    C.prototype.touchPlayer = function (p) { const x0 = p.x; try { return tp.call(this, p); } finally { keepOut(p, x0); } };
  }
  // a locked arena keeps Brady inside it (bossLock spans the arena floor: x0 = the first tile, x1 = the door wall)
  const fighting = g => { const L = g && g.bossLock, b = g && g.boss; return L && !L.hold && b && !b.remove && b.state !== 'dying' ? L : null; };
  const pu = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const r = pu.call(this, dt, inp);
    const L = fighting(this.g);
    if (L && !this.dead) { if (this.x < L.x0) this.x = L.x0; if (this.x + this.w > L.x1) this.x = L.x1 - this.w; }
    return r;
  };
  // the way out only opens when the boss is beaten
  const G = ENTITY_TYPES.gate, gt = G.prototype.touchPlayer;
  G.prototype.touchPlayer = function (p) { if (fighting(this.g)) return; return gt.call(this, p); };
})();
