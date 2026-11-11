# Nepal (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) N `np_khadal`: "Crevasse Drop" (12-6 FALL, secret), the
# blue-ice crevasse. Not wired into the game yet: the overhaul's engine work will add the theme; its key matches this
# atlas's name. Rendered as a horizontally seamless backdrop; a vertically tiling version waits for the engine's
# `vertical` image layers (§8.1, JOB=vbg). Original toon art:
#   L0  (base 0, f 0.04): the crevasse walls: deep layered blue ice in banded strata, darker toward the depths, fringes
#       of icicles hanging from the bands, a few pale glints (unlined, calm behind the fall)
#   L1  (base 0, f 0.12): a few nearer, unlined slabs of ice jutting from the walls (no snow edges: never a ledge)
#   ground: hard blue crevasse ice: dark blue blocks under a pale ice lip
import math, random
import jp_kit as K
from jp_kit import P, Builder, wraps, TAU

MODULE = 'np_khadal'
LAYERS = ['L0', 'L1']
BASES = {'L0': 0, 'L1': 0}
SKY = ['#4a8ac8', '#2a5aa0', '#0e2a5a']
PX = 28.1
PALETTE = {
    'deep': '#123a6e', 'band1': '#2a6aa8', 'band2': '#3a7cba', 'band3': '#225a98', 'band4': '#4a8cc8', 'icicle': '#8ac4ec',
    'glint': '#c8e8fa', 'slab': '#2e6aa6', 'slab2': '#2a62a0', 'slabsnow': '#e8f6ff',
    'g_cap': '#a8d4f0', 'g_cap_hi': '#d8f0ff', 'g_dirt': '#123a6e', 'g_rock': '#2a6aa8', 'g_rock2': '#225a98', 'g_rock3': '#3a7cba',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    B = Builder('L0_deep', L)
    B.box('deep', (P / 2, 3.0, -8.0), (P + 2.0, 0.5, 18.0), bevel=0.0)
    ob = B.done(period=None)
    ob['outline'] = 0
    S = Builder('L0_strata', L)
    I = Builder('L0_icicles', L)
    z = 0.3
    k = 0
    while z > -16.0:
        h = rng.uniform(0.9, 1.8)
        role = ('band1', 'band2', 'band3', 'band4')[k % 4]
        n = 60
        pts = []
        for j in range(n + 1):
            x = -1.0 + (P + 2.0) * j / n
            pts.append((x, z + 0.18 * math.sin(TAU * 3 * x / P + k) + 0.08 * math.sin(TAU * 7 * x / P + 2 * k)))
        poly = [(pts[0][0], z - h), (pts[-1][0], z - h)] + pts[::-1]
        S.slab(role, poly, 0.3, at=(0, 2.0 - 0.05 * k, 0))
        for j in range(int(P / 1.4)):
            x = (j + rng.uniform(0.1, 0.9)) * P / int(P / 1.4)
            zz = z - h + 0.05 + 0.18 * math.sin(TAU * 3 * x / P + k + 1)
            ln = rng.uniform(0.3, 0.7)
            for dx in wraps(x, 0.2):
                I.lathe('icicle', [(0.1, 0.0), (0.05, -ln * 0.5), (0.0, -ln)], 5, at=(x + dx, 1.6 - 0.05 * k, zz))
        z -= h * rng.uniform(0.8, 1.0)
        k += 1
    os_ = S.done(period=None)
    os_['outline'] = 0
    oi = I.done(period=None)
    oi['outline'] = 0
    G = Builder('L0_glints', L)
    for j in range(14):
        x, zz = rng.uniform(0, P), rng.uniform(-15.0, -0.5)
        for dx in wraps(x, 0.4):
            G.slab('glint', [(0.0, 0.0), (0.08, 0.0), (0.3, 0.9), (0.22, 0.9)], 0.02, at=(x + dx, 1.0, zz))
    og = G.done(period=None)
    og['outline'] = 0


def build_L1(rng):
    L = 'L1'
    B = Builder('L1_slabs', L)
    for j in range(5):
        x = (j + rng.uniform(0.2, 0.8)) * P / 5
        zz = rng.uniform(-14.0, -1.5)
        w, h = rng.uniform(1.6, 2.8), rng.uniform(0.5, 0.9)
        for dx in wraps(x, w / 2 + 0.3):
            B.slab(rng.choice(('slab', 'slab2')), [(-w / 2, -h), (w / 2 - 0.3, -h * 0.8), (w / 2, 0.0), (-w / 2 + 0.2, 0.05)], 0.8, at=(x + dx, 0.0, zz))
    ob = B.done(period=None)
    ob['outline'] = 0


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.24, rows=(1, 2), cols=(1, 2), gap=0.08, jitter=0.35, roles=('g_rock', 'g_rock2', 'g_rock3'), bevel=0.08, hi_h=0.08)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
