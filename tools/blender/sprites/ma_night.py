# Morocco 5-4 "Jemaa el-Fnaa Nights": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  maMedina (base 320, f 0.08, minaret): the medina rooftops after dark, plum walls with a few warm lit
#       windows, rooftop terraces, date palms, and the minaret far off as a plain silhouette (no detail)
#   L1  maMedina (base 355, f 0.22): the night market: a row of food stalls under dark striped canopies, bare
#       bulbs and brass lanterns glowing, tagines and soup pots on the counters, juice carts piled with oranges, a
#       wire of lanterns across, pale grill smoke puffs
#   ground: the souk floor (engine 'grass' style), packed earth in its night colours
# Glowing parts use materials whose name contains 'glow' (rendered unlit). Helpers: ma_kit.py.
import math, random
import ma_kit as K
from ma_kit import P, Builder, plain, hs_arch, lantern, minaret, pot, _split

MODULE = 'ma_night'
LAYERS = ['L0', 'L1']
BASES = {'L0': 320, 'L1': 355}
SKY = ['#0e0a24', '#2a1a40', '#6a3a4a']
PALETTE = {
    # L0: the medina at night
    'wall': '#4a3448', 'wall2': '#42304a', 'wall3': '#523a50', 'parapet': '#5e4458', 'door': '#241828',
    'win_glow': '#ffc870', 'win2_glow': '#ff9a4a', 'win_dark': '#2a1e32', 'minaret': '#3e2c46', 'minaret_band': '#2a5a5a',
    'minaret_gold': '#a8883a', 'palm': '#2a3a34', 'palm2': '#22302c', 'trunk': '#3a2c2c', 'plain1': '#3a2a3a',
    # L1: the market
    'stall': '#3a2830', 'stall2': '#2e2028', 'counter': '#5a3a2a', 'counter_top': '#7a5038', 'cloth_a': '#7a2a32', 'cloth_b': '#c8b8a0',
    'cloth_c': '#2a4a5a', 'pole': '#4a3428', 'brass': '#b08a3a', 'pane_glow': '#ffd890', 'bulb_glow': '#fff0b0', 'wire': '#1e1418',
    'ember_glow': '#ff7a2a', 'grill': '#2a2228', 'tagine': '#a8502e', 'tagine_lid': '#c06438', 'soup': '#7a6a5a', 'potm': '#6a6a72',
    'cart': '#6a4a8a', 'cart2': '#4a3466', 'wheel': '#2a1e2a', 'orange': '#c8742a', 'orange_dk': '#a85c22', 'leaf': '#3a7a3a',
    'smoke': '#8a7a98', 'smoke2': '#a898b4', 'plain2': '#2a1e2a',
    # ground (the souk floor's night colours)
    'g_cap': '#b88a68', 'g_cap_hi': '#d8aa84', 'g_dirt': '#9a6448', 'g_dirt2': '#7a4a36', 'g_rock': '#aa7458',
}
K.use(MODULE, PALETTE, LAYERS)


def night_house(B, x0, x1, y, h, role, rng, lit=0.45):
    w, xc = x1 - x0, (x0 + x1) / 2
    B.box(role, (xc, y, h / 2 - 0.1), (w - 0.06, 2.4, h + 0.2), bevel=0.0)
    B.box('parapet', (xc, y - 0.04, h + 0.1), (w - 0.06, 2.5, 0.22), bevel=0.0)
    nw = 1 if w < 2.6 else 2
    for k in range(nw):
        wx = x0 + w * (k + 1) / (nw + 1) + rng.uniform(-0.15, 0.15)
        wz = rng.uniform(1.4, max(1.5, h - 1.0))
        hs_arch(B, 'win_glow' if rng.random() < lit else ('win2_glow' if rng.random() < 0.25 else 'win_dark'), (wx, y - 1.24, wz), 0.42, 0.62, 0.06)


def palm(B, x, y, z, h, rng, roles=('palm', 'palm2'), trunk='trunk'):
    lean = rng.uniform(-0.3, 0.3)
    top = (x + lean, y, z + h)
    B.rod(trunk, (x, y, z), top, 0.12, segs=6, r2=0.08)
    for k in range(7):
        a = -math.pi + k * math.pi / 6
        B.sphere(roles[k % 2], (top[0] + math.cos(a) * 0.65, y - 0.05, top[2] + math.sin(a) * 0.34 + 0.05), 0.45,
                 scale=(1.5, 0.35, 0.3), rot=(0, -a * 0.6, 0), subdiv=1)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'plain1', y=3.0, depth=4.0, top=0.0, bottom=-3.0)
    B = Builder('L0_back', L)
    edges = _split(0, P, 12, rng, jitter=0.35)
    for a, b in zip(edges, edges[1:]):
        night_house(B, a, b, 3.6, rng.uniform(4.0, 6.2), rng.choice(('wall3', 'wall', 'wall3')), rng, lit=0.3)
    B.done(period=None)
    M = Builder('L0_minaret', L)
    minaret(M, P * 700 / 1024, 2.4, 0.0, 'minaret', 'minaret_band', 'minaret_gold')
    M.done()
    T = Builder('L0_palms', L)
    for x in (5.0, 6.2, 16.0, 29.5, 31.0):
        palm(T, x + rng.uniform(-0.4, 0.4), 1.8, 2.0, rng.uniform(4.0, 5.2), rng)
    T.done()
    F = Builder('L0_front', L)
    edges = _split(0, P, 10, rng, jitter=0.4)
    for a, b in zip(edges, edges[1:]):
        night_house(F, a, b, 1.0, rng.uniform(2.4, 4.0), rng.choice(('wall', 'wall2')), rng, lit=0.5)
    F.done(period=None)


def canopy(B, x, z, w, roles, depth=1.4, tilt=0.35):
    """A tent canopy over a stall: striped cloth sloping toward the player, a scalloped valance, two poles."""
    n = max(3, int(w / 0.5))
    c, s = math.cos(tilt), math.sin(tilt)
    for k in range(n):
        B.box(roles[k % len(roles)], (x - w / 2 + (k + 0.5) * w / n, 0.4 - depth / 2 * c, z - depth / 2 * s), (w / n + 0.012, depth, 0.08), bevel=0.0, rot=(tilt, 0, 0))
    fy, fz = 0.4 - depth * c, z - depth * s
    m = int(w / 0.32)
    for k in range(m):
        B.sphere(roles[(k + 1) % len(roles)], (x - w / 2 + (k + 0.5) * w / m, fy, fz - 0.06), 0.16, scale=(1.0, 0.4, 0.8), subdiv=1)
    for sx in (-w / 2 + 0.12, w / 2 - 0.12):
        B.rod('pole', (x + sx, fy + 0.05, 0.0), (x + sx, fy + 0.05, fz + 0.02), 0.05, segs=5)
    return fy, fz


def food_stall(B, x, w, rng):
    fy, fz = canopy(B, x, rng.uniform(2.9, 3.2), w, rng.choice((('cloth_a', 'cloth_b'), ('cloth_c', 'cloth_b'), ('cloth_a', 'cloth_c'))))
    # back wall of the stall and the counter
    B.box('stall', (x, 0.9, 1.4), (w - 0.1, 0.3, 2.8), bevel=0.0)
    B.box('counter', (x, -0.5, 0.45), (w * 0.86, 0.9, 0.9), bevel=0.0)
    B.box('counter_top', (x, -0.5, 0.94), (w * 0.9, 1.0, 0.1), bevel=0.0)
    # a bare bulb under the canopy
    B.rod('wire', (x, fy + 0.6, fz + 0.5), (x, fy + 0.6, fz - 0.2), 0.015, segs=4)
    B.sphere('bulb_glow', (x, fy + 0.6, fz - 0.32), 0.14, subdiv=2)
    # wares: a grill with embers and smoke, tagines, a soup pot
    kind = rng.random()
    if kind < 0.4:
        B.box('grill', (x - w * 0.15, -0.6, 1.08), (w * 0.4, 0.5, 0.18), bevel=0.0)
        B.box('ember_glow', (x - w * 0.15, -0.86, 1.12), (w * 0.36, 0.04, 0.08), bevel=0.0)
        for k in range(3):
            B.sphere('smoke' if k % 2 else 'smoke2', (x - w * 0.15 + (k - 1) * 0.25, -0.6, 1.5 + k * 0.45), 0.28 + k * 0.08, scale=(1.2, 0.5, 0.9), subdiv=1)
        pot(B, x + w * 0.25, -0.6, 1.0, 0.55, 'tagine', 1)
    elif kind < 0.75:
        for k in range(3):
            pot(B, x - w * 0.28 + k * w * 0.28, -0.6, 1.0, rng.uniform(0.5, 0.62), 'tagine_lid' if k % 2 else 'tagine', 1)
    else:
        B.lathe('potm', [(0.4, 0.0), (0.46, 0.3), (0.44, 0.55), (0.0, 0.56)], 10, at=(x - w * 0.15, -0.6, 1.0), cap_bottom=True)
        B.lathe('soup', [(0.4, 0.0), (0.0, 0.02)], 10, at=(x - w * 0.15, -0.6, 1.56))
        for k in range(2):
            B.sphere('smoke2', (x - w * 0.15 + k * 0.2, -0.6, 1.95 + k * 0.4), 0.26 + k * 0.06, scale=(1.2, 0.5, 0.9), subdiv=1)
        pot(B, x + w * 0.22, -0.6, 1.0, 0.5, 'tagine', 1)


def juice_cart(B, x, rng):
    """A juice cart: a painted box on two wheels with a pyramid of oranges and a bright bulb."""
    B.box('cart', (x, -0.4, 0.95), (2.2, 1.1, 0.9), bevel=0.0)
    B.box('cart2', (x, -0.98, 0.95), (2.0, 0.04, 0.5), bevel=0.0)
    for sx in (-0.7, 0.7):
        B.lathe('wheel', [(0.38, -0.05), (0.38, 0.05)], 12, at=(x + sx, -1.02, 0.42), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
    rows = [5, 4, 3, 2, 1]
    for r, n in enumerate(rows):
        for k in range(n):
            B.sphere('orange' if (k + r) % 3 else 'orange_dk', (x - (n - 1) * 0.17 + k * 0.34, -0.55, 1.55 + r * 0.29), 0.17, subdiv=2)
    B.sphere('leaf', (x + 0.06, -0.55, 1.55 + 4 * 0.29 + 0.16), 0.08, scale=(1.6, 0.6, 0.6), subdiv=1)
    B.rod('pole', (x + 1.0, -0.4, 1.4), (x + 1.0, -0.4, 3.0), 0.04, segs=4)
    B.sphere('bulb_glow', (x + 1.0, -0.6, 2.8), 0.14, subdiv=2)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'plain2', y=2.0, depth=5.0, top=0.02, bottom=-3.0)
    # the dark walls of the square's far side
    W = Builder('L1_walls', L)
    edges = _split(0, P, 7, rng, jitter=0.3)
    for a, b in zip(edges, edges[1:]):
        h = rng.uniform(3.6, 5.0)
        W.box(rng.choice(('stall', 'stall2')), ((a + b) / 2, 2.0, h / 2 - 0.1), (b - a - 0.05, 1.6, h + 0.2), bevel=0.0)
        if rng.random() < 0.7:
            hs_arch(W, 'win_glow' if rng.random() < 0.5 else 'win_dark', ((a + b) / 2 + rng.uniform(-0.6, 0.6), 1.15, rng.uniform(2.6, 3.0)), 0.5, 0.75, 0.06)
    W.done(period=None)
    S = Builder('L1_stalls', L)
    xs = [3.0, 10.0, 17.5, 25.0, 32.0]
    for i, x in enumerate(xs):
        x += rng.uniform(-0.6, 0.6)
        if i in (1, 3):
            juice_cart(S, x, rng)
        else:
            food_stall(S, x, rng.uniform(3.2, 3.9), rng)
    S.done()
    # wires of lanterns across the square
    Lw = Builder('L1_lanterns', L)
    for i in range(4):
        x0 = (i + 0.5) * P / 4 + rng.uniform(-0.6, 0.6)
        z = rng.uniform(4.4, 5.0)
        Lw.rod('wire', (x0 - 3.2, 0.2, z + 0.1), (x0 + 3.2, 0.2, z + 0.1), 0.02, segs=4)
        for k in range(4):
            lantern(Lw, x0 - 2.4 + k * 1.6, 0.2, z - 0.1 - 0.12 * (k % 2), rng.uniform(0.5, 0.62), 'brass', 'pane_glow', wire='wire')
    Lw.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='nubs', stone_p=0.5, patch_p=0.25)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
