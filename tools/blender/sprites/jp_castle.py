# Japan 11-5 "Kappa Castle" (theme jp_castle): original toon art for the castle garden in cherry-blossom time.
#   L0  jpCastle (base 300, f 0.03, #8a8a90): a castle keep (a secular building) on its curved stone base, four
#       white tiers with small dark windows and dark flared roofs, one gable; long white garden walls with dark tile
#       copings either side and round pines; its golden roof fish are missing (the Baron took them)
#   L1  jpSakura (base 340, f 0.12, #ffc0d0): a row of cherry trees in bloom over a grass bank, petals on the grass
#   ground jpIshigaki: fitted grey castle-wall stones under a mossy cap
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, ridge_slab, periodic_profile, TAU

MODULE = 'jp_castle'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 340}
SKY = ['#e88aa0', '#f8c8c8', '#fff0e0']
PX = 28.1
PALETTE = {
    'bank': '#a8b8a0', 'stone': '#9a9aa0', 'stone2': '#8a8a92', 'wall': '#f4f0e8', 'wall_sh': '#e0dcd2', 'win': '#3a3a40',
    'roof': '#4a5662', 'roof_hi': '#5e6a76', 'ridge': '#2e363e', 'gwall': '#f0ece2', 'gcope': '#55606a', 'gbase': '#a8a4a0',
    'pine': '#4a7a5a', 'pine2': '#5a8a62', 'ptrunk': '#5a4436',
    'grass': '#9ac078', 'grass2': '#8ab46c', 'trunk': '#5a3a36', 'trunk2': '#4a3030',
    'bloom1': '#ffd0de', 'bloom2': '#ffb8cc', 'bloom3': '#ffa6c0', 'bloom4': '#ffe4ec', 'petal': '#ffc8d8',
    'g_cap': '#7a9a5a', 'g_cap_hi': '#a8c87a', 'g_blade': '#8ab45e', 'g_dirt': '#5a564e',
    'g_rock': '#a8a49a', 'g_rock2': '#9a968c', 'g_rock3': '#b4b0a6', 'g_rock4': '#8e8a80',
}
K.use(MODULE, PALETTE, LAYERS)


def keep(B, cx, s):
    """The keep: a curved stone base, four white tiers, flared dark roofs, one gable on the second roof."""
    bw, bh = 150 / PX * s, 60 / PX * s
    pts = []
    for i in range(9):
        u = i / 8
        pts.append((-bw + (bw - 110 / PX * s) * (1 - (1 - u) ** 2), bh * u))
    outline_pts = [(pts[0][0], 0.0), (-pts[0][0], 0.0)] + [(-x, z) for x, z in pts[1:]] + [(x, z) for x, z in reversed(pts[1:])]
    B.slab('stone', outline_pts, 4.0, at=(cx, -1.0, 0.0))
    for k in range(5):
        z = bh * (k + 0.5) / 5
        half = -pts[min(8, int((k + 0.5) / 5 * 8))][0]
        B.box('stone2', (cx, -1.04, z), (half * 2 - 0.2, 0.04, 0.05), bevel=0.0)
    tiers = [(96, 34), (76, 30), (56, 28), (36, 26)]
    z = bh
    for i, (hw, th) in enumerate(tiers):
        hw, th = hw / PX * s, th / PX * s
        B.box('wall', (cx, 0.0, z + th / 2), (hw * 2, 3.0, th), bevel=0.0)
        for k in range(-2, 3):
            B.box('win', (cx + k * hw * 0.38, -1.52, z + th * 0.5), (0.22 * s, 0.04, 0.3 * s), bevel=0.0)
        rw = hw + 22 / PX * s
        rz = z + th
        rh = 14 / PX * s
        roof = [(-rw - 0.28 * s, 0.14 * s), (-rw + 0.1, -0.02), (rw - 0.1, -0.02), (rw + 0.28 * s, 0.14 * s), (hw * 0.6, rh), (-hw * 0.6, rh)]
        B.slab('roof', roof, 3.6, at=(cx, -1.8, rz))
        B.box('roof_hi', (cx, -1.82, rz + 0.02), (rw * 2 - 0.2, 0.04, 0.08), bevel=0.0)
        if i == 1:
            B.slab('roof', [(-20 / PX * s, rh * 0.9), (20 / PX * s, rh * 0.9), (0.0, rh + 17 / PX * s)], 0.6, at=(cx, -1.9, rz))
            B.slab('wall', [(-12 / PX * s, rh * 0.95), (12 / PX * s, rh * 0.95), (0.0, rh + 10 / PX * s)], 0.1, at=(cx, -1.95, rz))
        z = rz + rh - 0.02
    B.box('ridge', (cx, -0.2, z + 0.06), (60 / PX * s, 2.0, 0.14 * s), bevel=0.0)
    return z


def garden_wall(B, x0, x1, h):
    B.box('gbase', ((x0 + x1) / 2, 0.6, 0.15), (x1 - x0, 0.8, 0.3), bevel=0.0)
    B.box('gwall', ((x0 + x1) / 2, 0.6, h / 2 + 0.15), (x1 - x0, 0.6, h), bevel=0.0)
    B.slab('gcope', [(x0 - 0.15, 0.0), (x1 + 0.15, 0.0), (x1, 0.22), (x0, 0.22)], 0.9, at=(0.0, 0.15, h + 0.15))


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'bank', y=3.0, depth=4.0, top=0.0, bottom=-3.0)
    cx = 0.62 * P
    B = Builder('L0_keep', L)
    keep(B, cx, 1.1)
    B.done()
    W = Builder('L0_walls', L)
    left, right = cx - 7.0, cx + 7.0
    garden_wall(W, right, P + left - 0.01, 1.0)
    for k in range(5):
        x = (right + 1.5 + k * (P - 14.0 - 3.0) / 4) % P
        W.rod('ptrunk', (x, 1.6, 0.8), (x, 1.6, 1.8), 0.08, segs=5)
        for j in range(3):
            W.sphere(rng.choice(('pine', 'pine2')), (x + (j - 1) * 0.35, 1.6, 1.7 + j * 0.25 + (0.15 if j == 1 else 0)), 0.5 - j * 0.1, scale=(1.4, 0.6, 0.55), subdiv=1)
    W.done()


def tree(B, x, s, rng):
    base = 0.0
    B.rod('trunk', (x, 0.4, base - 0.5), (x - 0.15 * s, 0.4, 1.1 * s), 0.17 * s, segs=6, r2=0.12 * s)
    B.rod('trunk2', (x - 0.12 * s, 0.4, 0.9 * s), (x + 1.2 * s, 0.4, 2.0 * s), 0.09 * s, segs=5, r2=0.05 * s)
    B.rod('trunk2', (x - 0.12 * s, 0.4, 1.0 * s), (x - 1.25 * s, 0.4, 2.2 * s), 0.09 * s, segs=5, r2=0.05 * s)
    B.rod('trunk', (x - 0.15 * s, 0.4, 1.1 * s), (x + 0.05 * s, 0.4, 2.3 * s), 0.1 * s, segs=5, r2=0.06 * s)
    for k in range(16):
        a = rng.uniform(0, TAU)
        r = rng.uniform(0.0, 1.0) ** 0.6
        bx = x + math.cos(a) * 1.6 * s * r
        bz = 2.5 * s + math.sin(a) * 0.8 * s * r
        B.sphere(rng.choice(('bloom1', 'bloom2', 'bloom3', 'bloom4')), (bx, rng.uniform(-0.2, 0.3), bz), rng.uniform(0.45, 0.7) * s, scale=(1.0, 0.7, 0.85), subdiv=2)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'grass', y=2.0, depth=4.0, top=0.0, bottom=-3.0)
    B = Builder('L1_trees', L)
    x = rng.uniform(0.5, 2.0)
    while x < P - 1.0:
        s = rng.uniform(0.85, 1.15)
        tree(B, x, s, rng)
        x += rng.uniform(4.6, 6.6)
    B.done()
    G = Builder('L1_petals', L)
    for k in range(40):
        G.sphere('petal', (rng.uniform(0, P), -0.6, rng.uniform(-0.4, -0.05)), 0.08, scale=(1.4, 0.4, 0.6), subdiv=1)
    og = G.done()
    og['outline'] = 0


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.24, rows=(1, 2), cols=(1, 2), gap=0.1, jitter=0.3, roles=('g_rock', 'g_rock2', 'g_rock3', 'g_rock4'), rounded=True, hi_h=0.07)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
