/* ============================================================
   World tour: Pupo's rollout to Ecuador, Brazil and Mozambique
   (docs/design/PUPO.md §8.2, group P2-G1). Small, generic additions
   to the shipped Pupo objects, by wrapping only (the engine files
   28_tour_p*.js are not edited):
   - pupoSnatch { look, opens, name, hot }: a moving key with a land's
     own look (TOUR_SKINS[look] is drawn instead of the plain key);
     opens: when Pupo's arm brings it in, the lock or shutter with the
     key's id opens at once (TourLock.open) and the toast says `name`;
     hot: Brady alone touching it gets that line (a hint that only
     Pupo's arm can take it) instead of nothing
   - PupoG1.near(g, x, y, r): Pupo is ridden and in one of the given
     modes within r px of (x, y) (for the critters that react to him:
     the sloth cousins of 3-2, the fruit bats of 4-3)
   - coins in his own modes: climbing, hanging, swinging, zipping and
     being pulled to a grab skip Brady's own step, and with it the coin
     pick-up; the same tile check runs after those steps instead (a coin
     column up 3-3's cecropia, coins along a swing)
   Nothing here allocates per frame.
   ============================================================ */
const PupoG1 = {
  // the rider's Pupo state when Brady is on him in mode `mode` ('' = walking; null = any) within r px of (x, y)
  near(g, x, y, r, mode) {
    const p = g && g.player; if (!p || !p.pupoRide || p.dead) return null;
    const R = g.pupo; if (!R) return null;
    if (mode != null && R.mode !== mode) return null;
    const dx = p.cx - x, dy = p.y + p.h / 2 - y; return dx * dx + dy * dy <= r * r ? R : null;
  }
};
if (typeof PupoSnatch !== 'undefined') {
  const S = PupoSnatch.prototype, draw0 = S.draw, give0 = S.give, upd0 = S.update;
  S.draw = function (ctx) { if (this.s && this.s.look && TourObj.skin(ctx, this, this.s.look)) return; draw0.call(this, ctx); };
  S.give = function (p) {
    const g = this.g, o = this.s || {};
    give0.call(this, p);
    if (o.opens) TourLock.open(g, this.keyId);
    if (o.name) g.toast(o.name);
  };
  S.update = function (dt) {
    upd0.call(this, dt);
    const o = this.s; if (!o || !o.hot || this.taken || this.remove) return;
    if (this.hotT > 0) { this.hotT -= dt; return; }
    const p = this.g.player;
    if (p && !p.dead && !p.pupoRide && overlap(p, this)) { this.hotT = 2.5; this.g.parts.text(this.cx, this.y - 10, o.hot, '#ffd84a'); Sound.play('bump', { vol: 0.35, pitch: 1.4 }); }
  };
}
if (typeof PupoRide !== 'undefined') PupoRide.afters.push((p, dt, inp, g, R, inMode) => {
  if (!inMode || !p.pupoRide) return;
  const A = g.area, x0 = Math.floor(p.x / TS), x1 = Math.floor((p.x + p.w - 0.01) / TS), y0 = Math.floor(p.y / TS), y1 = Math.floor((p.y + p.h - 0.01) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileAt(A, tx, ty) === T.PICK) { g.setTile(tx, ty, T.EMPTY); g.addPick(tx * TS + TS / 2, ty * TS + TS / 2); }
});
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoG1 }); } catch (e) { /* not in a browser */ }
