# Mozambique 4-5 "Ilha Fortress", a SECOND parallax layer rendered as its own atlas `mz_fort_near` (strip 'L1'), for
# depth. Not wired yet: add to theme mz_fort in src/29_tour_mz.js, after its L0 entry,
#   { kind: 'image', atlas: 'mz_fort_near', id: 'L1', base: 365, f: 0.22, color: '#b8a888', fallback: <an mzFort layer> }
#   L1  (base 365, f 0.22): the near quay inside the walls: coconut palms, an old cannon on its wooden carriage, a
#       rounded pyramid of coconuts, a stone well with a bucket, a market awning on poles; rounded tops, nothing that
#       reads as a ledge behind the platforms
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU

MODULE = 'mz_fort_near'
LAYERS = ['L1']
BASES = {'L1': 365}
SKY = ['#3a8ad8', '#9ad0ff', '#fff4e0']
PALETTE = {
    'quay': '#b8a888', 'quay2': '#a89878', 'palm_trunk': '#8a6a40', 'palm_leaf': '#3a9a5a', 'palm_leaf2': '#2e8a4c', 'coconut': '#6a4a2a',
    'cannon': '#3a3a44', 'carriage': '#7a5232', 'wheel': '#5a3a22', 'well': '#d2c2a2', 'well2': '#b0a082', 'bucket': '#7a5232',
    'awning': '#e8423a', 'awning2': '#fff4e0', 'pole': '#6a4a2a',
}
K.use(MODULE, PALETTE, LAYERS)


def palm(B, x, h, y, lean):
    pts = [(x + lean * h * (i / 5) ** 1.6, y, h * i / 5) for i in range(6)]
    for a, b in zip(pts, pts[1:]):
        B.rod('palm_trunk', a, b, 0.13, segs=6, r2=0.11)
    top = pts[-1]
    # a fan of arching fronds over the top (none pointing straight down), their tips drooping
    for k, a in enumerate((-0.25, 0.3, 0.85, 1.4, 1.95, 2.5, 3.05, 3.5)):
        c, s_ = math.cos(a), math.sin(a)
        pts = []
        for u in (0.0, 0.35, 0.7, 1.0):
            r = 1.7 * u
            pts.append((top[0] + c * r, top[2] + s_ * r - 0.9 * u * u))
        for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
            B.rod(('palm_leaf', 'palm_leaf2')[k % 2], (x0, y - 0.1, z0), (x1, y - 0.1, z1), 0.13 if x0 == pts[0][0] else 0.1, segs=4, r2=0.06)
    for k in range(3):
        B.sphere('coconut', (top[0] + 0.12 * (k - 1), y - 0.25, top[2] - 0.15), 0.13, subdiv=1)


def build_L1(rng):
    L = 'L1'
    zf = periodic_profile(rng, 0.2, 0.1, waves=((2, 1.0), (5, 0.3)))
    ridge_slab(L, 'L1_quay', 'quay', zf, y=2.0, depth=1.0, bottom=-4.0, outline=0.5)
    B = Builder('L1_props', L)
    for x, h, lean in ((P * 0.06, 4.6, 0.2), (P * 0.3, 4.0, -0.22), (P * 0.58, 5.0, 0.18), (P * 0.86, 4.3, -0.2)):
        for dx in wraps(x, 2.0):
            palm(B, x + dx, h, 1.5, lean)
    cx = P * 0.18
    for dx in wraps(cx, 1.4):
        B.box('carriage', (cx + dx, 1.2, 0.45), (1.4, 0.7, 0.35), bevel=0.05)
        for sx in (-0.45, 0.45):
            B.lathe('wheel', [(0.32, 0.0), (0.32, 0.12)], 12, at=(cx + dx + sx, 0.8, 0.32), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
        B.rod('cannon', (cx + dx - 0.6, 1.1, 0.75), (cx + dx + 1.1, 1.1, 0.95), 0.2, segs=10, r2=0.14)
        B.sphere('cannon', (cx + dx - 0.65, 1.1, 0.75), 0.22, subdiv=2)
    px = P * 0.42
    for dx in wraps(px, 1.0):
        for row, n in enumerate((4, 3, 2, 1)):
            for k in range(n):
                B.sphere('coconut', (px + dx + (k - (n - 1) / 2) * 0.36, 1.2, 0.18 + row * 0.3), 0.18, subdiv=2)
    wx = P * 0.72
    for dx in wraps(wx, 1.0):
        B.lathe('well', [(0.7, 0.0), (0.7, 0.8), (0.6, 0.85), (0.0, 0.85)], 14, at=(wx + dx, 1.3, 0.0), yscale=0.6, smooth=True)
        B.lathe('well2', [(0.72, 0.6), (0.74, 0.7)], 14, at=(wx + dx, 1.28, 0.0), yscale=0.6, cap_top=False)
        for sx in (-0.6, 0.6):
            B.rod('pole', (wx + dx + sx, 1.0, 0.8), (wx + dx + sx, 1.0, 2.0), 0.05, segs=4)
        B.rod('pole', (wx + dx - 0.7, 1.0, 1.95), (wx + dx + 0.7, 1.0, 1.95), 0.05, segs=4)
        B.lathe('bucket', [(0.16, 0.0), (0.2, 0.3), (0.0, 0.3)], 8, at=(wx + dx + 0.1, 0.9, 1.2), cap_bottom=True)
    ax = P * 0.95
    for dx in wraps(ax, 1.6):
        for sx in (-1.2, 1.2):
            B.rod('pole', (ax + dx + sx, 1.0, 0.0), (ax + dx + sx, 1.0, 2.2), 0.05, segs=4)
        for k in range(6):
            B.slab(('awning', 'awning2')[k % 2], [(-1.4 + k * 0.47, 0.0), (-0.93 + k * 0.47, 0.0), (-0.93 + k * 0.47, -0.45), (-1.4 + k * 0.47, -0.45)], 0.05, at=(ax + dx, 0.9, 2.65), rot=(0, 0, 0))
        B.slab('awning', [(-1.45, 0.0), (1.45, 0.0), (0.0, 0.5)], 0.06, at=(ax + dx, 0.88, 2.65))
    B.done(period=None)['outline'] = 0.6


BUILDERS = {'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
