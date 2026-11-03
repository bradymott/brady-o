# Textured test prop for the engine's PBR path (src/40_burns_bd_pbr.js, docs/BURNS_GUIDE.md §6.10):
# an "art car pit crate": a bevelled plastic road case with a lid, steel corner posts, handles, a latch and rubber feet.
# Everything is generated here, headless: the mesh (bmesh, explicit box UVs into a hand-packed 1024² atlas), and the
# textures as numpy pixel arrays (base colour with stripes, stickers and dirt; ORM = occlusion / roughness / metallic
# with steel rivets and scuffed paint; a normal map with rivet domes, panel seams, ribs and dents; an emissive map with
# an EL-wire strip around the lid). The steel parts use a second, tiling 256² material (REPEAT UVs, world-projected).
#
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/pbr_demo.py
#
# Writes assets/models/burning-man/pbr_crate.glb (textures embedded as PNG). Authoring notes for artists: see §6.10.
import bpy, bmesh, math, os, struct, zlib, tempfile
import numpy as np
from mathutils import Vector

ROOT = os.environ.get('BRADY_ROOT') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT_DIR = os.path.join(ROOT, 'assets', 'models', 'burning-man')
OUT = os.path.join(OUT_DIR, 'pbr_crate.glb')
os.makedirs(OUT_DIR, exist_ok=True)
TMP = tempfile.mkdtemp(prefix='pbr_crate_')

# ---------------- the crate (engine metres; Blender x = engine x, Blender -y = engine +z (front), Blender z = up) ----------------
BW, BD, BH, BY0 = 1.10, 0.76, 0.66, 0.04      # body width (x), depth (y), height, bottom height (on the feet)
LW, LD, LH = 1.16, 0.82, 0.14                 # lid
POST = 0.05
S = 360                                       # atlas pixels per metre
ATLAS = 1024
MTILE = 0.28                                  # the steel tile covers 0.28 m
# atlas regions (px, v up): name -> (x0, y0, w, h); sized w = metres × S
REG = {
    'front': (8, 8, 396, 238), 'back': (412, 8, 396, 238), 'rubber': (816, 8, 128, 128), 'latch': (816, 144, 128, 102),
    'left': (8, 254, 274, 238), 'right': (290, 254, 274, 238), 'top': (572, 254, 396, 274),
    'lidtop': (8, 536, 418, 295), 'lidL1': (434, 536, 418, 50), 'lidL2': (434, 594, 418, 50), 'lidS1': (434, 652, 295, 50), 'lidS2': (434, 710, 295, 50),
}

# ---------------- PNG writer (rows given bottom-up, like Blender UV v) ----------------
def write_png(path, arr):
    arr = np.ascontiguousarray(arr.astype(np.uint8)); H, W = arr.shape[:2]; C = 1 if arr.ndim == 2 else arr.shape[2]
    ctype = {1: 0, 3: 2, 4: 6}[C]
    raw = bytearray()
    prev = np.zeros(arr.shape[1:], np.uint8).reshape(W, -1)
    for y in range(H - 1, -1, -1):   # PNG rows top-down; 'Up' filter (delta to the previous row) compresses smooth maps well
        row = arr[y].reshape(W, -1)
        raw += b'\x02' + ((row.astype(np.int16) - prev.astype(np.int16)) & 255).astype(np.uint8).tobytes()
        prev = row
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, ctype, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b''))
    return os.path.getsize(path)

# ---------------- noise ----------------
def vnoise(h, w, cell, rng):
    gh, gw = h // cell + 2, w // cell + 2
    g = rng.random((gh, gw))
    ys = np.arange(h) / cell; xs = np.arange(w) / cell
    y0 = np.floor(ys).astype(int); x0 = np.floor(xs).astype(int); fy = ys - y0; fx = xs - x0
    fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
    a = g[y0][:, x0]; b = g[y0][:, x0 + 1]; c = g[y0 + 1][:, x0]; d = g[y0 + 1][:, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy)[:, None] + (c * (1 - fx) + d * fx) * fy[:, None]
def fbm(h, w, cell, rng, octaves=4):
    out = np.zeros((h, w)); amp = 1.0; tot = 0.0
    for _ in range(octaves):
        out += vnoise(h, w, max(2, cell), rng) * amp; tot += amp; cell //= 2; amp *= 0.5
    return out / tot
def sstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

# ---------------- the painter: one region = one face, in metres (u right, v up), 6 px margin replicating the edge ----------------
class Atlas:
    def __init__(self, size, seed):
        self.n = size
        self.base = np.zeros((size, size, 3)); self.orm = np.zeros((size, size, 3)); self.h = np.zeros((size, size)); self.em = np.zeros((size, size, 3))
        self.orm[..., 0] = 1; self.orm[..., 1] = 0.6
        self.rng = np.random.default_rng(seed)
    def grid(self, rect, margin=6):
        x0, y0, w, h = rect
        xs = np.arange(x0 - margin, x0 + w + margin); ys = np.arange(y0 - margin, y0 + h + margin)
        U = np.clip((xs + 0.5 - x0) / S, 0, w / S); V = np.clip((ys + 0.5 - y0) / S, 0, h / S)
        U, V = np.meshgrid(U, V)
        return (slice(ys[0], ys[-1] + 1), slice(xs[0], xs[-1] + 1)), U, V, w / S, h / S
    def put(self, sl, col, ao, rough, metal, h, em=None):
        self.base[sl] = np.clip(col, 0, 1); self.orm[sl] = np.clip(np.stack([ao, rough, metal], -1), 0, 1); self.h[sl] = h
        if em is not None: self.em[sl] = np.clip(em, 0, 1)
    def normal_map(self, hmin=0.0):
        # height in metres on an S px/m grid: slope = dh × S; glTF tangent space is +X right, +Y up (OpenGL)
        dv, du = np.gradient(self.h)
        nx = -du * S; ny = -dv * S; nz = np.ones_like(nx)
        l = np.sqrt(nx * nx + ny * ny + nz * nz)
        return np.stack([nx / l, ny / l, nz / l], -1) * 0.5 + 0.5

ORANGE = np.array([0.82, 0.24, 0.03]); YELLOW = np.array([0.95, 0.80, 0.12]); INK = np.array([0.08, 0.08, 0.09])
STEEL = np.array([0.58, 0.59, 0.62]); TEAL = np.array([0.05, 0.55, 0.60]); WHITE = np.array([0.92, 0.92, 0.9]); MAGENTA = np.array([0.85, 0.12, 0.5])

def rrect_d(U, V, cx, cy, hw, hh, r):   # signed distance to a rounded rectangle
    qx = np.abs(U - cx) - (hw - r); qy = np.abs(V - cy) - (hh - r)
    return np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2) + np.minimum(np.maximum(qx, qy), 0) - r

def paint_panel(A, name, kind, rng):
    """kind: 'side' (body faces), 'top', 'lidtop', 'lidside'."""
    sl, U, V, w, h = A.grid(REG[name])
    H, W = U.shape
    col = np.broadcast_to(ORANGE, (H, W, 3)).copy()
    n1 = fbm(H, W, 48, rng); n2 = fbm(H, W, 12, rng, 3)
    col *= (0.94 + 0.12 * n1)[..., None]
    rough = 0.52 + 0.16 * n2; metal = np.zeros((H, W)); ao = np.ones((H, W)); hgt = np.zeros((H, W)); em = np.zeros((H, W, 3))
    # moulded ribs across the body sides
    if kind == 'side':
        for vy in (0.22, 0.34, 0.46):
            k = np.clip(1 - np.abs(V - vy) / 0.022, 0, 1); hgt += 0.0022 * k * k * (3 - 2 * k)
    # the lid's EL wire: a glowing strip at mid height, with a little ridge
    if kind == 'lidside':
        k = sstep(0.014, 0.006, np.abs(V - h * 0.5))
        col = col * (1 - k)[..., None] + np.array([0.85, 0.98, 1.0]) * k[..., None]
        rough = rough * (1 - k) + 0.22 * k; hgt += 0.0015 * k; em += (np.array([0.15, 0.95, 1.0]) * k[..., None])
    # panel seam: a groove inset from the edges, darker inside
    inset = 0.045 if kind not in ('lidside',) else 0.0
    if inset:
        d = np.abs(rrect_d(U, V, w / 2, h / 2, w / 2 - inset, h / 2 - inset, 0.02))
        g = sstep(0.006, 0.002, d); hgt -= 0.0028 * g; ao *= 1 - 0.35 * g; col *= (1 - 0.2 * g)[..., None]
        inner = rrect_d(U, V, w / 2, h / 2, w / 2 - inset, h / 2 - inset, 0.02) < 0
    else: inner = np.ones((H, W), bool)
    # hazard stripes along the bottom of the body sides
    if kind == 'side':
        band = (V < 0.10) & inner
        stripe = ((U + V) / 0.07) % 2 < 1
        sc = np.where(stripe[..., None], YELLOW, INK)
        col = np.where(band[..., None], sc, col); rough = np.where(band, 0.42 + 0.1 * n2, rough)
    # stickers (rounded rectangles with a white border) and a round badge
    def sticker(cx, cy, hw, hh, c1, c2=None, r=0.012):
        nonlocal col, rough
        d = rrect_d(U, V, cx, cy, hw, hh, r)
        m = sstep(0.0015, -0.0015, d); b = sstep(0.0015, -0.0015, d + 0.007)
        art = np.broadcast_to(c1, (H, W, 3)).copy()
        if c2 is not None:
            chev = ((U - cx) + 0.6 * np.abs(V - cy)) / 0.05 % 2 < 1
            art = np.where(chev[..., None], c1, c2)
        skin = WHITE * (1 - b)[..., None] + art * b[..., None]
        col = col * (1 - m)[..., None] + skin * m[..., None]; rough = rough * (1 - m) + 0.3 * m
    def badge(cx, cy, r):
        nonlocal col, rough
        d = np.sqrt((U - cx) ** 2 + (V - cy) ** 2) - r
        m = sstep(0.0015, -0.0015, d)
        ring = np.abs(np.sqrt((U - cx) ** 2 + (V - cy) ** 2) - r * 0.6) < r * 0.1
        rays = (np.arctan2(V - cy, U - cx) / (math.pi / 8)) % 2 < 1
        art = np.where((ring | (rays & (d < -r * 0.45)))[..., None], MAGENTA, np.where((d < -r * 0.2)[..., None], YELLOW, TEAL))
        col = col * (1 - m)[..., None] + art * m[..., None]; rough = rough * (1 - m) + 0.28 * m
    if kind == 'side' and w > 0.9: sticker(w * 0.3, h * 0.6, 0.13, 0.055, TEAL, WHITE); badge(w * 0.72, h * 0.6, 0.085)
    elif kind == 'side': sticker(w * 0.5, h * 0.62, 0.1, 0.05, MAGENTA); badge(w * 0.5, h * 0.3 + 0.03, 0.06)
    elif kind == 'top': badge(w * 0.5, h * 0.5, 0.16); sticker(w * 0.18, h * 0.22, 0.08, 0.04, TEAL, WHITE)
    elif kind == 'lidtop':
        chev = (((U - 0.3 * V) / 0.12) % 2 < 1) & (np.abs(V - h / 2) < 0.08) & inner
        col = np.where(chev[..., None], INK, col); badge(w * 0.5, h * 0.5, 0.12); sticker(w * 0.2, h * 0.8, 0.07, 0.035, MAGENTA)
    # rivets along the seam: steel domes
    if inset:
        pts = []
        for t in np.arange(inset + 0.03, w - inset - 0.03 + 1e-6, 0.11): pts += [(t, inset + 0.022), (t, h - inset - 0.022)]
        for t in np.arange(inset + 0.03 + 0.11, h - inset - 0.03 - 0.11 + 1e-6, 0.11): pts += [(inset + 0.022, t), (w - inset - 0.022, t)]
        for (px, py) in pts:
            d = np.sqrt((U - px) ** 2 + (V - py) ** 2); r = 0.017
            m = sstep(r + 0.0015, r - 0.0015, d)
            dome = np.sqrt(np.clip(1 - (d / r) ** 2, 0, 1)) * 0.0045
            hgt = hgt * (1 - m) + dome * m
            col = col * (1 - m)[..., None] + (STEEL * (0.9 + 0.2 * n2[..., None])) * m[..., None]
            rough = rough * (1 - m) + 0.32 * m; metal = np.maximum(metal, m)
            ao *= 1 - 0.3 * sstep(r + 0.012, r, d) * (1 - m)
    # dents: shallow dimples
    for _ in range(3 if kind in ('side', 'lidtop', 'top') else 0):
        cx, cy, r = rng.uniform(0.1, w - 0.1), rng.uniform(0.12, h - 0.1), rng.uniform(0.05, 0.11)
        d2 = ((U - cx) ** 2 + (V - cy) ** 2) / (r * r)
        hgt -= 0.006 * np.exp(-d2 * 2.5)
    # dirt (playa dust) creeping up from the bottom, scuffs that polish the plastic
    if kind in ('side', 'lidside'):
        dirt = (1 - sstep(0.0, 0.42 if kind == 'side' else 0.1, V)) * (0.45 + 0.55 * n1)
        col = col * (1 - 0.38 * dirt)[..., None] + np.array([0.72, 0.62, 0.5]) * (0.25 * dirt)[..., None]
        rough += 0.3 * dirt
    scuff = sstep(0.62, 0.8, fbm(H, W, 20, rng, 3) * 0.6 + vnoise(H, W, 3, rng) * 0.4)
    col = col * (1 + 0.14 * scuff)[..., None]; rough -= 0.22 * scuff
    A.put(sl, col, ao, rough, metal, hgt, em)

def paint_rubber(A, rng):
    sl, U, V, w, h = A.grid(REG['rubber']); H, W = U.shape
    n = vnoise(H, W, 4, rng)
    A.put(sl, np.broadcast_to(np.array([0.08, 0.08, 0.085]), (H, W, 3)) * (0.9 + 0.3 * n)[..., None], np.ones((H, W)), 0.85 + 0.1 * n, np.zeros((H, W)), 0.0006 * n)
def paint_latch(A, rng):
    sl, U, V, w, h = A.grid(REG['latch']); H, W = U.shape
    n = fbm(H, W, 24, rng, 3)
    col = np.broadcast_to(STEEL, (H, W, 3)) * (0.85 + 0.25 * n)[..., None]
    d = rrect_d(U, V, w / 2, h / 2, w * 0.3, h * 0.25, 0.01); slot = sstep(0.002, -0.002, d)
    A.put(sl, col * (1 - 0.6 * slot)[..., None], 1 - 0.4 * slot, 0.3 + 0.2 * n, np.ones((H, W)), -0.004 * slot)

def steel_tile(size, rng):
    """The tiling steel material: brushed streaks, a 2×2 rivet grid, scratches. Returns (base, orm, normal) arrays."""
    px = size / MTILE
    xs = (np.arange(size) + 0.5) / px; U, V = np.meshgrid(xs, xs)
    streak = vnoise(size, size, 1, rng) * 0 + fbm(size, size, 16, rng, 3)
    brushed = np.zeros((size, size)); amp = 1
    for cell in (64, 16, 4):   # anisotropic: long in u, fine in v
        g = rng.random((size // cell + 2, size // 2 + 2))
        ys = np.arange(size) / cell; xs2 = np.arange(size) / 2
        y0 = np.floor(ys).astype(int); x0 = np.floor(xs2).astype(int); fy = ys - y0; fx = xs2 - x0
        a = g[y0][:, x0]; b = g[y0][:, x0 + 1]; c = g[y0 + 1][:, x0]; d = g[y0 + 1][:, x0 + 1]
        brushed += ((a * (1 - fx) + b * fx) * (1 - fy)[:, None] + (c * (1 - fx) + d * fx) * fy[:, None]) * amp; amp *= 0.5
    brushed /= 1.75
    # horizontal brushing: stretch along u by sampling v-noise only
    col = np.broadcast_to(STEEL, (size, size, 3)) * (0.88 + 0.18 * brushed + 0.06 * streak)[..., None]
    rough = 0.3 + 0.1 * brushed + 0.1 * streak; metal = np.ones((size, size)); ao = np.ones((size, size)); hgt = 0.00015 * brushed
    for (cx, cy) in ((0.25, 0.25), (0.75, 0.25), (0.25, 0.75), (0.75, 0.75)):
        d = np.sqrt((U - cx * MTILE) ** 2 + (V - cy * MTILE) ** 2); r = 0.012
        m = sstep(r + 0.0008, r - 0.0008, d); dome = np.sqrt(np.clip(1 - (d / r) ** 2, 0, 1)) * 0.003
        hgt = hgt * (1 - m) + dome * m; col = col * (1 - 0.12 * m)[..., None]; rough = rough * (1 - m) + 0.26 * m
        ao *= 1 - 0.35 * sstep(r + 0.006, r, d) * (1 - m)
    for _ in range(5):   # scratches
        x0, y0, ang, ln = rng.uniform(0, MTILE), rng.uniform(0, MTILE), rng.uniform(0, math.pi), rng.uniform(0.05, 0.14)
        dx, dy = math.cos(ang), math.sin(ang); t = np.clip((U - x0) * dx + (V - y0) * dy, 0, ln)
        d = np.abs((U - x0) * -dy + (V - y0) * dx); on = (((U - x0) * dx + (V - y0) * dy) > 0) & (((U - x0) * dx + (V - y0) * dy) < ln)
        m = sstep(0.0012, 0.0004, d) * on; col = col * (1 + 0.25 * m)[..., None]; rough = rough * (1 - m) + 0.5 * m; hgt -= 0.0004 * m
    dv, du = np.gradient(hgt); nx = -du * px; ny = -dv * px; l = np.sqrt(nx * nx + ny * ny + 1)
    nrm = np.stack([nx / l, ny / l, 1 / l], -1) * 0.5 + 0.5
    return np.clip(col, 0, 1), np.clip(np.stack([ao, rough, metal], -1), 0, 1), nrm

# ---------------- geometry ----------------
def to_u8(a): return np.clip(np.round(a * 255), 0, 255).astype(np.uint8)
def srgb(a): return np.where(a <= 0.0031308, a * 12.92, 1.055 * np.power(np.maximum(a, 1e-9), 1 / 2.4) - 0.055)

def box_uv_fn(rects):
    """UV assignment for a box: rects maps face keys ('+x','-x','+y','-y','+z','-z') to atlas rects (px) + the face's
    metre size; returns fn(face_key, local point (centred box coords), dims) -> (u, v) in 0..1."""
    def fn(key, p, dims):
        w, d, h = dims
        if key not in rects: return (0.0, 0.0)
        x0, y0, rw, rh = rects[key]
        # 'right' as seen by a viewer facing the face; 'up' is +z for sides, -y (toward the front) for the top
        if key == '-y': a, b, aw, bh = p.x, p.z, w, h          # front (Blender -y faces the engine's +z)
        elif key == '+y': a, b, aw, bh = -p.x, p.z, w, h       # back
        elif key == '+x': a, b, aw, bh = p.y, p.z, d, h        # left side (engine +x)
        elif key == '-x': a, b, aw, bh = -p.y, p.z, d, h       # right side
        elif key == '+z': a, b, aw, bh = p.x, -p.y, w, d       # top
        else: a, b, aw, bh = p.x, p.y, w, d                    # bottom
        u = x0 + (a / aw + 0.5) * rw; v = y0 + (b / bh + 0.5) * rh
        return (u / ATLAS, v / ATLAS)
    return fn

def make_box(name, w, d, h, at, uvfn, mat, bevel=0.0, segments=3, world_uv=None):
    """A box centred at `at` (Blender space; h along z). uvfn: box_uv_fn result, or world_uv = metres per tile for a
    planar world projection (the steel parts)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * w, v.co.y * d, v.co.z * h))
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        n = f.normal; key = ('+' if (n.x + n.y + n.z) > 0 else '-') + ('x' if abs(n.x) > 0.5 else 'y' if abs(n.y) > 0.5 else 'z')
        for l in f.loops:
            p = l.vert.co
            if world_uv:
                q = p + Vector(at)
                if key[1] == 'x': a, b = q.y, q.z
                elif key[1] == 'y': a, b = q.x, q.z
                else: a, b = q.x, q.y
                l[uv].uv = (a / world_uv, b / world_uv)
            else: l[uv].uv = uvfn(key, p, (w, d, h))
        if world_uv:   # keep tiling UVs near 0..1 per face (small ranges survive gltfpack's 12-bit quantisation and the engine's ±32 UVs)
            u0 = math.floor(min(l[uv].uv.x for l in f.loops)); v0 = math.floor(min(l[uv].uv.y for l in f.loops))
            for l in f.loops: l[uv].uv = (l[uv].uv.x - u0, l[uv].uv.y - v0)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    ob.location = at; me.materials.append(mat)
    if bevel > 0:
        md = ob.modifiers.new('bevel', 'BEVEL'); md.width = bevel; md.segments = segments; md.limit_method = 'NONE'
        bpy.context.view_layer.objects.active = ob; ob.select_set(True)
        bpy.ops.object.modifier_apply(modifier='bevel'); ob.select_set(False)
    return ob

def make_cyl(name, r, length, at, axis, mat, seg=14, world_uv=MTILE):
    """A rod along `axis` ('x' or 'y'), world-projected UVs (the handles)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=length)
    rot = Vector((0, 1, 0)) if axis == 'x' else Vector((1, 0, 0))
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=__import__('mathutils').Matrix.Rotation(math.pi / 2, 3, rot))
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for l in f.loops:
            q = l.vert.co + Vector(at)
            l[uv].uv = ((q.x + q.y) / world_uv, (q.z + 0.3 * q.y) / world_uv)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    ob.location = at; me.materials.append(mat)
    return ob

def image(path, name, noncolor):
    img = bpy.data.images.load(path); img.name = name
    if noncolor: img.colorspace_settings.name = 'Non-Color'
    img.pack()
    return img

def gltf_settings_group():
    g = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
    g.interface.new_socket('Occlusion', socket_type='NodeSocketFloat')
    g.nodes.new('NodeGroupOutput'); g.nodes.new('NodeGroupInput')
    return g

def material(name, base, orm, nrm, em=None, em_strength=4.0, grp=None):
    mat = bpy.data.materials.new(name); mat.use_nodes = True; nt = mat.node_tree
    mat.use_backface_culling = True   # exported single-sided (glTF doubleSided = false): the engine culls back faces
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    def tex(img, x, y):
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; n.location = (x, y); n.interpolation = 'Linear'; return n
    tb = tex(base, -700, 300); nt.links.new(tb.outputs['Color'], bsdf.inputs['Base Color'])
    to = tex(orm, -700, 0); sep = nt.nodes.new('ShaderNodeSeparateColor'); sep.location = (-400, 0)
    nt.links.new(to.outputs['Color'], sep.inputs['Color'])
    nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness']); nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
    if grp is not None:
        gn = nt.nodes.new('ShaderNodeGroup'); gn.node_tree = grp; gn.location = (-100, -300)
        nt.links.new(sep.outputs['Red'], gn.inputs['Occlusion'])
    tn = tex(nrm, -700, -300); nm = nt.nodes.new('ShaderNodeNormalMap'); nm.location = (-400, -300); nm.space = 'TANGENT'
    nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    if em is not None:
        te = tex(em, -700, -600); nt.links.new(te.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = em_strength
    else: bsdf.inputs['Emission Strength'].default_value = 0.0
    return mat

def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rng = np.random.default_rng(7)
    # ---- textures ----
    A = Atlas(ATLAS, 7)
    for name in ('front', 'back'): paint_panel(A, name, 'side', rng)
    for name in ('left', 'right'): paint_panel(A, name, 'side', rng)
    paint_panel(A, 'top', 'top', rng); paint_panel(A, 'lidtop', 'lidtop', rng)
    for name in ('lidL1', 'lidL2', 'lidS1', 'lidS2'): paint_panel(A, name, 'lidside', rng)
    paint_rubber(A, rng); paint_latch(A, rng)
    sizes = {}
    p_base = os.path.join(TMP, 'crate_base.png'); sizes['base'] = write_png(p_base, to_u8(srgb(A.base)))
    p_orm = os.path.join(TMP, 'crate_orm.png'); sizes['orm'] = write_png(p_orm, to_u8(A.orm))
    p_nrm = os.path.join(TMP, 'crate_normal.png'); sizes['normal'] = write_png(p_nrm, to_u8(A.normal_map()))
    p_em = os.path.join(TMP, 'crate_emissive.png'); sizes['emissive'] = write_png(p_em, to_u8(srgb(A.em)))
    sb, so, sn = steel_tile(256, rng)
    p_sb = os.path.join(TMP, 'steel_base.png'); sizes['steel_base'] = write_png(p_sb, to_u8(srgb(sb)))
    p_so = os.path.join(TMP, 'steel_orm.png'); sizes['steel_orm'] = write_png(p_so, to_u8(so))
    p_sn = os.path.join(TMP, 'steel_normal.png'); sizes['steel_normal'] = write_png(p_sn, to_u8(sn))
    print('textures (bytes):', sizes, 'total', sum(sizes.values()))
    grp = gltf_settings_group()
    crate = material('crate', image(p_base, 'crate_base', False), image(p_orm, 'crate_orm', True), image(p_nrm, 'crate_normal', True), image(p_em, 'crate_emissive', False), 4.0, grp)
    steel = material('steel', image(p_sb, 'steel_base', False), image(p_so, 'steel_orm', True), image(p_sn, 'steel_normal', True), None, 0.0, grp)
    # ---- mesh ----
    objs = []
    body_uv = box_uv_fn({'-y': REG['front'], '+y': REG['back'], '+x': REG['left'], '-x': REG['right'], '+z': REG['top'], '-z': REG['top']})
    objs.append(make_box('body', BW, BD, BH, (0, 0, BY0 + BH / 2), body_uv, crate, bevel=0.022, segments=4))
    lid_uv = box_uv_fn({'-y': REG['lidL1'], '+y': REG['lidL2'], '+x': REG['lidS1'], '-x': REG['lidS2'], '+z': REG['lidtop'], '-z': REG['lidtop']})
    objs.append(make_box('lid', LW, LD, LH, (0, 0, BY0 + BH + LH / 2 - 0.004), lid_uv, crate, bevel=0.03, segments=4))
    rub_uv = box_uv_fn({k: REG['rubber'] for k in ('+x', '-x', '+y', '-y', '+z', '-z')})
    for sx in (-1, 1):
        for sy in (-1, 1):
            objs.append(make_box('foot', 0.13, 0.13, BY0 + 0.01, (sx * (BW / 2 - 0.12), sy * (BD / 2 - 0.12), (BY0 + 0.01) / 2), rub_uv, crate, bevel=0.012, segments=2))
    latch_uv = box_uv_fn({k: REG['latch'] for k in ('+x', '-x', '+y', '-y', '+z', '-z')})
    objs.append(make_box('latch', 0.14, 0.014, 0.1, (0, -BD / 2 - 0.004, BY0 + BH - 0.02), latch_uv, crate, bevel=0.004, segments=2))
    for sx in (-1, 1):   # steel corner posts and handle brackets (tiling steel material, world-projected UVs)
        for sy in (-1, 1):
            objs.append(make_box('post', POST, POST, BH + LH + 0.02, (sx * (BW / 2 - POST * 0.35), sy * (BD / 2 - POST * 0.35), BY0 + (BH + LH + 0.02) / 2 - 0.01), None, steel, bevel=0.008, segments=2, world_uv=MTILE))
        for dy in (-0.14, 0.14):
            objs.append(make_box('bracket', 0.05, 0.04, 0.05, (sx * (BW / 2 + 0.028), dy, BY0 + 0.4), None, steel, bevel=0.006, segments=2, world_uv=MTILE))
        objs.append(make_cyl('handle', 0.015, 0.36, (sx * (BW / 2 + 0.05), 0, BY0 + 0.4), 'y', steel, seg=18))
    # join, smooth by angle, name the root (one static model: everything on bone 0)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active; ob.name = 'crate'
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)   # origin on the ground under the crate's centre
    try: bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    except Exception as e: print('shade_auto_smooth skipped:', e); bpy.ops.object.shade_smooth()
    ob['kind'] = 'pit_crate'
    tri = ob.modifiers.new('tri', 'TRIANGULATE')   # triangles first, so the exporter can write MikkTSpace tangents
    bpy.ops.object.modifier_apply(modifier='tri')
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_extras=True, export_materials='EXPORT', export_normals=True, export_tangents=True, export_animations=False,
                              export_skins=False, export_lights=False, export_cameras=False, export_image_format='AUTO')
    print('pbr_crate: %d triangles, %d vertices, %.2f MB -> %s' % (tris, len(ob.data.vertices), os.path.getsize(OUT) / 1e6, OUT))

build()
