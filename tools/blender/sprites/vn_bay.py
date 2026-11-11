# Vietnam 10-2 "Ha Long Bay": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  vnKarsts (base 286, f 0.02, blur): far misty limestone towers, pale blue-grey, a mist band at their feet
#   L1  vnKarsts (base 296, f 0.05): nearer karst towers with sheer pale flanks, darker streaks and tufts of jungle
#       on their tops and ledges (rounded so nothing reads as a platform)
#   L2  vnBay (base 298, f 0.08, dyn vnJunks): emerald water from the horizon down with long pale glints (no ink)
#   ground: the engine's 'grass' style on limestone: a grass cap over pale grey limestone blocks
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain

MODULE = 'vn_bay'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 286, 'L1': 296, 'L2': 298}
SKY = ['#7ab0d8', '#cfe6ec', '#f2f6e8']
PALETTE = {
    'far': '#b4c6cc', 'far_sh': '#a2b6bc', 'mist': '#e4f2ee',
    'karst': '#8aa69e', 'karst_sh': '#78948c', 'streak': '#6a867e', 'tuft': '#5a8a5a', 'tuft2': '#4c7a4c',
    'sea': '#3aae98', 'sea2': '#2a9a88', 'sea3': '#1e8478', 'glint': '#bff0e0', 'foam': '#e8fff6',
    # ground (grass on limestone)
    'g_cap': '#5aa84a', 'g_cap_hi': '#9ad86a', 'g_blade': '#6ab84a', 'g_dirt': '#a8a89a', 'g_dirt2': '#8a8c80', 'g_rock': '#c8c8b8',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def karst(B, x, y, w, h, rng, body, shade, streak=None, tufts=None):
    """A limestone tower: steep bulging flanks, a rounded overhanging top, a shaded side, streaks and jungle tufts."""
    n = 14
    pts = [(x - w / 2, -1.0), (x + w / 2, -1.0)]
    for i in range(n, -1, -1):
        u = i / n
        bulge = math.sin(u * math.pi) ** 0.35
        zz = h * (0.12 + 0.88 * bulge) + rng.uniform(-0.06, 0.06) * h
        xx = x - w / 2 + u * w + (rng.uniform(-0.5, 0.5) * w * 0.08)
        pts.append((xx, zz))
    B.slab(body, pts, 0.6, at=(0, y, 0))
    # the shaded right flank
    sp = [(x + w * 0.12, -1.0), (x + w / 2, -1.0)] + [(p[0], p[1] - 0.05) for p in pts[2:2 + n // 2 - 1]]
    B.slab(shade, sp, 0.05, at=(0, y - 0.04, 0))
    if streak:
        for k in range(3):
            sx = x - w * 0.3 + k * w * 0.25
            B.rod(streak, (sx, y - 0.06, h * 0.75), (sx + rng.uniform(-0.15, 0.15), y - 0.06, h * 0.25), 0.05, segs=4)
    if tufts:
        for k in range(rng.randint(6, 9)):
            u = rng.uniform(0.15, 0.85)
            tx = x - w / 2 + u * w
            tz = h * (0.12 + 0.88 * math.sin(u * math.pi) ** 0.35) - 0.05
            B.sphere(rng.choice(tufts), (tx, y - 0.1, tz), rng.uniform(0.18, 0.32), scale=(1.0, 0.5, 1.0), subdiv=2)


def build_L0(rng):
    L = 'L0'
    B = Builder('L0_karsts', L)
    for i in range(8):
        x = (i + rng.uniform(0.1, 0.9)) * P / 8
        karst(B, x, 2.0 + 0.3 * (i % 3), rng.uniform(1.8, 3.2), rng.uniform(3.0, 5.4), rng, 'far', 'far_sh')
    B.done()['outline'] = 0.35
    M = Builder('L0_mist', L)
    M.box('mist', (P / 2, 1.0, 0.0), (P + 2.0, 0.1, 1.2), bevel=0.0)
    M.done(period=None)['outline'] = 0


def build_L1(rng):
    L = 'L1'
    B = Builder('L1_karsts', L)
    for i in range(7):
        x = (i + rng.uniform(0.15, 0.85)) * P / 7
        karst(B, x, 1.0 + 0.3 * (i % 2), rng.uniform(2.2, 3.6), rng.uniform(2.6, 4.4), rng, 'karst', 'karst_sh', 'streak', ('tuft', 'tuft2'))
    B.done()['outline'] = 0.55


def build_L2(rng):
    L = 'L2'
    W = Builder('L2_sea', L)
    W.box('sea', (P / 2, 1.0, -0.6), (P + 2.0, 1.0, 1.2), bevel=0.0)
    W.box('sea2', (P / 2, 1.05, -2.6), (P + 2.0, 1.0, 2.8), bevel=0.0)
    W.box('sea3', (P / 2, 1.1, -9.0), (P + 2.0, 1.0, 10.0), bevel=0.0)
    W.box('foam', (P / 2, 0.4, -0.03), (P + 2.0, 0.1, 0.06), bevel=0.0)
    W.done(period=None)
    G = Builder('L2_glints', L)
    for k in range(60):
        z = -rng.uniform(0.2, 6.0)
        G.sphere('glint', (rng.uniform(0, P), 0.2, z), rng.uniform(0.25, 0.8) * (1 + -z * 0.1), scale=(1.0, 0.1, 0.04 + 0.004 * -z), subdiv=1)
    G.done()
    for o in K.COLL[L].objects:
        o['outline'] = 0


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='grass', stone_p=0.6, patch_p=0.2)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
