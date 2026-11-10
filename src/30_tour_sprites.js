/* ============================================================
   Pre-rendered art for every country, by naming convention.
   The build bakes BRADY_SPRITES, the list of atlases shipped in
   sprites/ (assets/sprites/super-brady-o-world/<name>.js). For a
   country whose id is an atlas name, its enemies draw from clips
   named after their spawn type (ecBanana -> 'banana'), its coin
   and star from 'coin/spin' and 'star/idle', its item block from
   'qblock_idle_000' / 'used_idle_000'. For a theme whose key is an
   atlas name, its background layers become image strips L0..Ln in
   the theme's own layer order, and its floor tiles come from the
   atlas's 'ground' strip. Everything keeps the procedural art as a
   fallback. Mexico wires itself in 29_tour_mx_sprites.js.
   Tools: tools/blender/sprites (render_country.py, pack_atlas.py).
   ============================================================ */
(() => {
if (typeof Tour === 'undefined' || typeof Atlas === 'undefined') return;
const INDEX = new Set(typeof BRADY_SPRITES !== 'undefined' ? BRADY_SPRITES : []);
const imageLayer = (atlas, i, old) => ({
  kind: 'image', atlas, id: 'L' + i, f: old.f, base: old.base, dyn: old.dyn, color: old.color, fallback: old,
  // layers whose ground line sits under the floor at the usual camera are lifted so their silhouettes show
  shift: old.base > 340 ? -Math.min(60, old.base - 335) : 0
});
for (const id in Tour.countries) {
  const C = Tour.countries[id];
  if (C.spritesWired) continue;
  if (INDEX.has(id)) {
    C.sprites = true; C.atlas = id;
    for (const k in ENTITY_TYPES) {
      if (!k.startsWith(id) || !/^[A-Z]/.test(k.slice(id.length))) continue;
      const cls = ENTITY_TYPES[k];
      if (cls && cls.cfg && !cls.cfg.sprite) cls.cfg.sprite = k.charAt(id.length).toLowerCase() + k.slice(id.length + 1);
    }
    if (C.coin && C.coin.draw) { const old = C.coin.draw; C.coin.draw = (ctx, x, y, t) => { if (!Atlas.animate(ctx, id, 'coin/spin', t || 0, x, y, 1)) old(ctx, x, y, t); }; }
    if (C.star && C.star.draw) { const old = C.star.draw; C.star.draw = (ctx, x, y, t) => { if (!Atlas.animate(ctx, id, 'star/idle', t || 0, x, y, 1)) old(ctx, x, y, t); }; }
    for (const key in THEMES) if (key.startsWith(id + '_')) Atlas.applyTiles(THEMES[key], id, { qblock: 'qblock_idle_000', used: 'used_idle_000', keepAtlas: true });
  }
  for (const key in THEMES) {
    if (!key.startsWith(id + '_') || !INDEX.has(key)) continue;
    const th = THEMES[key];
    if (th.layers && !th.layers.some(L => L.kind === 'image')) th.layers = th.layers.map((L, i) => imageLayer(key, i, L));
    Atlas.applyTiles(th, key, { ground: 'ground' });
  }
}
/* Seamless atlas floors. Every floor tile is cached in its own canvas, clipped exactly to its square; at the
   fractional scales a phone uses, the anti-aliased edges of two neighbours each cover only part of the shared
   pixel, so a faint line of background shows between every pair of tiles (most visible on dark floors such as
   2-4's reef). Each atlas-cut body and cap tile therefore paints 1 px past every side that has a neighbouring tile
   (the overlap lands in the tile cache's padding), but never past an open edge, which keeps its outline and its
   rounded corners. Applies to every theme whose floor comes from an atlas, Mexico's included. */
const BLEED = 1;
const seamless = th => {
  const G = th.ground;
  if (!G || G.seamless || typeof G.paint !== 'function' || typeof G.paintCap !== 'function') return;
  const paint = G.paint, cap = G.paintCap;
  th.ground = Object.assign({}, G, {
    seamless: true,
    paint(ctx, rng, s) {
      const round = (s.top && (s.left || s.right)) || (s.bottom && (s.left || s.right));
      if (round) return paint.call(this, ctx, rng, s);
      // leave paintGround's clip (one save level), paint the tile stretched over its closed sides, re-open a level
      const x0 = s.left ? 0 : -BLEED, x1 = s.right ? TS : TS + BLEED, y0 = s.top ? 0 : -BLEED, y1 = s.bottom ? TS : TS + BLEED;
      ctx.restore(); ctx.save();
      ctx.translate(x0, y0); ctx.scale((x1 - x0) / TS, (y1 - y0) / TS);
      paint.call(this, ctx, rng, s);
      ctx.restore(); ctx.save();
    },
    paintCap(ctx, cx0, cx1, rng, left, right) {
      const x0 = left ? 0 : -BLEED, x1 = right ? TS : TS + BLEED;
      ctx.save(); ctx.translate(x0, 0); ctx.scale((x1 - x0) / TS, (TS + BLEED) / TS);
      cap.call(this, ctx, cx0, cx1, rng, left, right);
      ctx.restore();
    }
  });
};
for (const key in THEMES) { const th = THEMES[key]; if (th && th.atlas && INDEX.has(th.atlas)) seamless(th); }
})();
