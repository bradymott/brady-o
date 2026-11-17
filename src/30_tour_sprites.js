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
/* Dark grid lines. A floor strip ('ground': 8 tiles x 3 rows) is rendered as one block, so its outer texel columns
   (left of tile column 0, right of column 7) and its bottom texel rows carry the block's ink outline. A tile cut from
   an outer column then brings a 1-2 texel dark line into the middle of a floor (3-2, 4-4: dark verticals between tile
   pairs). Floor tiles therefore sample 2 texels in from the strip's outer edges (left, right, bottom; the cap's top
   line is wanted), stretched back to the full tile: invisible at 63/64, and the line is gone. */
const INSET = 2;
const paintTile0 = Atlas.paintTile;
Atlas.paintTile = function (ctx, name, id, col, row, dx, dy, w, h) {
  if (id !== 'ground') return paintTile0.apply(this, arguments);
  const a = this.atlases[name]; if (!a || !a.ready) return false;
  const f = a.meta.frames[id]; if (!f) return false;
  const k = a.scale, tw = (w || TS) * k, th = (h || TS) * k;
  let sx = f.x + col * tw, sy = f.y + row * th, sw = tw, sh = th;
  if (col === 0) { sx += INSET; sw -= INSET; }
  if ((col + 1) * tw >= f.w) sw -= INSET;
  if ((row + 1) * th >= f.h) sh -= INSET;
  ctx.drawImage(a.img, sx, sy, sw, sh, dx || 0, dy || 0, w || TS, h || TS);
  return true;
};
const BLEED = 1;
/* th.groundTint (optional, e.g. 'rgba(255,248,232,0.3)'): washed over the atlas floor tiles (only where they have
   pixels), for a floor whose render reads too heavy for its level (7-1's cobbles under the pale square) */
const tinted = (th, fn) => function () {
  const r = fn.apply(this, arguments), ctx = arguments[0];
  if (th.groundTint) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = th.groundTint; ctx.fillRect(-4, -4, TS + 8, TS + 8); ctx.restore(); }
  return r;
};
const seamless = th => {
  const G = th.ground;
  if (!G || G.seamless || typeof G.paint !== 'function' || typeof G.paintCap !== 'function') return;
  const paint = tinted(th, G.paint), cap = tinted(th, G.paintCap);
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

/* Inked props. The overhauled countries build their set pieces as procedural props (B.prop: a salt shaker, a
   baobab crown, a goal, a fountain...), drawn by Decor[kind] without the Fiesta Toon line, so they sat flat beside
   the sprite art. A static prop (its painter never reads the time) is drawn once through Ink into a cached bitmap at
   the screen's scale and then blitted; an animated one keeps drawing live, uninked (steam, mist, jets). Only props
   (d.prop) of the countries listed get it, and only kinds whose painter is static. */
const INKED_CC = ['br', 'mz', 'ma', 'es', 'fr', 'nl'];
const InkCache = {
  map: new Map(), max: 48,
  draw(ctx, key, x0, y0, w, h, fn) {
    const m = ctx.getTransform ? ctx.getTransform() : null, S = m ? Math.hypot(m.a, m.b) : 0;
    if (!Ink.on || !m || !(S > 0) || m.b || m.c || w * S > 1800 || h * S > 1800) { Ink.around(ctx, x0, y0, w, h, fn, { pad: 6 }); return; }
    const k = key + '@' + S.toFixed(3);
    let e = this.map.get(k);
    if (!e) {
      const pad = 8, cw = Math.ceil((w + pad * 2) * S), ch = Math.ceil((h + pad * 2) * S);
      const c = makeCanvas(cw, ch), cx = c.getContext('2d');
      cx.setTransform(S, 0, 0, S, -(x0 - pad) * S, -(y0 - pad) * S);
      Ink.around(cx, x0, y0, w, h, fn, { pad: 6, noHold: true });
      e = { c, ox: x0 - pad, oy: y0 - pad };
      this.map.set(k, e);
      if (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(e.c, Math.round(m.e + e.ox * S), Math.round(m.f + e.oy * S));
    ctx.restore();
  }
};
if (typeof Decor !== 'undefined') {
  const animated = fn => { const src = String(fn), body = src.slice(src.indexOf('{')); return /[^.\w'"]t\s*[*+\-),;]/.test(body) || /\(\s*t\s*\*/.test(body); };
  for (const k in Decor) {
    const fn = Decor[k];
    if (typeof fn !== 'function' || k === 'draw' || !INKED_CC.some(cc => k.startsWith(cc) && /^[A-Z]/.test(k.slice(cc.length))) || animated(fn) || fn.inkWrapped || /Ink\./.test(String(fn))) continue;   // painters that ink themselves stay as they are
    const w = function (ctx, x, y, t, th, d) {
      if (!d || !d.prop || !d.w || !d.h) return fn.call(this, ctx, x, y, t, th, d);
      // the box: the prop's tiles plus slack for art that spills over them
      const sx = Math.max(24, d.w * 0.35), sy = Math.max(24, d.h * 0.5);
      InkCache.draw(ctx, k + ':' + d.w + 'x' + d.h + ':' + (d.seed || 0) + ':' + (th && th.name || ''), x - d.w / 2 - sx, y - d.h - sy, d.w + sx * 2, d.h + sy + 16, c => fn.call(Decor, c, x, y, t, th, d));
    };
    w.inkWrapped = true; Decor[k] = w;
  }
}
try { window.BRADY_INKCACHE = InkCache; } catch (e) { /* not in a browser */ }
})();
