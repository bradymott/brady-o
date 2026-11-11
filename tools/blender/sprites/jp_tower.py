# Japan (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) N `jp_tower`: "Neon Tower" (11-4 TOWER, exterior climb)
# at dusk. Not wired into the game yet: the overhaul's engine work will add the theme; its key matches this atlas's name.
# Rendered as an ordinary horizontal strip set; a vertically tiling version waits for the engine's `vertical` image
# layers (§8.1, JOB=vbg). Original toon art:
#   L0  (base 330, f 0.03): the city far below at dusk: a band of low blocks, a bay with a far bridge, hills beyond
#   L1  (base 360, f 0.12): neighbouring towers rising past the view: glass curtain walls with a few lit windows,
#       crowns with red aircraft lights and small rooftop billboards (pictures only, never words)
#   ground: the tower's steel deck: riveted grey plates under a yellow-and-black hazard edge
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU, T, CELL_MARGIN

MODULE = 'jp_tower'
LAYERS = ['L0', 'L1']
BASES = {'L0': 330, 'L1': 360}
SKY = ['#3a2a6a', '#c86a8a', '#ffc890']
PX = 28.1
PALETTE = {
    'hills': '#7a6a9a', 'bay': '#8a8ac8', 'bay2': '#a8a0d8', 'bridge': '#5a4a7a', 'blocks': '#6a5a8a', 'blocks2': '#5e5080',
    'farwin_glow': '#ffd8a0',
    'tower': '#4a4878', 'tower2': '#56548a', 'tower3': '#3e3c6a', 'mull': '#3a3860', 'glass': '#6a7ab0', 'glass2': '#7a8ac0',
    'win_glow': '#ffe0a8', 'crown': '#2e2c50', 'red_glow': '#ff4a4a', 'board': '#1e1c38',
    'ad1_glow': '#ff8ac0', 'ad2_glow': '#8ae8ff', 'ad3_glow': '#ffe06a',
    'g_cap': '#3a3a44', 'g_cap_hi': '#ffd23a', 'g_dirt': '#5a5a66', 'g_rock': '#8a8e9a', 'g_rock2': '#7e828e', 'g_hz': '#2a2a30',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'blocks2', y=3.0, depth=3.0, top=0.0, bottom=-3.0)
    zh = periodic_profile(rng, 2.2, 0.8, waves=((2, 1.0), (3, 0.5), (6, 0.2)))
    ridge_slab(L, 'L0_hills', 'hills', zh, y=4.0, outline=0.0)
    B = Builder('L0_bay', L)
    B.box('bay', (P / 2, 3.0, 0.4), (P + 2.0, 0.6, 0.8), bevel=0.0)
    B.box('bay2', (P / 2, 2.6, 0.75), (P + 2.0, 0.1, 0.06), bevel=0.0)
    # a far suspension bridge across the bay
    x0, x1 = 0.15 * P, 0.55 * P
    B.box('bridge', ((x0 + x1) / 2, 2.4, 0.9), (x1 - x0, 0.1, 0.08), bevel=0.0)
    for x in (x0 + (x1 - x0) * 0.25, x0 + (x1 - x0) * 0.75):
        B.box('bridge', (x, 2.4, 1.4), (0.14, 0.1, 1.4), bevel=0.0)
    for k in range(17):
        u = k / 16
        x = x0 + (x1 - x0) * u
        z = 2.0 - 1.0 * math.sin(math.pi * ((u * 2) % 1.0)) * 0.9 if u < 1 else 2.0
        B.box('bridge', (x, 2.4, (0.9 + z) / 2), (0.03, 0.06, max(0.02, z - 0.9)), bevel=0.0)
    ob = B.done(period=None)
    ob['outline'] = 0
    # the band of low city blocks in front of the bay
    C = Builder('L0_blocks', L)
    W = Builder('L0_windows', L)
    x = 0.0
    while x < P:
        w, h = rng.uniform(0.8, 1.8), rng.uniform(0.3, 1.2)
        for dx in wraps(x + w / 2, w / 2):
            C.box(rng.choice(('blocks', 'blocks2')), (x + w / 2 + dx, 1.0, h / 2 - 1.0), (w - 0.04, 0.6, h + 2.0), bevel=0.0)
        r2 = random.Random(int(x * 77))
        for j in range(6):
            if r2.random() < 0.5:
                wx = x + r2.uniform(0.15, w - 0.15)
                wz = r2.uniform(-0.2, h - 0.15)
                W.box('farwin_glow', (wx, 0.65, wz), (0.08, 0.04, 0.08), bevel=0.0)
        x += w
    oc = C.done(period=None)
    oc['outline'] = 0.5
    ow = W.done()
    ow['outline'] = 0


def tower(B, W, A, x, w, h, rng, role):
    B.box(role, (x, 0.0, (h - 4.0) / 2), (w, 1.4, h + 4.0), bevel=0.0)
    # curtain wall: vertical mullions and floor bands over glass panels
    B.box('glass', (x, -0.72, (h - 4.0) / 2), (w - 0.3, 0.04, h + 4.0), bevel=0.0)
    n = max(2, int(w / 0.55))
    for k in range(n + 1):
        B.box('mull', (x - (w - 0.3) / 2 + k * (w - 0.3) / n, -0.76, (h - 4.0) / 2), (0.05, 0.04, h + 4.0), bevel=0.0)
    z = h - 0.5
    r2 = random.Random(int(x * 31))
    while z > -3.5:
        B.box('mull', (x, -0.77, z), (w - 0.3, 0.04, 0.06), bevel=0.0)
        for k in range(n):
            if r2.random() < 0.18:
                W.box('win_glow', (x - (w - 0.3) / 2 + (k + 0.5) * (w - 0.3) / n, -0.75, z - 0.25), ((w - 0.3) / n - 0.08, 0.03, 0.36), bevel=0.0)
        z -= 0.55
    # the crown: a stepped top, aerial and a red light; sometimes a small billboard with a picture
    B.box('crown', (x, 0.0, h + 0.15), (w + 0.1, 1.5, 0.3), bevel=0.0)
    B.box('crown', (x, 0.0, h + 0.5), (w * 0.6, 1.2, 0.4), bevel=0.0)
    B.rod('crown', (x + w * 0.15, 0.0, h + 0.7), (x + w * 0.15, 0.0, h + 1.8), 0.04, segs=4)
    W.sphere('red_glow', (x + w * 0.15, -0.05, h + 1.85), 0.09, subdiv=1)
    if rng.random() < 0.5:
        bx = x - w * 0.15
        A.box('board', (bx, -0.3, h + 1.3), (1.5, 0.08, 0.9), bevel=0.02)
        k = rng.randrange(3)
        if k == 0:          # a fish
            A.sphere('ad2_glow', (bx - 0.1, -0.36, h + 1.3), 0.3, scale=(1.4, 0.2, 0.7), subdiv=1)
            A.slab('ad2_glow', [(0.0, 0.0), (0.3, 0.22), (0.3, -0.22)], 0.04, at=(bx + 0.3, -0.38, h + 1.3))
        elif k == 1:        # a bowl of noodles
            A.sphere('ad3_glow', (bx, -0.36, h + 1.18), 0.36, scale=(1.0, 0.2, 0.5), subdiv=1)
            for j in range(3):
                A.rod('ad1_glow', (bx - 0.2 + 0.2 * j, -0.4, h + 1.3), (bx - 0.15 + 0.2 * j, -0.4, h + 1.6), 0.025, segs=4)
        else:               # a heart
            A.sphere('ad1_glow', (bx - 0.12, -0.36, h + 1.38), 0.17, scale=(1.0, 0.3, 1.0), subdiv=1)
            A.sphere('ad1_glow', (bx + 0.12, -0.36, h + 1.38), 0.17, scale=(1.0, 0.3, 1.0), subdiv=1)
            A.slab('ad1_glow', [(-0.29, 0.0), (0.29, 0.0), (0.0, -0.35)], 0.04, at=(bx, -0.38, h + 1.36))


def build_L1(rng):
    L = 'L1'
    B = Builder('L1_towers', L)
    W = Builder('L1_lights', L)
    A = Builder('L1_boards', L)
    x = rng.uniform(1.0, 3.0)
    while x < P - 2.0:
        w = rng.uniform(2.6, 4.2)
        h = rng.uniform(7.0, 11.5)
        tower(B, W, A, x, w, h, rng, rng.choice(('tower', 'tower2', 'tower3')))
        x += w + rng.uniform(3.0, 6.0)
    B.done()
    ow = W.done()
    ow['outline'] = 0
    A.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def hazard(B, rng, x0, x1):
    n = 3
    for k in range(n):
        xa = x0 + (k + 0.25) * (x1 - x0) / n
        B.slab('g_hz', [(0.0, 0.0), (0.12, 0.0), (0.2, 0.2), (0.08, 0.2)], 0.9, at=(xa, -0.5, -0.24))


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.26, rows=(1,), cols=(1,), gap=0.08, jitter=0.0, roles=('g_rock', 'g_rock2'), bevel=0.04, cap_deco=hazard, hi_h=0.24)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
