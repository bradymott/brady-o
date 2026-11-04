/* ============================================================
   Sprite atlases: pre-rendered art (Blender, the Fiesta Toon look)
   packed into PNG sheets by tools/blender/sprites/pack_atlas.py.
   Each atlas is sprites/<name>.png plus sprites/<name>.js, a script
   that calls Atlas.register(name, meta). Scripts load from file://
   too, which the test tools use.

   meta: { scale: texels per logical px, image: 'x.png',
           frames: { id: { x, y, w, h, ox, oy } },   ox,oy = the origin inside the frame (feet centre, or centre)
           anims:  { id: { frames: [ids], fps, loop } },
           strips: { id: { x, y, w, h, top } } }      background strips: `top` = the strip's row offset in the layer
   Art falls back to the procedural drawing until the atlas is in,
   and the tile and background caches are flushed when it arrives.
   ============================================================ */
const Atlas = {
  base: 'sprites/',
  atlases: {}, pending: {}, failed: {}, listeners: [],
  has(name) { const a = this.atlases[name]; return !!(a && a.ready); },
  get(name) { return this.atlases[name] || null; },
  /* load(name): fetch the atlas once; resolves when its image is drawable (or on failure, quietly). */
  load(name) {
    if (this.atlases[name] || this.pending[name] || this.failed[name]) return;
    if (typeof document === 'undefined') return;
    this.pending[name] = true;
    const s = document.createElement('script');
    s.src = this.base + name + '.js';
    s.onerror = () => { delete this.pending[name]; this.failed[name] = true; };
    document.head.appendChild(s);
  },
  need(names) { for (const n of names || []) if (n) this.load(n); },
  register(name, meta) {
    const a = { name, meta, img: new Image(), ready: false, scale: meta.scale || 3 };
    this.atlases[name] = a;
    a.img.onload = () => { a.ready = true; delete this.pending[name]; this.arrived(name); };
    a.img.onerror = () => { delete this.pending[name]; delete this.atlases[name]; this.failed[name] = true; };
    a.img.src = this.base + (meta.image || name + '.png');
  },
  arrived(name) {
    // painted caches were built without this art: rebuild them on the next frame
    if (typeof TileArt !== 'undefined') TileArt.cache = {};
    if (typeof BG !== 'undefined') BG.cache = {};
    for (const fn of this.listeners) { try { fn(name); } catch (e) { console.warn('atlas listener', e); } }
  },
  onLoad(fn) { this.listeners.push(fn); },
  frame(name, id) { const a = this.atlases[name]; return a && a.ready ? a.meta.frames[id] || null : null; },
  anim(name, id) { const a = this.atlases[name]; return a && a.ready ? a.meta.anims[id] || null : null; },
  strip(name, id) { const a = this.atlases[name]; return a && a.ready ? a.meta.strips[id] || null : null; },
  /* draw(ctx, name, id, x, y, facing, o): the frame with its origin at (x, y) in world units; facing -1 mirrors it.
     o: { scale (extra), alpha, rot }. Returns false when the frame is missing, so callers can fall back. */
  draw(ctx, name, id, x, y, facing, o) {
    const a = this.atlases[name]; if (!a || !a.ready) return false;
    const f = a.meta.frames[id]; if (!f) return false;
    const k = (o && o.scale || 1) / a.scale;
    ctx.save();
    ctx.translate(x, y);
    if (o && o.rot) ctx.rotate(o.rot);
    if (facing < 0) ctx.scale(-1, 1);
    if (o && o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.drawImage(a.img, f.x, f.y, f.w, f.h, -f.ox * k, -f.oy * k, f.w * k, f.h * k);
    ctx.restore();
    return true;
  },
  /* animate(ctx, name, animId, t, x, y, facing, o): the frame of a clip at time t (seconds, or a 0..1 phase when
     o.phase is set). Falls back to a plain frame called animId when there is no clip of that name. */
  animate(ctx, name, animId, t, x, y, facing, o) {
    const a = this.atlases[name]; if (!a || !a.ready) return false;
    const an = a.meta.anims[animId];
    if (!an) return this.draw(ctx, name, animId, x, y, facing, o);
    const n = an.frames.length;
    let i = o && o.phase ? Math.floor(t * n) : Math.floor(t * (an.fps || 8));
    i = an.loop === false ? Math.min(n - 1, i) : ((i % n) + n) % n;
    return this.draw(ctx, name, an.frames[i], x, y, facing, o);
  },
  /* strips: blit a background layer strip (seamless 1024 logical px wide) into a layer painter's context */
  paintStrip(ctx, name, id, dx, dy) {
    const a = this.atlases[name]; if (!a || !a.ready) return false;
    const s = a.meta.strips[id]; if (!s) return false;
    const k = 1 / a.scale;
    ctx.drawImage(a.img, s.x, s.y, s.w, s.h, dx || 0, (dy || 0) + (s.top || 0), s.w * k, s.h * k);
    return true;
  },
  /* a tile (TS logical px square) cut from a frame: for the theme's ground, brick, hard and platform painters */
  paintTile(ctx, name, id, col, row, dx, dy, w, h) {
    const a = this.atlases[name]; if (!a || !a.ready) return false;
    const f = a.meta.frames[id]; if (!f) return false;
    const k = a.scale, tw = (w || TS) * k, th = (h || TS) * k;
    ctx.drawImage(a.img, f.x + col * tw, f.y + row * th, tw, th, dx || 0, dy || 0, w || TS, h || TS);
    return true;
  }
,
  /* applyTiles(theme, atlas, ids): give a theme painter hooks that cut its tiles from pre-rendered frames.
     ids = { ground: 'ground' (an 8 x 3 tile strip: cap row, then two fill rows), qblock, used, brick, hard }.
     The theme's colours stay (other code reads them); each hook falls back to the procedural painter until the
     atlas is in. Also records theme.atlas so the level preloads it. */
  applyTiles(th, atlas, ids) {
    const self = this;
    if (!ids.keepAtlas) th.atlas = atlas;
    if (ids.ground) {
      th.ground = Object.assign({}, th.ground, {
        paint(ctx, rng, sides) { const col = Math.floor(rng() * 8); if (!self.paintTile(ctx, atlas, ids.ground, col, 1 + (sides.variant ? 1 : 0), 0, 0) && ids.groundFallback) ids.groundFallback(ctx, rng, sides); },
        paintCap(ctx, x0, x1, rng, left, right) { const col = Math.floor(rng() * 8); if (!self.paintTile(ctx, atlas, ids.ground, col, 0, 0, 0) && ids.capFallback) ids.capFallback(ctx, x0, x1, rng, left, right); }
      });
    }
    if (ids.qblock) { const old = th.qblockArt; th.qblockArt = (ctx, t2, f) => { if (!self.draw(ctx, atlas, ids.qblock, TS / 2, TS / 2 + Math.sin(f * 1.6) * 0.5, 1)) (old || paintQBlock)(ctx, t2, f); }; }
    if (ids.used) { const old = th.usedArt; th.usedArt = (ctx, t2) => { if (!self.draw(ctx, atlas, ids.used, TS / 2, TS / 2, 1)) (old || paintUsed)(ctx, t2); }; }
    if (ids.brick) th.brick = Object.assign({}, th.brick, { paint(ctx) { self.paintTile(ctx, atlas, ids.brick, 0, 0, 0, 0); } });
    if (ids.semi) th.semi = Object.assign({}, th.semi, { paint(ctx, part) { self.paintTile(ctx, atlas, ids.semi, { L: 0, M: 1, R: 2, S: 3 }[part] || 1, 0, 0, 0); } });
    if (ids.hard) th.hard = Object.assign({}, th.hard, { paint(ctx) { self.paintTile(ctx, atlas, ids.hard, 0, 0, 0, 0); } });
    return th;
  }
};
try { window.BRADY_ATLAS = Atlas; } catch (e) { /* not in a browser */ }
