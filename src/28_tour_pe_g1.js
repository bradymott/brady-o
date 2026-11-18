/* ============================================================
   World tour: Pupo's rollout to Ecuador, Brazil and Mozambique
   (docs/design/PUPO.md §8.2, group P2-G1). Small, generic additions
   to the shipped Pupo objects, by wrapping only (the engine files
   28_tour_p*.js are not edited):
   - pupoSnatch { look, opens, name, hot }: a moving key with a land's
     own look (TOUR_SKINS[look] is drawn instead of the plain key);
     opens: when Pupo's arm brings it in, the lock or shutter with the
     key's id opens at once (TourLock.open) and the toast says `name`;
     say: Pupo's own slow line as he takes it; hot: Brady alone touching
     it gets that line (a hint that only Pupo's arm can take it) instead
     of nothing
   - pupoHandle { say }: Pupo's line as he tugs it
   - PupoG1.near(g, x, y, r): Pupo is ridden and in one of the given
     modes within r px of (x, y) (for the critters that react to him:
     the sloth cousins of 3-2, the fruit bats of 4-3)
   - coins in his own modes: climbing, hanging, swinging, zipping and
     being pulled to a grab skip Brady's own step, and with it the coin
     pick-up; the same tile check runs after those steps instead (a coin
     column up 3-3's cecropia, coins along a swing)
   - pupoSnatch { cam: rows }: the camera keeps a high moving key's run
     below the HUD (2-4's golden pod conveyor)
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
    if (o.say && p) PupoRide.say(g, p.cx, p.y - 18, o.say);
  };
  S.update = function (dt) {
    upd0.call(this, dt);
    const o = this.s; if (!o || !o.hot || this.taken || this.remove) return;
    if (this.hotT > 0) { this.hotT -= dt; return; }
    const p = this.g.player;
    if (p && !p.dead && !p.pupoRide && overlap(p, this)) { this.hotT = 2.5; this.g.parts.text(this.cx, this.y - 10, o.hot, '#ffd84a'); Sound.play('bump', { vol: 0.35, pitch: 1.4 }); }
  };
}
if (typeof PupoHandle !== 'undefined') {
  const pull0 = PupoHandle.prototype.pull;
  PupoHandle.prototype.pull = function (g, p) { const was = this.used; pull0.call(this, g, p); if (!was && this.s && this.s.say && p) PupoRide.say(g, p.cx, p.y - 18, this.s.say); };
}
if (typeof PupoRide !== 'undefined') PupoRide.afters.push((p, dt, inp, g, R, inMode) => {
  if (!inMode || !p.pupoRide) return;
  const A = g.area, x0 = Math.floor(p.x / TS), x1 = Math.floor((p.x + p.w - 0.01) / TS), y0 = Math.floor(p.y / TS), y1 = Math.floor((p.y + p.h - 0.01) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileAt(A, tx, ty) === T.PICK) { g.setTile(tx, ty, T.EMPTY); g.addPick(tx * TS + TS / 2, ty * TS + TS / 2); }
});
// the camera under a high moving key (pupoSnatch { cam: rows }: 2-4's golden pod on its overhead conveyor): while Brady
// is under its run, the point `rows` over the key's line sits at 24 % of the view's height, so the conveyor's housing
// and the pods are on screen and never under the HUD chips (as 28_tour_pf_g2.js does for the high bars and hooks).
// The area's keys are found once per area (A.g1Snatch); a ceiling on camY that eases in, the plain camera free below it.
if (typeof TourHooks !== 'undefined') TourHooks.on('camera', (play, dt) => {
  const p = play.player, A = play.area; if (!p || p.dead || !A) return;
  if (A.g1Snatch === undefined) {
    A.g1Snatch = null;
    for (const e of A.entities) if (e.pupoSnatch && e.s && e.s.cam) {
      let a = 0, b = 0; for (const q of e.path) { a = Math.min(a, q[0]); b = Math.max(b, q[0]); }
      (A.g1Snatch || (A.g1Snatch = [])).push({ e, x0: e.ox + a * TS, x1: e.ox + b * TS, ay: e.oy - e.s.cam * TS });
    }
  }
  const L = A.g1Snatch; let ay = null;
  if (L) for (let i = 0; i < L.length; i++) { const k = L[i]; if (p.cx > k.x0 - 3 * TS && p.cx < k.x1 + 3 * TS && p.y > k.ay && p.y < k.ay + 10 * TS) { ay = k.ay; break; } }
  if (ay == null) { play.g1CamLim = null; return; }
  const ty = clamp(ay - Game.viewH * 0.24, 0, Math.max(0, A.H * TS - Game.viewH));
  let lim = play.g1CamLim == null ? Math.max(play.camY, ty) : play.g1CamLim;
  lim += (ty - lim) * (1 - Math.exp(-dt * 5)); play.g1CamLim = lim;
  if (play.camY > lim) play.camY = lim;
});
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoG1 }); } catch (e) { /* not in a browser */ }
