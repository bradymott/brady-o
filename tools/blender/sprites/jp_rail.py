# Japan 11-2 "Bullet Train" (theme jp_rail): original toon art for the ride on the train roof.
#   L0  jpFuji   (base 300, f 0.01, #6a7aa8): the great snow-capped volcano on the horizon (one per period), a faint
#       far range at its feet and an unlined ribbon of cloud across its waist
#   L1  jpFields (base 326, f 0.12, #8ab85a): rice paddies in bands, white farmhouses with dark timber and blue-grey
#       tiled roofs, round orchard trees
#   L2  jpPoles  (base 360, f 0.7, #4a4a58): the overhead-line masts flashing past beside the track, wire unlined
#   ground jpStation: grey platform slabs under a yellow tactile strip
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU, T, CELL_MARGIN

MODULE = 'jp_rail'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 300, 'L1': 326, 'L2': 360}
SKY = ['#4a8ad8', '#a8d0f0', '#eef6fc']
PX = 28.1
PALETTE = {
    'fuji': '#7a8ab8', 'fuji_sh': '#6c7cac', 'snow': '#f8fbff', 'snow_sh': '#dce6f4', 'range': '#9aaccc', 'cloud': '#ffffff',
    'field': '#8ab85a', 'field2': '#9ac466', 'field3': '#7aaa50', 'dyke': '#b8c880', 'water': '#a8d8e8',
    'wall': '#f2ece0', 'timber': '#6a4a2a', 'roof': '#4a5a6a', 'roof2': '#5a4a4a', 'roof3': '#3e4e5e', 'ridge': '#2e3a46',
    'tree': '#4a8a4a', 'tree2': '#5a9a4e', 'trunk': '#5a3a2a', 'plain1': '#86b456',
    'mast': '#4a4a58', 'mast2': '#5e5e6e', 'wire': '#3a3a46', 'insul': '#c8c8d0',
    'g_cap': '#d8d8d0', 'g_cap_hi': '#ffd23a', 'g_dirt': '#8a8a86', 'g_rock': '#a8a8a2', 'g_rock2': '#9c9c96', 'g_dot': '#e8b81a',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'range', y=4.0, depth=3.0, top=0.0, bottom=-3.0)
    zr = periodic_profile(rng, 0.9, 0.5, waves=((3, 1.0), (5, 0.5), (8, 0.2)))
    ob = ridge_slab(L, 'L0_range', 'range', zr, y=3.5, outline=0.0)
    # the volcano: a wide concave cone, a jagged snow cap, a flattened crater top
    cx, R, H = 0.58 * P, 10.0, 6.8
    prof = [(R, 0.0), (R * 0.62, H * 0.18), (R * 0.4, H * 0.42), (R * 0.24, H * 0.72), (R * 0.12, H * 0.98), (R * 0.1, H)]
    B = Builder('L0_fuji', L)
    B.lathe('fuji', prof + [(0.0, H)], 18, at=(cx, 3.0, 0.0), yscale=0.25, smooth=False, phase=0.1)
    def r_at(z):
        for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
            if z0 <= z <= z1:
                return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
        return prof[-1][0]
    z0 = H * 0.62
    sp = [(r_at(z0) + 0.1, z0), (r_at(H * 0.8) + 0.08, H * 0.8), (r_at(H) + 0.06, H + 0.04), (0.0, H + 0.04)]
    B.lathe('snow', sp, 18, at=(cx, 2.98, 0.0), yscale=0.25, smooth=False, phase=0.1, jag=lambda k: (-0.55 if k % 2 else 0.0) - (0.35 if k % 3 == 0 else 0.0))
    B.done()
    C = Builder('L0_cloud', L)
    for k in range(5):
        x = cx - 8.0 + k * 4.0 + rng.uniform(-0.6, 0.6)
        C.sphere('cloud', (x, 1.5, H * 0.33 + rng.uniform(-0.2, 0.3)), rng.uniform(1.4, 2.0), scale=(1.6, 0.4, 0.28), subdiv=2)
    oc = C.done()
    oc['outline'] = 0


def farmhouse(B, x, w, h, roof, rng):
    B.box('wall', (x, 0.4, h / 2), (w, 1.2, h), bevel=0.0)
    for k in range(1, 4):
        B.box('timber', (x - w / 2 + k * w / 4, -0.21, h / 2), (0.07, 0.04, h), bevel=0.0)
    B.box('timber', (x, -0.21, h * 0.55), (w, 0.04, 0.06), bevel=0.0)
    # a hipped tile roof with lifted eaves and a dark ridge
    rh = h * 0.7
    pts = [(-w / 2 - 0.45, -0.05), (w / 2 + 0.45, -0.05), (w / 2 + 0.25, 0.12), (w / 2 - 0.15, rh), (-w / 2 + 0.15, rh), (-w / 2 - 0.25, 0.12)]
    B.slab(roof, pts, 1.3, at=(x, -0.25, h))
    B.box('ridge', (x, 0.4, h + rh + 0.04), (w - 0.1, 1.3, 0.1), bevel=0.0)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'plain1', y=2.0, depth=6.0, top=0.0, bottom=-3.5)
    # paddies: plots of different greens down to the track, pale dykes between them, faint rows of rice (all unlined
    # below the horizon so nothing reads as a ledge), a few flooded plots mirroring the sky
    B = Builder('L1_fields', L)
    edges = K._split(-1.0, P + 1.0, 10, rng, 0.35)
    for k, (a, b) in enumerate(zip(edges, edges[1:])):
        role = 'water' if k % 4 == 2 else ('field', 'field2', 'field3')[k % 3]
        B.box(role, ((a + b) / 2, -1.5, -1.8), (b - a - 0.1, 0.6, 3.6), bevel=0.0)
        B.box('dyke', (b, -1.52, -1.8), (0.14, 0.62, 3.6), bevel=0.0)
        if role != 'water':
            for j in range(5):
                B.box('field3' if role != 'field3' else 'field', ((a + b) / 2, -1.83, -0.35 - j * 0.6), (b - a - 0.3, 0.02, 0.06), bevel=0.0)
    of = B.done(period=None)
    of['outline'] = 0
    H = Builder('L1_farms', L)
    x = rng.uniform(1.0, 3.0)
    while x < P - 2.0:
        w, h = rng.uniform(1.6, 2.4), rng.uniform(0.85, 1.1)
        farmhouse(H, x, w, h, rng.choice(('roof', 'roof2', 'roof3')), rng)
        tx = x + w / 2 + rng.uniform(1.2, 2.2)
        for j in range(rng.choice((1, 2))):
            r = rng.uniform(0.45, 0.65)
            H.rod('trunk', (tx + j * 1.0, 0.8, 0.0), (tx + j * 1.0, 0.8, 0.5), 0.07, segs=5)
            H.sphere(rng.choice(('tree', 'tree2')), (tx + j * 1.0, 0.8, 0.5 + r * 0.8), r, scale=(1.1, 0.7, 0.9), subdiv=2)
        x += w + rng.uniform(4.5, 7.5)
    H.done()


def build_L2(rng):
    L = 'L2'
    B = Builder('L2_masts', L)
    n = 6
    for k in range(n):
        x = (k + 0.3) * P / n
        B.box('mast', (x, 0.0, 2.7), (0.2, 0.2, 5.6), bevel=0.02)
        B.box('mast2', (x - 0.06, -0.11, 2.7), (0.05, 0.02, 5.5), bevel=0.0)
        B.box('mast', (x + 1.0, 0.0, 5.0), (2.3, 0.14, 0.13), bevel=0.0)
        B.rod('mast', (x + 0.05, 0.0, 4.35), (x + 1.4, 0.0, 4.95), 0.045, segs=4)
        B.lathe('insul', [(0.07, 0.0), (0.07, 0.06), (0.04, 0.08), (0.07, 0.12), (0.07, 0.18), (0.0, 0.19)], 6, at=(x + 2.0, 0.0, 4.75))
        B.box('mast', (x, 0.0, 5.55), (0.36, 0.3, 0.12), bevel=0.0)
    B.done()
    W = Builder('L2_wire', L)
    for k in range(n):
        x0 = (k + 0.3) * P / n + 2.0
        x1 = x0 + P / n
        pts = []
        m = 10
        for j in range(m + 1):
            u = j / m
            pts.append((x0 + (x1 - x0) * u, 4.78 - 0.18 * math.sin(math.pi * u)))
        for (xa, za), (xb, zb) in zip(pts, pts[1:]):
            W.rod('wire', (xa, -0.05, za), (xb, -0.05, zb), 0.02, segs=4)
    ow = W.done()
    ow['outline'] = 0


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def tactile(B, rng, x0, x1):
    for k in range(3):
        B.sphere('g_dot', (x0 + (k + 0.5) * (x1 - x0) / 3, -0.02, -0.035), 0.06, scale=(1.0, 0.6, 0.4), subdiv=1)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.26, rows=(1,), cols=(1, 1, 2), gap=0.1, jitter=0.1, roles=('g_rock', 'g_rock2'), bevel=0.05, cap_deco=tactile, hi_h=0.1)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
