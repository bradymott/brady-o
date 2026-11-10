# Nepal 12-1 "Suspension Bridges" (theme np_hills): original toon art for the terraced foothills under the high peaks.
#   L0  npPeaks    (base 250, f 0.01, #8a9ac8, blur): the great white wall of the Himalaya, faceted peaks with jagged
#       snow caps, the farthest ones unlined
#   L1  npTerraces (base 320, f 0.06, #7aa85a): green hills cut into rice terraces (stepped bands), small stone houses
#       with rust roofs, a few strings of prayer flags far away on the ridges (small, plain, respectful scenery)
#   L2  npRhodo    (base 350, f 0.14, #2e5a2e): rhododendron trees in red bloom over a dark green bank
#   ground npHill: a grass cap over brown hill soil with grey stones
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, peak, TAU

MODULE = 'np_hills'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 250, 'L1': 320, 'L2': 350}
SKY = ['#4a90d8', '#a8d4f4', '#f0f8ff']
PX = 28.1
FLAGS = ('flag_b', 'flag_w', 'flag_r', 'flag_g', 'flag_y')
PALETTE = {
    'rock_far': '#a8b4d8', 'rock': '#8a9ac8', 'rock2': '#7e8ebe', 'snow': '#f4f8ff', 'snow_far': '#e8eefa', 'base_far': '#9aa8d0',
    'ter': '#7aa85a', 'ter2': '#8ab866', 'ter3': '#6a9a4e', 'ter_edge': '#5a8a44', 'hill_plain': '#6a9a4e',
    'house': '#ece4d4', 'roof': '#9a4a32', 'door': '#3a2a1a', 'string': '#6a5a48',
    'flag_b': '#2a6ad8', 'flag_w': '#f4f4f4', 'flag_r': '#d8322a', 'flag_g': '#2aa84a', 'flag_y': '#f2c81a',
    'bank': '#2e5a2e', 'bank2': '#3a6a36', 'trunk': '#4a3428', 'leaf': '#2e5a2e', 'leaf2': '#3a6a3a', 'bloom': '#d8323a', 'bloom2': '#ff6a7a',
    'g_cap': '#5a9a3a', 'g_cap_hi': '#a8d86a', 'g_blade': '#6aaa44', 'g_dirt': '#7a6a5a', 'g_dirt2': '#6a5a4c', 'g_rock': '#9a9088',
}
K.use(MODULE, PALETTE, LAYERS)


def peaks(L, rng, n, hmin, hmax, rmin, rmax, role, snow, y, outline=1.0, snow_from=0.55, name='peaks', gap=(1.0, 1.4)):
    x = rng.uniform(0, 3.0)
    obs = []
    k = 0
    while x < P + 1.0:
        R, h = rng.uniform(rmin, rmax), rng.uniform(hmin, hmax)
        ob = peak(L, '%s_%d' % (name, k), x % P, y + rng.uniform(-0.3, 0.3), R, h, role if k % 2 or role + '2' not in PALETTE else role + '2', 7, rng, snow=snow, snow_from=snow_from)
        ob['outline'] = outline
        x += R * rng.uniform(*gap)
        k += 1


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'base_far', y=6.0, depth=3.0, top=0.0, bottom=-3.0)
    peaks(L, rng, 0, 4.5, 7.2, 3.6, 5.2, 'rock_far', 'snow_far', 4.0, outline=0.0, snow_from=0.45, name='far')
    peaks(L, rng, 0, 3.2, 5.6, 3.0, 4.4, 'rock', 'snow', 2.0, outline=1.0, snow_from=0.5, name='near')


def flag_line(B, x0, z0, x1, z1, y, rng):
    """A string of small square prayer flags sagging between two points (scenery, drawn small and plain)."""
    n = max(4, int(abs(x1 - x0) / 0.34))
    sag = 0.3
    prev = None
    for k in range(n + 1):
        u = k / n
        x = x0 + (x1 - x0) * u
        z = z0 + (z1 - z0) * u - sag * 4 * u * (1 - u)
        if prev:
            B.rod('string', (prev[0], y, prev[1]), (x, y, z), 0.012, segs=3)
        if 0 < k < n:
            B.box(FLAGS[k % 5], (x, y - 0.02, z - 0.12), (0.2, 0.02, 0.22), bevel=0.0)
        prev = (x, z)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'hill_plain', y=3.0, depth=3.0, top=0.0, bottom=-3.0)
    zf = periodic_profile(rng, 1.6, 0.9, waves=((2, 1.0), (3, 0.4), (5, 0.15)))
    # stepped terraces: a stack of ridge slabs, each a little lower and nearer, alternating greens
    for k in range(5):
        dz = -0.42 * k
        ob = ridge_slab(L, 'L1_ter%d' % k, ('ter', 'ter2', 'ter3')[k % 3], lambda x, dz=dz: zf(x) + dz, y=2.0 - 0.3 * k, depth=0.3, outline=0.5)
    H = Builder('L1_houses', L)
    F = Builder('L1_flags', L)
    for k in range(7):
        x = (k + rng.uniform(0.15, 0.85)) * P / 7
        z = zf(x) - 0.42 * rng.randrange(1, 4)
        for dx in wraps(x, 0.6):
            H.box('house', (x + dx, 0.2, z + 0.25), (0.62, 0.5, 0.5), bevel=0.02)
            H.slab('roof', [(-0.42, 0.0), (0.42, 0.0), (0.0, 0.3)], 0.6, at=(x + dx, -0.06, z + 0.48))
            H.box('door', (x + dx + 0.12, -0.06, z + 0.14), (0.12, 0.02, 0.22), bevel=0.0)
    for k in range(3):
        x = (k + rng.uniform(0.2, 0.6)) * P / 3
        for dx in wraps(x, 2.0):
            flag_line(F, x + dx, zf(x) + 0.4, x + dx + rng.uniform(1.6, 2.2), zf(x + 1.8) + 0.2, 1.5, rng)
    H.done(period=None)
    of = F.done(period=None)
    of['outline'] = 0


def rhodo(B, x, s, rng):
    B.rod('trunk', (x, 0.4, -0.3), (x + 0.1 * s, 0.4, 1.4 * s), 0.12 * s, segs=6, r2=0.08 * s)
    B.rod('trunk', (x + 0.05 * s, 0.4, 0.9 * s), (x + 0.6 * s, 0.4, 1.5 * s), 0.06 * s, segs=5)
    for k in range(9):
        a = rng.uniform(0, TAU)
        r = rng.uniform(0.0, 1.0) ** 0.6
        B.sphere(rng.choice(('leaf', 'leaf2')), (x + math.cos(a) * 1.0 * s * r, 0.1, 1.85 * s + math.sin(a) * 0.55 * s * r), rng.uniform(0.45, 0.65) * s, scale=(1.1, 0.7, 0.8), subdiv=2)
    for k in range(10):
        a = rng.uniform(0, TAU)
        r = rng.uniform(0.3, 1.0)
        B.sphere(rng.choice(('bloom', 'bloom', 'bloom2')), (x + math.cos(a) * 1.05 * s * r, -0.45, 1.85 * s + math.sin(a) * 0.55 * s * r), rng.uniform(0.13, 0.2) * s, subdiv=1)


def build_L2(rng):
    L = 'L2'
    plain(L, 'L2_plain', 'bank', y=2.0, depth=3.0, top=0.0, bottom=-3.0)
    B = Builder('L2_trees', L)
    x = rng.uniform(0.5, 2.0)
    while x < P - 1.0:
        s = rng.uniform(0.85, 1.2)
        for dx in wraps(x, 1.4 * s):
            rhodo(B, x + dx, s, random.Random(int(x * 10)))
        x += rng.uniform(3.2, 5.6)
    B.done(period=None)


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='grass', stone_p=0.55, patch_p=0.2, cap_h=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
