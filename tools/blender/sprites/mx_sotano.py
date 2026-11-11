# Mexico 1-6 "Pit of Swallows" (the secret freefall level): the parallax background as a toon diorama.
#   L0  mxCenote as a dry limestone pit (base 0: the wall hangs from the strip's top row down past its bottom): big
#       warm limestone plates in soft strata, sunlit pale plates near the top (the light falls from far above), mud
#       swallow nests clustered under overhangs, ferns and roots hanging out of the cracks. Calm and paler than the
#       ledges (no outlines on the strata, nothing ledge-like).
#   ground: dry limestone: a pale ochre cap over rounded cream stones, one layout per 32-px tile.
# Helpers: ma_kit.py.
import math, random
import ma_kit as K
from ma_kit import P, T, CELL_MARGIN, GP, GROUND_DEPTH, GROUND_COLL, Builder, new_collection

MODULE = 'mx_sotano'
LAYERS = ['L0']
BASES = {'L0': 0}
SKY = ['#fff6d8', '#d8c098', '#6a5038']
PALETTE = {
    'back': '#9a8058', 'plate_a': '#b49a6c', 'plate_b': '#a88e62', 'plate_c': '#bea676', 'plate_dk': '#8e7450',
    'plate_lit': '#d8c49a', 'plate_lit2': '#e4d4ae', 'crack': '#6a5236',
    'nest': '#8a6a46', 'nest_dk': '#6a4e32', 'nest_hole': '#2a1c12', 'fern': '#6a8a46', 'fern2': '#56763a', 'root': '#5a4028',
    # ground
    'g_silt': '#9a8462', 'g_cap': '#e2d0a4', 'g_cap_hi': '#f6ecd0', 'stone_a': '#d6c49c', 'stone_b': '#cab68c', 'stone_c': '#e0d0aa',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau
HH = 16.6        # the wall hangs from z = 0 down to -HH (the strip is 15.8 m tall)


def nest_cluster(B, x, y, z, n, rng):
    for k in range(n):
        nx, nz = x + (k - (n - 1) / 2) * 0.55 + rng.uniform(-0.1, 0.1), z - 0.1 * (k % 2)
        B.lathe('nest' if k % 2 else 'nest_dk', [(0.05, -0.45), (0.25, -0.38), (0.32, -0.2), (0.3, 0.0)], 10, at=(nx, y, nz), yscale=0.6, cap_top=True, smooth=True)
        B.sphere('nest_hole', (nx + 0.04, y - 0.2, nz - 0.12), 0.1, scale=(1.1, 0.4, 0.8), subdiv=1)


def fern(B, x, y, z, s, rng, role='fern'):
    for k in range(5):
        a = -math.pi / 2 + (k - 2) * 0.45 + rng.uniform(-0.1, 0.1)
        tip = (x + math.cos(a) * 0.9 * s, y - 0.1, z + math.sin(a) * 0.9 * s)
        B.sphere(role if k % 2 else 'fern2', ((x + tip[0]) / 2, y - 0.1, (z + tip[2]) / 2), 0.45 * s, scale=(1.0, 0.25, 0.32), rot=(0, -a, 0), subdiv=1)


def build_L0(rng):
    L = 'L0'
    W = Builder('L0_back', L)
    W.box('back', (P / 2, 4.0, -HH / 2 - 1.0), (P + 2.0, 1.0, HH - 2.0), bevel=0.0)   # its top stays under the ragged rim
    W.done(period=None)['outline'] = 0
    # the rim of the pit far above: a ragged rock edge against the daylight (the strip's top rows), tufts on it
    Rm = Builder('L0_rim', L)
    x = -1.0
    while x < P + 1.0:
        w = rng.uniform(1.2, 2.6)
        top = -rng.uniform(0.25, 1.6)
        for dx in K.wraps(x + w / 2, w / 2):
            Rm.rbox(rng.choice(('plate_lit2', 'plate_lit')), (x + w / 2 + dx, 3.0, top - 1.2), (w + 0.3, 0.7, 2.4), bevel=0.5, segments=2, rot=(0, rng.uniform(-0.3, 0.3), 0))
        x += w * 0.8
    Rm.done(period=None)['outline'] = 0.35
    # the wall: irregular limestone plates in loose strata, paler and sunlit near the top, darker toward the bottom;
    # tilted and overlapping so no edge runs level like a ledge; no ink
    S = Builder('L0_strata', L)
    rows = 13
    for r in range(rows):
        u = r / (rows - 1)
        zc0 = -2.4 - r * (HH - 2.4) / rows
        x = rng.uniform(-1.0, 0.0)
        while x < P + 0.5:
            w = rng.uniform(1.6, 3.8)
            h = rng.uniform(1.1, 2.1)
            if u < 0.15:
                role = rng.choice(('plate_lit', 'plate_lit2', 'plate_c'))
            elif u < 0.35:
                role = rng.choice(('plate_lit', 'plate_c', 'plate_a'))
            elif u > 0.8:
                role = rng.choice(('plate_b', 'plate_dk', 'plate_b'))
            else:
                role = rng.choice(('plate_a', 'plate_b', 'plate_c'))
            zc = zc0 + rng.uniform(-0.45, 0.45)
            for dx in K.wraps(x + w / 2, w / 2 + 0.4):
                S.rbox(role, (x + w / 2 + dx, 3.2 - 0.1 * (r % 2), zc), (w, 0.6, h), bevel=0.45, segments=2,
                       rot=(0, rng.uniform(-0.28, 0.28), 0))
            x += w * rng.uniform(0.75, 0.95)
    S.done(period=None)['outline'] = 0
    # cracks: a few dark vertical fissures (they break up the strata so nothing reads as a ledge)
    C = Builder('L0_cracks', L)
    for k in range(7):
        x = rng.uniform(0.5, P - 0.5)
        z = -rng.uniform(1.0, HH - 4.0)
        pts = []
        for j in range(6):
            pts.append((x + rng.uniform(-0.25, 0.25), z - j * rng.uniform(0.5, 0.9)))
        for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
            C.rod('crack', (x0, 2.7, z0), (x1, 2.7, z1), 0.08, segs=4, r2=0.06)
    C.done(period=None)['outline'] = 0
    # swallow nests and ferns in the cracks; roots hanging from the rim of the pit
    N = Builder('L0_nests', L)
    for k in range(6):
        x = (k + 0.5) * P / 6 + rng.uniform(-1.5, 1.5)
        z = -rng.uniform(2.5, HH - 2.0)
        nest_cluster(N, x, 2.5, z, rng.choice((2, 3, 4)), rng)
    N.done()['outline'] = 0.6
    F = Builder('L0_ferns', L)
    for k in range(9):
        x = rng.uniform(0, P)
        z = -rng.uniform(1.0, HH - 1.0)
        fern(F, x, 2.4, z, rng.uniform(0.7, 1.1), rng)
    F.done()['outline'] = 0.5
    Rt = Builder('L0_roots', L)
    for k in range(10):
        x = rng.uniform(0, P)
        length = rng.uniform(1.5, 4.5)
        r0z = -rng.uniform(0.6, 1.4)
        n = max(3, int(length / 0.6))
        ph = rng.uniform(0, TAU)
        pts = [(x + 0.3 * math.sin(ph + 2.2 * j / n * length / 3) * (j / n), r0z - length * j / n) for j in range(n + 1)]
        for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
            Rt.rod('root', (x0, 2.2, z0), (x1, 2.2, z1), 0.09 * (1 - z0 / -length * 0.5 if length else 1), segs=5, r2=0.07)
    Rt.done()['outline'] = 0.5


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    """Dry limestone: a pale ochre cap along the walking surface, rounded cream stones set in silt below, laid out
    per 32-px tile (no stone crosses a tile edge). Periodic in x with period GP."""
    K.use(MODULE, PALETTE, LAYERS)
    c = new_collection(GROUND_COLL)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_silt', GROUND_COLL)
    B.box('g_silt', (GP / 2, 0.5, -D / 2 - 0.4), (GP + 1.0, 1.0, D + 0.6), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_stones', GROUND_COLL)
    roles = ['stone_a', 'stone_b', 'stone_c', 'stone_a']
    for col in range(8):
        for row in range(3):
            slab = row > 0 and rng.random() < 0.2
            spec = dict(rows=(1,), cols=(1,), jitter=0.0) if slab else dict(rows=(1, 2), cols=(1, 2), jitter=0.3)
            for xc, zc, w, h in K.cell_rects(col, row, rng, gap=0.1, top=(0.3 if row == 0 else 0.0), **spec):
                B.rbox(rng.choice(roles), (xc, -0.2, zc), (w, 0.36, h), bevel=0.12, segments=2)
    B.done(period=None)
    B = Builder('ground_cap', GROUND_COLL)
    B.box('g_cap', (GP / 2, 0.15, -0.14), (GP + 1.0, 1.0, 0.26), bevel=0.0)
    B.box('g_cap_hi', (GP / 2, 0.08, -0.03), (GP + 1.0, 1.05, 0.06), bevel=0.0)
    B.done(period=None)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
