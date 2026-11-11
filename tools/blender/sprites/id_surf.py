# Indonesia 9-1 "Kuta Surf Break": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  idVolcanoes (base 236, f 0.02, blur): two pale blue volcano silhouettes far across the bay, soft lighter
#       ridges down their flanks and a haze band at their feet (no ink on the haze)
#   L1  idCoast (base 240, f 0.035): the thin golden far shore with rows of little coconut palms and bright
#       outrigger canoes pulled up on the sand
#   L2  idOcean (base 244, f 0.06, dyn idBreakers): the open sea from the horizon down, deeper blue toward the
#       viewer, rows of pale swell lines growing nearer (no ink: water must never read as a ledge)
#   ground: the engine's 'sand' style: a rippled pale sand cap over packed sand with shells and pebbles
# Helpers: id_kit.py (P = 36.4 m period, ground line z = 0 at row BASES[layer]).
import math, random
import id_kit as K
from id_kit import P, Builder, plain, ridge_slab, periodic_profile

MODULE = 'id_surf'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 236, 'L1': 240, 'L2': 244}
SKY = ['#1a86e8', '#78d4ff', '#fff2d0']
PALETTE = {
    'vol': '#86a4d0', 'vol_sh': '#7894c4', 'vol_far': '#a0bade', 'vol_ridge': '#a4bce0', 'haze': '#d0e8f6',
    'sand': '#ecd090', 'sand_hi': '#fbe8b4', 'trunk': '#7a6a4a', 'palm': '#3a8a4a', 'palm2': '#2e7440',
    'hull_a': '#e8323a', 'hull_b': '#ffd23a', 'hull_c': '#2a6ad8', 'hull_w': '#fff8e8', 'pole': '#6a5a3a', 'sail': '#ff7a3a',
    'sea': '#3ab4d6', 'sea2': '#2aa0cc', 'sea3': '#1c88bc', 'foam': '#e8fcff', 'swell': '#8ad8ec',
    # ground (engine 'sand' style)
    'g_cap': '#f6dfa4', 'g_cap_hi': '#fff8dc', 'g_dirt': '#e6c482', 'g_dirt2': '#d4ae6a', 'g_rock': '#d8b070',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def volcano_profile(peaks):
    """z(x): a sum of volcano bumps (x0, half-width, height, crater) periodic over P."""
    def z(x):
        best = -0.6
        for x0, hw, h, cr in peaks:
            for dx in (-P, 0, P):
                u = abs(x - x0 - dx) / hw
                if u < 1:
                    v = h * (1 - u) ** 1.55
                    if u < cr:
                        v = h * (1 - cr) ** 1.55 - 0.12 * (1 - u / cr)      # a little crater notch at the summit
                    best = max(best, v)
        return best
    return z


def build_L0(rng):
    L = 'L0'
    zf = volcano_profile([(10.5, 11.0, 4.6, 0.04), (27.0, 8.0, 2.4, 0.05)])
    ridge_slab(L, 'L0_vol', 'vol', zf, y=2.0, bottom=-2.0, shade='vol_sh', shade_depth=0.6, outline=0.6)
    z2 = volcano_profile([(33.5, 6.0, 1.3, 0.0), (19.0, 4.0, 0.9, 0.0)])
    ridge_slab(L, 'L0_far', 'vol_far', z2, y=3.5, bottom=-2.0, outline=0.4)
    R = Builder('L0_ridges', L)
    for x0, hw, h in ((10.5, 11.0, 4.6), (27.0, 8.0, 2.4)):
        for k in (-3, -2, -1, 1, 2, 3):
            pts = []
            for j in range(9):
                u = j / 8
                x = x0 + k * 0.25 + k * u * hw * 0.32
                pts.append((x, zf(x) - 0.08 - u * 0.2))
            for (xa, za), (xb, zb) in zip(pts, pts[1:]):
                R.rod('vol_ridge', (xa, 1.9, za), (xb, 1.9, zb), 0.05, segs=4)
    R.done(period=None)['outline'] = 0
    H = Builder('L0_haze', L)
    H.box('haze', (P / 2, 1.5, -0.1), (P + 2.0, 0.2, 0.7), bevel=0.0)
    H.done(period=None)['outline'] = 0


def jukung(B, x, z, s, hull, rng):
    """A small outrigger canoe (jukung) on the beach: a bright hull with a pointed prow, two curved booms, floats."""
    B.sphere(hull, (x, 0.0, z + 0.12 * s), 0.55 * s, scale=(1.0, 0.25, 0.22), subdiv=2)
    B.box('hull_w', (x, -0.02, z + 0.2 * s), (1.0 * s, 0.1, 0.05 * s), bevel=0.0)
    B.rod('pole', (x - 0.25 * s, -0.1, z + 0.22 * s), (x - 0.25 * s, -0.5, z + 0.32 * s), 0.025)
    B.rod('pole', (x + 0.25 * s, -0.1, z + 0.22 * s), (x + 0.25 * s, -0.5, z + 0.32 * s), 0.025)
    B.sphere('hull_w', (x, -0.5, z + 0.1 * s), 0.45 * s, scale=(1.0, 0.12, 0.1), subdiv=1)
    if rng.random() < 0.5:
        B.rod('pole', (x + 0.05, 0.0, z + 0.2 * s), (x + 0.1, 0.0, z + 1.1 * s), 0.025)
        B.slab('sail', [(x + 0.1, z + 1.08 * s), (x - 0.45 * s, z + 0.3 * s), (x + 0.12, z + 0.32 * s)], 0.03, at=(0, -0.03, 0))


def build_L1(rng):
    L = 'L1'
    S = Builder('L1_sand', L)
    S.box('sand', (P / 2, 1.0, -0.45), (P + 2.0, 2.0, 1.1), bevel=0.0)
    S.box('sand_hi', (P / 2, -0.02, 0.06), (P + 2.0, 0.1, 0.06), bevel=0.0)
    S.done(period=None)
    Pm = Builder('L1_palms', L)
    x = 0.4
    while x < P:
        h = rng.uniform(0.95, 1.8)
        K.palm(Pm, x, 0.6 + rng.uniform(0, 0.6), 0.0, h, rng.uniform(-0.3, 0.35), 'trunk', 'palm', 'palm2', fronds=7, size=0.42)
        x += rng.uniform(0.7, 1.6)
    Pm.done()
    C = Builder('L1_canoes', L)
    x = 3.0
    while x < P - 1.5:
        jukung(C, x, -0.02, rng.uniform(0.75, 0.95), rng.choice(('hull_a', 'hull_b', 'hull_c')), rng)
        x += rng.uniform(4.0, 7.5)
    C.done()


def build_L2(rng):
    L = 'L2'
    W = Builder('L2_sea', L)
    W.box('sea', (P / 2, 1.0, -0.8), (P + 2.0, 1.0, 1.6), bevel=0.0)
    W.box('sea2', (P / 2, 1.05, -3.0), (P + 2.0, 1.0, 2.8), bevel=0.0)
    W.box('sea3', (P / 2, 1.1, -9.0), (P + 2.0, 1.0, 9.2), bevel=0.0)
    W.box('foam', (P / 2, 0.4, -0.03), (P + 2.0, 0.1, 0.07), bevel=0.0)
    W.done(period=None)['outline'] = 0
    Sw = Builder('L2_swells', L)
    for r in range(9):
        z = -0.25 - r * r * 0.11 - r * 0.15
        n = int(P / (1.6 + r * 0.45))
        for k in range(n):
            x = (k + 0.5) * P / n + ((r * 37) % 7) * 0.2 + rng.uniform(-0.3, 0.3)
            w = 0.45 + r * 0.16
            Sw.sphere('swell' if r < 5 else 'foam', (x % P, 0.2, z), w, scale=(1.0, 0.1, 0.06 + r * 0.005), subdiv=1)
    Sw.done()
    for o in K.COLL[L].objects:
        o['outline'] = 0


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='ripples', stone_p=0.3, patch_p=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
