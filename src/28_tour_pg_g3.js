/* ============================================================
   World tour: Pupo's rollout to the Netherlands, Indonesia and
   Vietnam (docs/design/PUPO.md §8.2, group P2-G3). One small,
   generic addition, by wrapping only (the engine files 28_tour_p*.js
   and the G1 / G2 wrappers are not edited):
   - the camera over a Pupo obstacle that fills the top of the view
     (any spawn with camBox: [x0, x1, y0, y1, row], tiles): while
     Brady's centre is between columns x0 and x1 and his feet between
     rows y0 and y1, the camera may not sink below the point where
     `row` sits at 24 % of the view's height, so the obstacle's top
     (10-4's pearl chamber and its rock shelf, 8-1's raised drawbridge
     leaves) stays on screen under the HUD chips, in landscape and in
     portrait. A ceiling on camY that eases in (entering never snaps
     the view), the plain camera free below it, as G1 / G2 do for
     their high objects.
   Nothing here allocates per frame (the boxes are found once per
   area and kept on it).
   ============================================================ */
const PupoG3 = {
  // the camBox spawns of an area, found once (A.g3Cam: [] when it has none)
  boxes(A) {
    if (A.g3Cam) return A.g3Cam;
    const L = A.g3Cam = [];
    for (const e of A.entities || []) { const b = e.s && e.s.camBox; if (b) L.push({ x0: b[0] * TS, x1: (b[1] + 1) * TS, y0: b[2] * TS, y1: (b[3] + 1) * TS, ay: b[4] * TS }); }
    return L;
  },
  // the row `ay` (px) a ceiling keeps on screen, or null when Brady is in none of the boxes
  find(A, p) {
    const L = this.boxes(A), fy = p.y + p.h;
    for (let i = 0; i < L.length; i++) { const k = L[i]; if (p.cx >= k.x0 && p.cx <= k.x1 && fy >= k.y0 && fy <= k.y1) return k.ay; }
    return null;
  }
};
if (typeof TourHooks !== 'undefined') TourHooks.on('camera', (play, dt) => {
  const p = play.player, A = play.area; if (!p || p.dead || !A) return;
  const ay = PupoG3.find(A, p);
  if (ay == null) { play.g3CamLim = null; return; }
  const ty = clamp(ay - Game.viewH * 0.24, 0, Math.max(0, A.H * TS - Game.viewH));
  let lim = play.g3CamLim == null ? Math.max(play.camY, ty) : play.g3CamLim;
  lim += (ty - lim) * (1 - Math.exp(-dt * 5)); play.g3CamLim = lim;
  if (play.camY > lim) play.camY = lim;
});
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoG3 }); } catch (e) { /* not in a browser */ }
