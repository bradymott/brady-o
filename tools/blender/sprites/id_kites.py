# Indonesia 9-2 "Kite Festival": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  idVolcanoes (base 232, f 0.02, blur, dyn idSkyKites): a pale volcano far away with a haze band (the giant
#       festival kites fly over it, code-drawn)
#   L1  idTerraces (base 300, f 0.09): rounded hills cut into stepped rice terraces, alternating greens, some steps
#       flooded silver with sky, little thatched farm pavilions on stilts and a palm on a ridge
#   L2  idPalms (base 352, f 0.26): coconut palms and banana plants in the near field over a dark green bank
#   ground: the engine's 'grass' style as a paddy bank: a green rice-blade cap over red-brown earth with stones
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, ridge_slab

MODULE = 'id_kites'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 232, 'L1': 300, 'L2': 352}
SKY = ['#2a8ee8', '#9adcff', '#f6fff0']
PALETTE = {
    'vol': '#9ab4d8', 'vol_sh': '#8aa6cc', 'haze': '#e0f6ec',
    't1': '#94cc7c', 't2': '#84c070', 't3': '#a2d488', 't_dk': '#72ac62', 'water': '#d8f2f4', 'water2': '#b8e4ec',
    'hill_far': '#a4ccb4', 'hut_post': '#8a6a4a', 'thatch': '#d4b47a', 'thatch_dk': '#b8986a',
    'trunk': '#8a7e62', 'palm': '#6aa660', 'palm2': '#5a9452',
    'n_trunk': '#5a5a32', 'n_palm': '#2e6a2e', 'n_palm2': '#255a28', 'banana': '#3a7a32', 'banana2': '#2e6a2a', 'n_bank': '#2a5a2a',
    # ground (engine 'grass' style as a paddy bank)
    'g_cap': '#4aa83a', 'g_cap_hi': '#8ad85a', 'g_blade': '#5ab83a', 'g_dirt': '#8a5a32', 'g_dirt2': '#6e4424', 'g_rock': '#9a7a52',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def build_L0(rng):
    L = 'L0'
    def zf(x):
        best = -0.5
        for x0, hw, h in ((16.0, 10.0, 4.2), (5.0, 6.0, 1.4)):
            for dx in (-P, 0, P):
                u = abs(x - x0 - dx) / hw
                if u < 1:
                    best = max(best, h * (1 - u) ** 1.5 - (0.1 if u < 0.03 else 0))
        return best
    ridge_slab(L, 'L0_vol', 'vol', zf, y=2.0, bottom=-2.0, shade='vol_sh', shade_depth=0.6, outline=0.5)
    H = Builder('L0_haze', L)
    H.box('haze', (P / 2, 1.5, -0.05), (P + 2.0, 0.2, 0.8), bevel=0.0)
    H.done(period=None)['outline'] = 0


def terraced_hill(B, x, y, hw, h, steps, rng, hut=None):
    """A soft rounded hill (one silhouette) with its rice terraces as curved bands following the slope: alternating
    green strips and thin silver water lines, all unlinked from the outline so no step reads as a ledge."""
    n = 28
    pts = [(x - hw - 0.05, -0.3), (x + hw + 0.05, -0.3)]
    for i in range(n, -1, -1):
        u = -1 + 2 * i / n
        pts.append((x + u * hw, h * (1 - abs(u) ** 1.8)))
    B.slab('t2', pts, 0.6, at=(0, y, 0))
    S = Builder(B.name + '_bands%d' % int(x * 10), B.layer)
    for k in range(1, steps):
        zk = h * k / steps
        half = hw * (1 - zk / h) ** (1 / 1.8)
        m = 14
        prev = None
        for j in range(m + 1):
            u = -1 + 2 * j / m
            xx = x + u * half * 0.97
            zz = zk - 0.2 * h / steps * (1 - u * u) - 0.02
            if prev:
                role = ('t1', 't3', 't_dk')[k % 3] if k % 3 else 't_dk'
                S.rod(role, (prev[0], y - 0.05, prev[1]), (xx, y - 0.05, zz), 0.075, segs=4)
                if k % 2 == 0 and rng.random() < 0.6:
                    S.rod('water', (prev[0], y - 0.12, prev[1] - 0.07), (xx, y - 0.12, zz - 0.07), 0.03, segs=4)
            prev = (xx, zz)
    S.done()['outline'] = 0
    return h


def pavilion(B, x, y, z, s):
    """A little open farm pavilion (bale) on four posts with a steep thatched roof."""
    for dx in (-0.3, 0.3):
        B.rod('hut_post', (x + dx * s, y, z), (x + dx * s, y, z + 0.6 * s), 0.04)
    B.box('hut_post', (x, y, z + 0.3 * s), (0.7 * s, 0.3, 0.06), bevel=0.0)
    B.slab('thatch', [(x - 0.55 * s, z + 0.55 * s), (x + 0.55 * s, z + 0.55 * s), (x, z + 1.05 * s)], 0.5, at=(0, y - 0.25, 0))
    B.box('thatch_dk', (x, y - 0.27, z + 0.56 * s), (1.1 * s, 0.04, 0.06), bevel=0.0)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 't2', y=3.0, depth=2.0, top=-0.2, bottom=-3.0)
    # a far row of soft hills behind the terraces
    def zb(x):
        return 1.6 + 0.9 * math.sin(TAU * 2 * x / P + 0.6) + 0.5 * math.sin(TAU * 3 * x / P + 1.7)
    ridge_slab(L, 'L1_far', 'hill_far', zb, y=4.0, bottom=-2.0, outline=0.5)
    B = Builder('L1_terraces', L)
    hills = [(5.5, 5.5, 3.6, 9), (17.5, 6.5, 4.2, 10), (29.5, 5.5, 3.4, 8)]
    for i, (x, hw, h, steps) in enumerate(hills):
        top = terraced_hill(B, x, 1.5 - 0.4 * (i % 2), hw, h, steps, rng)
        pavilion(B, x - hw * 0.45, 0.6, h * (1 - 0.45 ** 1.8) - 0.15, 0.75)
        K.palm(B, x + hw * 0.18, 1.0, top - 0.1, 1.6, 0.2, 'trunk', 'palm', 'palm2', fronds=7, size=0.5)
    # small hills in the gaps, in front
    for x, hw, h, steps in ((11.5, 3.0, 1.6, 4), (23.5, 3.2, 1.8, 5), (35.0, 2.6, 1.3, 4)):
        terraced_hill(B, x, 0.3, hw, h, steps, rng)
    B.done()['outline'] = 0.6


def banana_plant(B, x, y, z, s, rng):
    B.rod('n_trunk', (x, y, z), (x, y, z + 1.2 * s), 0.12 * s, segs=6, r2=0.09 * s)
    for k in range(6):
        a = -math.pi * 0.05 - k * math.pi * 0.18
        B.sphere('banana' if k % 2 else 'banana2', (x + math.cos(a) * 0.9 * s, y - 0.03 * k, z + 1.3 * s + math.sin(-a) * 0.5 * s),
                 0.9 * s, scale=(1.0, 0.18, 0.3), rot=(0, a * 0.6 - 0.3 * (1 if math.cos(a) > 0 else -1), 0), subdiv=1)


def build_L2(rng):
    L = 'L2'
    G = Builder('L2_bank', L)
    G.box('n_bank', (P / 2, 1.0, -1.5), (P + 2.0, 1.0, 3.2), bevel=0.0)
    for k in range(int(P / 1.2)):
        G.sphere('n_bank', ((k + 0.5) * P / int(P / 1.2), 0.9, 0.0), 0.7, scale=(1.0, 0.5, 0.35), subdiv=1)
    G.done()
    T = Builder('L2_trees', L)
    x = 0.8
    while x < P:
        if rng.random() < 0.6:
            K.palm(T, x, 0.4, -0.1, rng.uniform(3.0, 4.6), rng.uniform(-1.0, 1.0), 'n_trunk', 'n_palm', 'n_palm2', fronds=8, size=0.85)
        else:
            banana_plant(T, x, 0.2, -0.1, rng.uniform(0.9, 1.25), rng)
        x += rng.uniform(2.2, 4.0)
    T.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='grass', stone_p=0.4, patch_p=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
