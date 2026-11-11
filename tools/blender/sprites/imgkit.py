# Image helpers that run inside Blender's Python (numpy, no PIL): load / save RGBA PNGs, contact sheets, compositing
# over a background, box downsampling, paper grain. Used by the style-frame and atlas tools.
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/imgkit.py -- sheet out.png cols a.png b.png ...
import bpy, numpy as np, os, sys, math

def load(path):
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1]      # top row first
    bpy.data.images.remove(img)
    return a

def save(arr, path):
    """arr: float32 (h, w, 4) in 0..1 (sRGB-ish display values), top row first."""
    h, w = arr.shape[:2]
    img = bpy.data.images.new(os.path.basename(path), w, h, alpha=True, float_buffer=False)
    img.colorspace_settings.name = 'Non-Color' if 'Non-Color' in [i.name for i in bpy.types.ColorManagedInputColorspaceSettings.bl_rna.properties['name'].enum_items] else img.colorspace_settings.name
    img.pixels.foreach_set(np.ascontiguousarray(np.clip(arr[::-1], 0, 1), dtype=np.float32).ravel())
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    img.filepath_raw = path; img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)
    return path

def save_webp(arr, path, quality=90):
    """Lossy WebP with alpha (about 4x smaller than PNG), straight (unpremultiplied) colour like save()."""
    h, w = arr.shape[:2]
    img = bpy.data.images.new(os.path.basename(path), w, h, alpha=True, float_buffer=False)
    img.pixels.foreach_set(np.ascontiguousarray(np.clip(arr[::-1], 0, 1), dtype=np.float32).ravel())
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    sc = bpy.context.scene; st = sc.render.image_settings
    st.file_format = 'WEBP'; st.color_mode = 'RGBA'; st.quality = quality
    sc.view_settings.view_transform = 'Standard'
    img.save_render(path, scene=sc)
    bpy.data.images.remove(img)
    return path

def over(dst, src, x, y):
    """Alpha-composite src onto dst at integer (x, y) (top-left), premultiplying on the fly. Clips to dst."""
    H, W = dst.shape[:2]; h, w = src.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0: return dst
    s = src[y0 - y:y1 - y, x0 - x:x1 - x]; d = dst[y0:y1, x0:x1]
    a = s[..., 3:4]
    d[..., :3] = s[..., :3] * a + d[..., :3] * (1 - a)
    d[..., 3:4] = a + d[..., 3:4] * (1 - a)
    return dst

def downsample(arr, k):
    """Box-filter by an integer factor k (premultiplied so edges stay clean)."""
    h, w = arr.shape[:2]; h2, w2 = h // k, w // k
    a = arr[:h2 * k, :w2 * k].copy()
    a[..., :3] *= a[..., 3:4]
    a = a.reshape(h2, k, w2, k, 4).mean(axis=(1, 3))
    al = a[..., 3:4]; a[..., :3] = np.where(al > 1e-4, a[..., :3] / np.maximum(al, 1e-4), 0)
    return a

def resize(arr, w2, h2):
    """Nearest-neighbour resize (for upscaled previews)."""
    h, w = arr.shape[:2]
    ys = (np.arange(h2) * h / h2).astype(int); xs = (np.arange(w2) * w / w2).astype(int)
    return arr[ys][:, xs]

def solid(w, h, rgb, a=1.0):
    out = np.empty((h, w, 4), np.float32); out[..., :3] = rgb; out[..., 3] = a; return out

def vgrad(w, h, stops):
    """Vertical gradient: stops = [(t, (r,g,b)), ...] t in 0..1 from the top."""
    out = np.empty((h, w, 4), np.float32); out[..., 3] = 1
    ts = np.linspace(0, 1, h)
    for c in range(3):
        out[:, :, c] = np.interp(ts, [s[0] for s in stops], [s[1][c] for s in stops])[:, None]
    return out

def grain(arr, amount=0.05, seed=1, scale=1):
    """Paper / canvas grain: value noise multiplied into the colour (alpha untouched)."""
    rng = np.random.default_rng(seed); h, w = arr.shape[:2]
    n = rng.random((h // scale + 1, w // scale + 1)).astype(np.float32)
    n = np.repeat(np.repeat(n, scale, 0), scale, 1)[:h, :w]
    out = arr.copy(); out[..., :3] *= (1 - amount + 2 * amount * n)[..., None]
    return out

def hex_rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def sheet(paths, cols, pad=8, bg=(0.5, 0.5, 0.55), label=None):
    imgs = [load(p) for p in paths]
    cw = max(i.shape[1] for i in imgs); ch = max(i.shape[0] for i in imgs)
    rows = math.ceil(len(imgs) / cols)
    out = solid(cols * (cw + pad) + pad, rows * (ch + pad) + pad, bg)
    for k, im in enumerate(imgs):
        r, c = divmod(k, cols)
        over(out, im, pad + c * (cw + pad), pad + r * (ch + pad))
    return out

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if argv and argv[0] == 'sheet':
        out, cols = argv[1], int(argv[2]); print('WROTE', save(sheet(argv[3:], cols), out))
    elif argv and argv[0] == 'jpeg':      # jpeg quality in.png out.jpg [in2.png out2.jpg ...]
        q = int(argv[1])
        for src, dst in zip(argv[2::2], argv[3::2]):
            a = load(src); a[..., :3] = a[..., :3] * a[..., 3:4] + 1.0 * (1 - a[..., 3:4]); a[..., 3] = 1
            h, w = a.shape[:2]
            img = bpy.data.images.new('j', w, h, alpha=False); img.pixels.foreach_set(np.ascontiguousarray(a[::-1], dtype=np.float32).ravel())
            bpy.context.scene.render.image_settings.file_format = 'JPEG'; bpy.context.scene.render.image_settings.quality = q
            bpy.context.scene.render.image_settings.color_mode = 'RGB'
            img.save_render(dst, scene=bpy.context.scene); bpy.data.images.remove(img); print('WROTE', dst)

def _dilate(m, r):
    """Anti-aliased dilation of an alpha mask by r texels (a disc; partial coverage at the rim)."""
    out = m.copy(); R = int(math.ceil(r))
    H, W = m.shape
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            d = math.hypot(dx, dy)
            w = min(1.0, max(0.0, r + 0.5 - d))
            if w <= 0 or (dx == 0 and dy == 0): continue
            sh = np.zeros_like(m)
            ys0, ys1 = max(0, dy), min(H, H + dy); xs0, xs1 = max(0, dx), min(W, W + dx)
            sh[ys0:ys1, xs0:xs1] = m[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
            np.maximum(out, sh * w, out=out)
    return out

def toon_post(a, ink=1.5, halo=2.5, ink_col=(0.11, 0.08, 0.15), halo_col=(1.0, 0.97, 0.9), halo_a=0.62, ramp=(1.04, 0.9)):
    """The 2D half of the toon2 character look, on one straight-alpha frame (float h x w x 4, top row first):
    a top-to-toe value ramp over the figure, a heavier ink line around the whole silhouette (ink texels outside the
    rendered outline, so the outer contour is thicker than the interior lines) and a soft light keyline outside that
    (halo texels), which keeps a dark character readable on a dark or busy background. Returns a padded copy."""
    P = int(math.ceil(ink + halo)) + 2
    a = np.pad(a, ((P, P), (P, P), (0, 0)))
    m = a[..., 3]
    rows = np.where((m > 0.05).any(axis=1))[0]
    if len(rows) and ramp:
        y0, y1 = rows[0], rows[-1] + 1
        f = np.ones(a.shape[0], np.float32)
        f[y0:y1] = np.linspace(ramp[0], ramp[1], y1 - y0)
        f[y1:] = ramp[1]
        a[..., :3] = np.clip(a[..., :3] * f[:, None, None], 0, 1)
    mi = _dilate(m, ink) if ink > 0 else m
    mh = _dilate(m, ink + halo) * halo_a if halo > 0 else np.zeros_like(m)
    # under layer: ink over halo (straight alpha)
    ua = mi + mh * (1 - mi)
    uc = (np.array(ink_col, np.float32)[None, None] * mi[..., None] + np.array(halo_col, np.float32)[None, None] * (mh * (1 - mi))[..., None]) / np.maximum(ua, 1e-6)[..., None]
    # the frame over it
    sa = m[..., None]
    oa = sa + ua[..., None] * (1 - sa)
    oc = (a[..., :3] * sa + uc * ua[..., None] * (1 - sa)) / np.maximum(oa, 1e-6)
    return np.concatenate([oc, oa], axis=2).astype(np.float32)
