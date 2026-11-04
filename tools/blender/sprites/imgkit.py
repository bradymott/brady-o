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
