# Nepal 12-5 "Baron's Fortress" (theme np_fortress): original toon art for the Baron's vault.
#   L0  npVault (base 340, f 0.08, #3a1460): a backdrop: deep purple wall panels with gold trim, the Baron's banners
#       (purple, a gold monocle emblem, a pointed hem), two long shelves of stolen snow globes (glass domes on dark
#       bases, little gold, red, blue and green souvenirs inside)
#   ground npMarble: purple marble slabs with pale veins under a gold lip
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU

MODULE = 'np_fortress'
LAYERS = ['L0']
BASES = {'L0': 340}
SKY = ['#2a0a4a', '#4a1a6a', '#6a2a8a']
PX = 28.1
PALETTE = {
    'wall': '#3a1460', 'wall2': '#42186a', 'trim': '#c8a03a', 'banner': '#4a1a8a', 'emblem': '#ffd84a',
    'shelf': '#4a2a6a', 'gbase': '#2e2240', 'glass': '#cfe8f8', 'glint': '#f0faff',
    's_gold': '#e8b838', 's_silver': '#c8c8d0', 's_red': '#d8322a', 's_blue': '#3ab0e8', 's_green': '#5ad04a', 's_white': '#f4f0e8',
    'crate': '#a8804a', 'crate2': '#7a5a30',
    'g_cap': '#c8a03a', 'g_cap_hi': '#ffe88a', 'g_dirt': '#3a1260', 'g_rock': '#5a2a8a', 'g_rock2': '#4e2280', 'g_vein': '#9a6ac8',
}
K.use(MODULE, PALETTE, LAYERS)
Z = lambda row: (340 - row) / PX


def build_L0(rng, crates=False):
    L = 'L0'
    W = Builder('L0_wall', L)
    n = 16
    for k in range(n + 1):
        x = k * P / n
        W.box('wall' if k % 2 else 'wall2', (x + P / n / 2, 1.0, 4.0), (P / n, 0.6, 18.0), bevel=0.0)
    ow = W.done(period=None)
    ow['outline'] = 0
    B = Builder('L0_banners', L)
    for k in range(4):
        x = (30 + 35 + k * 300) / PX
        if x > P:
            continue
        zt, zb = Z(60), Z(180)
        B.box('trim', (x, 0.5, zt + 0.1), (70 / PX + 0.2, 0.3, 0.22), bevel=0.02)
        B.slab('banner', [(-35 / PX, zb - zt), (0.0, zb - zt - 16 / PX), (35 / PX, zb - zt), (35 / PX, 0.0), (-35 / PX, 0.0)], 0.12, at=(x, 0.4, zt))
        B.lathe('emblem', [(0.66, -0.06), (0.66, 0.06), (0.5, 0.06), (0.5, -0.06)], 20, at=(x, 0.3, (zt + zb) / 2 + 0.25), rot=(math.pi / 2, 0, 0))
        B.rod('emblem', (x + 0.45, 0.28, (zt + zb) / 2 - 0.2), (x + 0.65, 0.28, (zt + zb) / 2 - 1.2), 0.07, segs=5)
    B.done()
    S = Builder('L0_shelves', L)
    G = Builder('L0_globes', L)
    for sy in (Z(340 - 150), Z(340 - 90)):
        S.box('shelf', (P / 2, 0.3, sy - 0.1), (P + 2.0, 0.6, 0.22), bevel=0.0)
        x = 14 / PX
        while crates and x < P:
            # the depot's shelves hold the Baron's crates (stencilled with his monocle) instead of snow globes
            w = rng.choice((0.9, 1.1, 1.3))
            G.box('crate', (x + w / 2, 0.1, sy + w / 2), (w, 0.6, w), bevel=0.03)
            G.box('crate2', (x + w / 2, -0.21, sy + w / 2), (w - 0.16, 0.02, w - 0.16), bevel=0.0)
            G.rod('crate2', (x + 0.1, -0.23, sy + 0.1), (x + w - 0.1, -0.23, sy + w - 0.1), 0.035, segs=4)
            G.lathe('emblem', [(0.14, -0.02), (0.14, 0.02), (0.09, 0.02), (0.09, -0.02)], 12, at=(x + w * 0.7, -0.25, sy + w * 0.7), rot=(math.pi / 2, 0, 0))
            x += w + rng.uniform(0.15, 0.6)
        while not crates and x < P:
            G.box('gbase', (x, 0.1, sy + 0.1), (0.56, 0.4, 0.2), bevel=0.03)
            G.sphere('glass', (x, 0.1, sy + 0.55), 0.36, subdiv=2)
            G.sphere('glint', (x - 0.12, -0.2, sy + 0.7), 0.06, scale=(1.0, 0.4, 1.4), subdiv=1)
            G.box(rng.choice(('s_gold', 's_silver', 's_red', 's_blue', 's_green', 's_white')), (x, -0.3, sy + 0.45), (0.22, 0.04, 0.3), bevel=0.02)
            x += 34 / PX
    os_ = S.done(period=None)
    os_['outline'] = 0
    G.done(period=None)


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def veins(B, rng, x0, x1):
    pass


def build_ground(seed=1, keep=False):
    if not keep:
        K.use(MODULE, PALETTE, LAYERS)
    c = K.ground_blocks(seed, cap_h=0.2, rows=(1,), cols=(1,), gap=0.06, jitter=0.0, roles=('g_rock', 'g_rock2'), bevel=0.03, hi_h=0.06)
    # pale veins across the slabs, kept inside each tile
    B = K.Builder('ground_veins', K.GROUND_COLL)
    r = random.Random(seed + 5)
    for col in range(8):
        for row in range(3):
            x0 = col * K.T + 0.15
            z0 = -row * K.T - (0.4 if row == 0 else 0.15)
            xa, za = x0, z0 - r.uniform(0.0, 0.4)
            for j in range(3):
                xb, zb = xa + r.uniform(0.2, 0.3), za - r.uniform(-0.15, 0.15)
                B.rod('g_vein', (xa, -0.3, za), (xb, -0.3, zb), 0.018, segs=3)
                xa, za = xb, zb
    ob = B.done(period=None)
    ob['outline'] = 0
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
