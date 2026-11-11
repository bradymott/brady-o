# Japan 11-1 "Bamboo Grove" (theme jp_bamboo): original toon art for the grove the Shiba guards.
#   L0  jpHills  (base 300, f 0.02, #a8c4b0, blur): two soft misty ridges, the far one unlined
#   L1  jpBamboo (base 270, floor 330, f 0.06, #8ab894, blur): a pale, dense stand of culms rising out of view,
#       leaf sprays at the nodes, the mossy grove floor under them
#   L2  jpBamboo (base 270, floor 350, f 0.16, #5a9a52): fewer, thicker, greener culms nearer the path
#   ground jpMoss: a moss cap with little fronds over dark loam with grey stones
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU

MODULE = 'jp_bamboo'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 300, 'L1': 270, 'L2': 270}
SKY = ['#9ac8b8', '#d8ecd8', '#f4f8e8']
PX = 28.1
PALETTE = {
    'hill_far': '#b8d0c0', 'hill': '#9cbca4', 'hill_sh': '#90b298', 'pine': '#8cb49a', 'pine2': '#98bea4',
    'c1a': '#a8c8a0', 'c1b': '#b4d0a8', 'c1n': '#90b488', 'c1leaf': '#a0c494', 'c1leaf2': '#b0d0a2', 'c1floor': '#88aa80',
    'c2a': '#5e9e4e', 'c2b': '#6eac56', 'c2c': '#78b45c', 'c2n': '#3e7a38', 'c2leaf': '#5a9a46', 'c2leaf2': '#78b45a',
    'c2floor': '#4a7a3a', 'c2floor2': '#5a8a42',
    'g_cap': '#5a9a3a', 'g_cap_hi': '#8ac85a', 'g_blade': '#6aae44', 'g_dirt': '#5a4430', 'g_dirt2': '#4a3828', 'g_rock': '#8a8478',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'hill', y=3.0, depth=4.0, top=0.0, bottom=-3.0)
    z1 = periodic_profile(rng, 2.8, 1.0, waves=((2, 1.0), (3, 0.5), (5, 0.2)))
    ridge_slab(L, 'L0_far', 'hill_far', z1, y=3.0, outline=0.0)
    z2 = periodic_profile(rng, 1.3, 0.7, waves=((3, 1.0), (4, 0.5), (7, 0.15)))
    ridge_slab(L, 'L0_near', 'hill', z2, y=1.5, shade='hill_sh', shade_depth=0.8)


def culm(B, x, z0, z1, r, body, node, rng, y=0.0, lean=0.0):
    """A bamboo culm from z0 up to z1 at x: a six-sided tube with a darker node ring every 1.1-1.5 m."""
    B.rod(body, (x, y, z0), (x + lean, y, z1), r, segs=6)
    z = z0 + rng.uniform(0.3, 1.0)
    while z < z1 - 0.3:
        u = (z - z0) / (z1 - z0)
        B.rod(node, (x + lean * u, y, z - 0.035), (x + lean * u, y, z + 0.035), r * 1.18, segs=6)
        z += rng.uniform(1.1, 1.5)


def spray(B, x, y, z, s, roles, rng, side):
    """A spray of five narrow bamboo leaves fanning out from a node to one side and drooping."""
    for k in range(5):
        th = 0.12 + 0.2 * k + rng.uniform(-0.06, 0.06)
        ln = s * rng.uniform(0.55, 0.8)
        pts = [(0.0, 0.0), (ln * 0.45, -0.035 * s), (ln, 0.0), (ln * 0.45, 0.06 * s)]
        B.slab(rng.choice(roles), pts, 0.04, at=(x, y - 0.1, z), rot=(0, th if side > 0 else math.pi - th, 0))


def stand(L, rng, n, rmin, rmax, roles, node, leaf, floor_z, floor_role, floor2=None, ys=(0.5, 3.0), sprays=2, ink=1.0):
    plain(L, L + '_floor', floor_role, y=3.5, depth=3.0, top=floor_z, bottom=floor_z - 4.0)
    if floor2:
        B = Builder(L + '_moss', L)
        for k in range(14):
            x = (k + rng.uniform(0.2, 0.8)) * P / 14
            B.sphere(floor2, (x, 1.0, floor_z), rng.uniform(0.5, 0.8), scale=(1.8, 0.6, 0.4), subdiv=1)
        B.done()
    B = Builder(L + '_culms', L)
    xs = [(k + rng.uniform(0.15, 0.85)) * P / n for k in range(n)]
    top = 11.0
    for k, x in enumerate(xs):
        r = rng.uniform(rmin, rmax)
        y = rng.uniform(*ys)
        body = roles[k % len(roles)]
        lean = rng.uniform(-0.25, 0.25)
        for dx in wraps(x, r + abs(lean) + 1.2):
            culm(B, x + dx, floor_z - 0.3, top, r, body, node, random.Random(k * 7 + 1), y=y, lean=lean)
        for j in range(sprays):
            z = rng.uniform(max(floor_z + 4.0, 5.5), top - 0.3) if j else rng.uniform(floor_z + 3.0, top - 0.5)
            side = 1 if (j + k) % 2 else -1
            for dx in wraps(x, 1.6):
                spray(B, x + dx + lean * (z - floor_z) / (top - floor_z) + side * r, y, z, rng.uniform(1.2, 1.7), leaf, random.Random(k * 31 + j), side)
    ob = B.done(period=None)
    ob['outline'] = ink


def build_L1(rng):
    stand('L1', rng, 18, 0.12, 0.18, ('c1a', 'c1b'), 'c1n', ('c1leaf', 'c1leaf2'), -(330 - 270) / PX, 'c1floor', ys=(1.0, 3.5), sprays=1, ink=0.0)


def build_L2(rng):
    stand('L2', rng, 11, 0.2, 0.28, ('c2a', 'c2b', 'c2c'), 'c2n', ('c2leaf', 'c2leaf2'), -(350 - 270) / PX, 'c2floor', floor2='c2floor2', ys=(0.3, 2.0), sprays=2)


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='grass', stone_p=0.45, patch_p=0.3, cap_h=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
