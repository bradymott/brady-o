"""Blackwork elbow-mandala sleeves painted into the body base colour (MPFB UV, 4K) from a T-pose position map.
Pattern space: centred on the olecranon, s = metres along the arm toward the shoulder, u = arc length around the arm
from the back (elbow point) line; r, phi = polar in that unrolled plane.
LEFT = reconstructed from the photos (IMG_0933-0938); RIGHT = an invented variation (not a mirror)."""
import numpy as np, json, sys, math
from PIL import Image
W = '/Users/bradymott/brady-o/private/work/'
cfg = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else {}
pos = np.load(W + 'proj/posmap_tpose.npy')            # (H, W, 3), image rows bottom-up (Blender pixel order)
pos = pos[::-1]                                        # to PIL top-down
base = np.asarray(Image.open(W + 'tex/T_Brady_BaseColor_4k.png').convert('RGB')).astype(np.float32) / 255
H, Wd = base.shape[:2]
valid = np.abs(pos).sum(-1) > 1e-6
X, Y, Z = pos[..., 0], pos[..., 1], pos[..., 2]
rng = np.random.default_rng(5)
hashv = rng.random((H, Wd)).astype(np.float32)
def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
def band(x, a, b, soft):      # 1 inside [a, b]
    return ss(a - soft, a + soft, x) * (1 - ss(b - soft, b + soft, x))
XE = cfg.get('elbow_x', 0.469)
def arm_coords(side):
    sx = 1 if side == 'L' else -1
    m = valid & (sx * X > 0.2) & (Z > 1.38) & (Z < 1.62)
    # arm centre line by x bins
    xs = sx * X[m]; ys = Y[m]; zs = Z[m]
    bins = np.linspace(0.2, 0.8, 61); cy = np.zeros(60); cz = np.zeros(60)
    for i in range(60):
        k = (xs >= bins[i]) & (xs < bins[i + 1])
        cy[i] = np.median(ys[k]) if k.sum() > 20 else np.nan; cz[i] = np.median(zs[k]) if k.sum() > 20 else np.nan
    bc = (bins[:-1] + bins[1:]) / 2; ok = ~np.isnan(cy)
    cyf = np.interp(sx * X, bc[ok], cy[ok]); czf = np.interp(sx * X, bc[ok], cz[ok])
    dy = Y - cyf; dz = Z - czf; rho = np.hypot(dy, dz)
    th = np.arctan2(dz * sx * 0 + dz, dy)                 # 0 at the back (+y), toward +z (top) positive
    if side == 'R': th = -th                               # mirrored sense for the other arm
    th = th - cfg.get('th0_' + side, 0.0)
    th = (th + np.pi) % (2 * np.pi) - np.pi
    s = XE - sx * X; u = th * rho
    return m, s, u
def petals(r, ph, r0, r1, n, rot=0.0, invert=False, slot=True):
    a = (ph * n / (2 * np.pi) + rot) % 1.0 - 0.5
    b = np.clip((r - r0) / (r1 - r0), 0, 1)
    if invert: b = 1 - b
    w = 0.47 * np.clip(1 - b ** 2.2, 0, 1) ** 0.55          # pointed arch, tip outward
    inside = band(r, r0, r1, 0.0007)
    aa = np.abs(a)
    outline = (aa < w) & (aa > w - 0.085)
    core = aa < w - 0.085 - 0.03
    gap = (aa >= w - 0.115) & (aa <= w - 0.085)              # skin line inside the outline
    ink = np.zeros_like(r)
    ink = np.where(aa >= w, 1.0, ink)                         # dark between petals
    ink = np.where(outline, 1.0, ink)
    # dotwork inside: darker toward the rim of the petal, lighter in the middle
    dens = cfg.get('dens0', 0.55) + 0.45 * (aa / np.maximum(w, 1e-3)) ** 1.2 + 0.1 * b
    ink = np.where(core, dens, ink)
    ink = np.where(gap, 0.0, ink)
    if slot:
        sl = (aa < 0.06 * (1 - np.abs(b - 0.5) * 2) + 0.012) & (b > 0.18) & (b < 0.78)
        ink = np.where(sl, 0.0, ink)
    edge = band(r, r0 - 0.0018, r0 + 0.0002, 0.0004)          # skin ring between rings
    ink = ink * (1 - edge)
    return ink * inside, inside
def mandala(s, u, side):
    C = cfg.get(side, {})
    r = np.hypot(s, u); ph = np.arctan2(u, s)
    ink = np.zeros_like(r); cover = np.zeros_like(r)
    rc = C.get('core', 0.010); rr = C.get('rays_r', 0.047); nr = C.get('rays', 22)
    # sunburst: dark wedges from the bare centre out to the ray ring, thin skin separations, spiky inner ends
    a = (ph * nr / (2 * np.pi)) % 1.0 - 0.5
    t = np.clip((r - rc) / (rr - rc), 0, 1)
    sep = np.abs(a) < 0.035 + 0.035 * (1 - t)
    spike = np.abs(a) * 2 > np.clip((r - rc) / 0.004, 0, 1) + 0.0    # pointed inner tips
    ray = band(r, rc, rr, 0.0008) * (~sep) * (~spike)
    if C.get('dot_ring'):
        ray = ray * (1 - band(r, C['dot_ring'] - 0.002, C['dot_ring'] + 0.002, 0.0005)) + \
              band(r, C['dot_ring'] - 0.002, C['dot_ring'] + 0.002, 0.0005) * (np.abs(((ph * nr * 2 / (2 * np.pi)) % 1) - 0.5) < 0.2)
    ink = np.maximum(ink, ray); cover = np.maximum(cover, band(r, rc, rr, 0.0008))
    for (r0, r1, n, rot, inv) in C.get('rings', [(0.048, 0.080, 14, 0.0, False), (0.081, 0.114, 16, 0.5, False),
                                                    (0.115, 0.150, 18, 0.0, False), (0.151, 0.19, 20, 0.5, False)]):
        k, ins = petals(r, ph, r0, r1, n, rot, inv)
        ink = np.where(ins > 0.5, k, ink); cover = np.maximum(cover, ins)
    # beyond the rings: solid black with a dotwork fade into it (big triangles on the forearm)
    rmax = C.get('rings', [(0, 0.19)])[-1][1] if C.get('rings') else 0.19
    outer = r > rmax
    tri_n = C.get('tri_n', 7)
    at = ((u / 0.25) * tri_n) % 1.0 - 0.5
    tri = np.abs(at) < 0.5 * np.clip((-s - rmax * 0.55) / 0.06, 0, 1)
    dotf = 0.6 + 0.4 * ss(rmax, rmax + 0.03, r)
    ink = np.where(outer, np.where(tri, 1.0, dotf), ink); cover = np.where(outer, 1.0, cover)
    # forearm end: an angled clean edge, a solid band just before it
    se = C.get('end_s', -0.15) + C.get('end_tilt', -0.03) * (u / 0.12)
    endmask = ss(se - 0.002, se + 0.002, s)
    bandk = band(s, se, se + C.get('end_band', 0.012), 0.001)
    ink = np.maximum(ink, bandk) * endmask; cover = cover * endmask
    # small hex flower near the sleeve on the inner/front side
    hx, hu, hr = C.get('flower', (0.105, 0.115, 0.016))
    for sg in (1, -1):
        d = np.hypot(s - hx, u - sg * hu); pa = np.arctan2(u - sg * hu, s - hx)
        fl = (d < hr) & ((np.cos(pa * 6) * 0.5 + 0.5) * hr * 0.9 + hr * 0.15 > d) & (d > 0.0025)
        ink = np.where(d < hr * 1.15, np.where(fl, 0.15, 1.0), ink)
    return np.clip(ink, 0, 1), cover
out = base.copy()
LIN = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
SRGB = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
lin = LIN(out)
inkcol = np.array(cfg.get('ink', [0.012, 0.014, 0.017]))
total = np.zeros((H, Wd), np.float32)
for side in ('L', 'R'):
    m, s, u = arm_coords(side)
    ink, cover = mandala(s, u, side)
    # dot stipple: a density becomes dots; solid areas stay solid
    stip = np.where(ink >= 0.999, 1.0, (hashv < ink).astype(np.float32) * 0.6 + ink * 0.4)
    k = stip * cover * m
    total = np.maximum(total, k)
from scipy.ndimage import gaussian_filter
total = gaussian_filter(total, 0.6) * cfg.get('strength', 0.96)
lin = lin * (1 - total[..., None]) + inkcol[None, None] * total[..., None]
out = SRGB(lin)
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(W + 'tex/T_Brady_BaseColor_tat_4k.png')
# preview crops of both arms in UV space
ys, xs = np.nonzero(total > 0.2)
Image.fromarray((total * 255).astype(np.uint8)).resize((1024, 1024)).save(W + 'wip/tat_mask.png')
print('ok', total.mean(), xs.min() if len(xs) else None, xs.max() if len(xs) else None, ys.min() if len(ys) else None, ys.max() if len(ys) else None)
