# Mozambique 4-6 "Buried Dhow" (theme mz_areia): under the dunes, around the hull of an old dhow, as a Fiesta Toon
# diorama.
#   L0  mzSandStrata (base 300, #c89a5a): the whole strip is packed sand in soft wavy strata (no ink, paler toward
#       the top where the light comes down), with the buried dhow showing through: curved hull ribs, a run of planks,
#       a pottery jar or two, a sunken anchor, shells and pebbles in the layers. Nothing level enough to read as a ledge.
#   ground: damp packed sand (grass style: a pale cap with ripples over darker sand, shells and pebbles)
# Helpers: ma_kit.py.
import math, random
import ma_kit as K
from ma_kit import P, Builder

MODULE = 'mz_areia'
LAYERS = ['L0']
BASES = {'L0': 300}
SKY = ['#4a2a14', '#8a5a2a', '#e8b878']
PALETTE = {
    'sand_a': '#c89a5a', 'sand_b': '#bc8e50', 'sand_c': '#d4a866', 'sand_d': '#b08248', 'sand_lit': '#e0bc7c', 'sand_dk': '#a07440',
    'rib': '#6a4220', 'rib_dk': '#52321a', 'plank': '#7a4e28', 'plank2': '#6a4222', 'jar': '#b8643a', 'jar_dk': '#8a4426',
    'iron': '#4a4448', 'shell': '#f4e8d8', 'shell2': '#e8c8b8', 'pebble': '#9a8a7a',
    'g_cap': '#e2c48a', 'g_cap_hi': '#f4dca8', 'g_dirt': '#b88c50', 'g_dirt2': '#a47a44', 'g_rock': '#d8c8a8',
}
K.use(MODULE, PALETTE, LAYERS)
TOP, BOT = 300 / 28.1 + 0.6, -(444 - 300) / 28.1 - 1.0


def build_L0(rng):
    L = 'L0'
    Builder('L0_back', L).box('sand_a', (P / 2, 4.0, (TOP + BOT) / 2), (P + 2.0, 1.0, TOP - BOT), bevel=0.0).done(period=None)['outline'] = 0
    # wavy strata: overlapping soft bands, each a periodic slab, paler upward
    S = Builder('L0_strata', L)
    n = 9
    for r in range(n):
        u = r / (n - 1)
        zc = TOP - 1.0 - u * (TOP - BOT - 1.5)
        role = ('sand_lit', 'sand_c', 'sand_c', 'sand_a', 'sand_b', 'sand_a', 'sand_b', 'sand_d', 'sand_dk')[r]
        ph, amp, k = rng.uniform(0, math.tau), rng.uniform(0.25, 0.6), rng.choice((2, 3, 4))
        m = 60
        xs = [-1.0 + (P + 2.0) * i / m for i in range(m + 1)]
        top = [(x, zc + amp * math.sin(math.tau * k * x / P + ph)) for x in xs]
        S.slab(role, [(xs[0], zc - 2.6), (xs[-1], zc - 2.6)] + top[::-1], 0.05, at=(0, 3.5 - 0.02 * r, 0))
    S.done(period=None)['outline'] = 0
    # the buried dhow, tilted in the sand: ribs and hull bands that follow the hull's banana curve (no level edges)
    D = Builder('L0_dhow', L)
    hx, hz, tilt = P * 0.35, 1.0, math.radians(11)
    def hullz(x, j):
        u = (x - hx) / 6.5
        return hz + 0.55 * j + 1.6 * u * u + math.tan(tilt) * (x - hx)
    for j in range(4):
        xs = [hx - 6.5 + 13.0 * i / 16 for i in range(17)]
        pts = [(x, hullz(x, j)) for x in xs]
        for (xa, za), (xb, zb) in zip(pts, pts[1:]):
            D.rod('plank' if j % 2 else 'plank2', (xa, 3.1, za), (xb, 3.1, zb), 0.2, segs=6)
    for k in range(6):
        x0 = hx - 5.5 + k * 2.2
        z0 = hullz(x0, 0) - 0.2
        pts = [(x0 + 0.5 * math.sin(a), z0 + 3.0 * (1 - math.cos(a))) for a in [i * math.pi / 2 / 8 for i in range(9)]]
        for (xa, za), (xb, zb) in zip(pts, pts[1:]):
            D.rod('rib' if k % 2 else 'rib_dk', (xa, 3.0, za), (xb, 3.0, zb), 0.15, segs=6)
    D.done(period=None)['outline'] = 0.6
    # things in the sand: jars, an anchor, shells and pebbles
    J = Builder('L0_finds', L)
    for k, (x, z) in enumerate(((P * 0.72, 4.5), (P * 0.88, -1.8), (P * 0.12, -2.6))):
        J.lathe('jar' if k % 2 == 0 else 'jar_dk', [(0.25, 0.0), (0.5, 0.4), (0.48, 0.9), (0.2, 1.2), (0.22, 1.4)], 12, at=(x, 3.3, z), cap_top=True, cap_bottom=True, rot=(0, rng.uniform(-0.9, 0.9), 0), smooth=True)
    ax, az = P * 0.62, -1.0
    J.rod('iron', (ax, 3.3, az), (ax + 0.4, 3.3, az + 2.2), 0.1, segs=6)
    arc = [(ax + 0.85 * math.sin(a), az + 0.6 - 0.6 * math.cos(a)) for a in [-1.3 + 2.6 * i / 8 for i in range(9)]]
    for (xa, za), (xb, zb) in zip(arc, arc[1:]):
        J.rod('iron', (xa, 3.3, za), (xb, 3.3, zb), 0.09, segs=6)
    for sx in (-1, 1):
        J.lathe('iron', [(0.13, 0.0), (0.0, 0.25)], 6, at=(arc[0 if sx < 0 else -1][0], 3.3, arc[0 if sx < 0 else -1][1]), rot=(0, sx * 0.6, 0), cap_bottom=True)
    J.lathe('iron', [(0.22, 0.0), (0.22, 0.07)], 10, at=(ax + 0.45, 3.3, az + 2.4), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
    for k in range(26):
        x, z = rng.uniform(0, P), rng.uniform(BOT + 0.5, TOP - 1.0)
        if rng.random() < 0.5:
            J.sphere(rng.choice(('shell', 'shell2')), (x, 3.35, z), rng.uniform(0.1, 0.18), scale=(1.3, 0.4, 0.9), subdiv=1)
        else:
            J.sphere('pebble', (x, 3.35, z), rng.uniform(0.08, 0.15), scale=(1.2, 0.5, 0.9), subdiv=1)
    J.done(period=None)['outline'] = 0.5


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='ripples', stone_p=0.25, patch_p=0.35, cap_h=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
