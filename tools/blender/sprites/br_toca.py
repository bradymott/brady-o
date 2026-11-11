# Brazil 3-2's secret room "Quati's Den" (theme br_toca, an interior of br_pantanal): the coati's burrow in the roots of
# the hollow tree, as a Fiesta Toon diorama. The theme keeps the cave layer order (03_themes.js caveVariant):
#   L0  (base 0)    the den wall: packed earth in soft plates, thick roots hanging from the ceiling, little alcoves
#                   with the coati's stash (gold coins, a tin cup, a little bell)
#   L1  (base 380)  earth mounds with mushrooms and root loops
#   L2  (base 420)  the near roots: dark arching root silhouettes along the floor
#   ground: earth with root nubs (grass style: a dark loam cap over soil, pebbles)
# Helpers: ma_kit.py.
import math, random
import ma_kit as K
from ma_kit import P, Builder

MODULE = 'br_toca'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 0, 'L1': 380, 'L2': 420}
SKY = ['#05050a', '#2a2014', '#3a2a18']
PALETTE = {
    'back': '#4a3420', 'earth_a': '#5e4228', 'earth_b': '#563c24', 'earth_c': '#664a2e', 'root': '#7a5634', 'root_dk': '#5a3e24',
    'alcove': '#2a1c10', 'gold': '#e8b02a', 'gold_dk': '#b8801a', 'tin': '#a8b0b8', 'bell': '#d8a83a', 'shroom': '#e8d8b8', 'shroom_cap': '#c8642a',
    'mound': '#3e2c1a', 'mound2': '#46321e', 'near': '#2a1c10', 'near2': '#33231a',
    'g_cap': '#7a5a34', 'g_cap_hi': '#9a7a4a', 'g_dirt': '#5a4028', 'g_dirt2': '#4a321e', 'g_rock': '#7a6448',
}
K.use(MODULE, PALETTE, LAYERS)
HH = 16.6


def build_L0(rng):
    L = 'L0'
    Builder('L0_back', L).box('back', (P / 2, 4.0, -HH / 2), (P + 2.0, 1.0, HH + 0.4), bevel=0.0).done(period=None)['outline'] = 0
    S = Builder('L0_plates', L)
    for r in range(12):
        zc = -0.6 - r * HH / 12
        x = rng.uniform(-1.0, 0.0)
        while x < P + 0.5:
            w, h = rng.uniform(2.0, 4.0), rng.uniform(1.2, 1.9)
            for dx in K.wraps(x + w / 2, w / 2 + 0.4):
                S.rbox(rng.choice(('earth_a', 'earth_b', 'earth_c')), (x + w / 2 + dx, 3.2, zc + rng.uniform(-0.3, 0.3)), (w, 0.6, h), bevel=0.5, segments=2, rot=(0, rng.uniform(-0.2, 0.2), 0))
            x += w * rng.uniform(0.78, 0.95)
    S.done(period=None)['outline'] = 0
    # alcoves with the stash
    A = Builder('L0_stash', L)
    for k in range(4):
        x, z = (k + 0.5) * P / 4 + rng.uniform(-1.5, 1.5), -rng.uniform(6.0, 10.0)
        A.arch('alcove', (x, 2.5, z), 2.4, 1.8, 0.1, segs=10)
        for j in range(5):
            A.lathe('gold' if j % 2 else 'gold_dk', [(0.2, 0.0), (0.2, 0.06)], 10, at=(x - 0.6 + 0.12 * j, 2.3, z + 0.06 * j), cap_top=True, cap_bottom=True)
        if k % 2:
            A.lathe('tin', [(0.18, 0.0), (0.2, 0.32), (0.2, 0.34)], 10, at=(x + 0.5, 2.3, z), cap_bottom=True, cap_top=False)
        else:
            A.lathe('bell', [(0.24, 0.0), (0.16, 0.2), (0.1, 0.36), (0.0, 0.4)], 10, at=(x + 0.5, 2.3, z), cap_bottom=True)
    A.done(period=None)['outline'] = 0.5
    R = Builder('L0_roots', L)
    for k in range(12):
        x = rng.uniform(0, P)
        length = rng.uniform(2.0, 6.0)
        n = max(3, int(length / 0.6))
        ph = rng.uniform(0, math.tau)
        pts = [(x + 0.35 * math.sin(ph + 2.0 * j / n * length / 3) * (j / n), 0.3 - length * j / n) for j in range(n + 1)]
        r0 = rng.uniform(0.12, 0.2)
        for j, ((x0, z0), (x1, z1)) in enumerate(zip(pts, pts[1:])):
            R.rod(rng.choice(('root', 'root_dk')), (x0, 2.0, z0), (x1, 2.0, z1), r0 * (1 - 0.6 * j / n), segs=5, r2=r0 * (1 - 0.6 * (j + 1) / n))
    R.done()['outline'] = 0.6


def build_L1(rng):
    L = 'L1'
    K.plain(L, 'L1_fill', 'mound', y=3.0, depth=1.0, top=-0.6, bottom=-3.5)
    B = Builder('L1_mounds', L)
    x = rng.uniform(0, 1)
    while x < P:
        r = rng.uniform(1.2, 2.4)
        for dx in K.wraps(x, r):
            B.sphere(rng.choice(('mound', 'mound2')), (x + dx, 2.4, -0.4), r, scale=(1.3, 0.6, 0.6), subdiv=2)
        x += r * 1.3
    B.done(period=None)['outline'] = 0.4
    M = Builder('L1_shrooms', L)
    for k in range(7):
        x = rng.uniform(0, P)
        for j in range(rng.randint(1, 3)):
            h = rng.uniform(0.3, 0.6)
            M.rod('shroom', (x + j * 0.3, 1.6, 0.0), (x + j * 0.3, 1.6, h), 0.05, segs=5)
            M.sphere('shroom_cap', (x + j * 0.3, 1.6, h), 0.2, scale=(1.0, 0.8, 0.55), subdiv=1)
    M.done()['outline'] = 0.5


def build_L2(rng):
    L = 'L2'
    K.plain(L, 'L2_fill', 'near', y=2.0, depth=1.0, top=-0.5, bottom=-3.5)
    B = Builder('L2_roots', L)
    for k in range(6):
        x0 = rng.uniform(0, P); w = rng.uniform(2.5, 4.5); h = rng.uniform(0.9, 1.6)
        n = 8
        pts = [(x0 + w * j / n, -0.4 + h * math.sin(math.pi * j / n)) for j in range(n + 1)]
        r = rng.uniform(0.18, 0.26)
        for (xa, za), (xb, zb) in zip(pts, pts[1:]):
            B.rod(rng.choice(('near', 'near2')), (xa, 1.4, za), (xb, 1.4, zb), r, segs=6)
    B.done()['outline'] = 0.5


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='nubs', stone_p=0.35, patch_p=0.35, cap_h=0.32)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
