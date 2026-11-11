# Vietnam 10-5 "Hue Citadel": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  vnGate (base 300, f 0.04): the citadel's long outer wall far off in the warm haze, with the palace gate as a
#       calm, plain distant silhouette (a broad base with arched passages and three pavilions with curved roofs; no
#       detail), pale and soft
#   L1  vnFlameTrees (base 342, f 0.14): flame trees in full red bloom along the moat, over a green bank
#   ground: the engine's 'vnTiles' style: staggered terracotta tiles under a gold-edged kerb
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, T, CELL_MARGIN, GP, GROUND_DEPTH, GROUND_COLL, new_collection

MODULE = 'vn_citadel'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 342}
SKY = ['#e8a05a', '#f8d8a8', '#fff2dc']
PALETTE = {
    'wall': '#d0b496', 'wall2': '#c4a688', 'gate': '#c8aa8a', 'gate_hi': '#d8bea0', 'arch': '#a88a6e', 'roof': '#a8705a', 'roof2': '#986050',
    'haze': '#f4dcc0',
    'bank': '#7a8a5a', 'bank2': '#6e7e50', 'trunk': '#7a5a48', 'bloom': '#e8806a', 'bloom2': '#f09a7a', 'bloom3': '#dc7060', 'leaf': '#8aa06a',
    # ground (terracotta tiles)
    'g_grout': '#5a2414', 'g_cap': '#c8a03a', 'g_cap_hi': '#ffe08a', 'g_dash': '#8a2a1a', 'g_t1': '#9a3a24', 'g_t2': '#a8442a', 'g_t3': '#8a3220',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def curved_roof(B, x, z, w, role, y):
    """A low pavilion roof with up-turned ends, as a flat silhouette."""
    pts = [(x - w / 2 - 0.35, z + 0.12), (x - w / 2 - 0.1, z), (x + w / 2 + 0.1, z), (x + w / 2 + 0.35, z + 0.12),
           (x + w / 2 - 0.1, z + 0.45), (x - w / 2 + 0.1, z + 0.45)]
    B.slab(role, pts, 0.3, at=(0, y, 0))


def build_L0(rng):
    L = 'L0'
    B = Builder('L0_wall', L)
    B.box('wall', (P / 2, 2.0, 0.3), (P + 2.0, 0.8, 1.8), bevel=0.0)
    for k in range(int(P / 0.9)):
        B.box('wall2', (k * 0.9 + 0.45, 1.6, 1.28), (0.5, 0.4, 0.18), bevel=0.0)
    B.done(period=None)['outline'] = 0.35
    G = Builder('L0_gate', L)
    gx = 420 / 28.1 + 150 / 28.1
    G.box('gate', (gx, 1.2, 0.9), (10.0, 0.8, 1.8), bevel=0.0)
    for k in range(5):
        G.arch('arch', (gx - 3.9 + k * 1.95, 0.75, -0.2), 0.8, 1.3, 0.05)
    for dx, w, h in ((0.0, 4.2, 1.6), (-3.9, 2.0, 1.0), (3.9, 2.0, 1.0)):
        G.box('gate_hi', (gx + dx, 1.0, 1.8 + h / 2), (w - 0.4, 0.6, h), bevel=0.0)
        curved_roof(G, gx + dx, 1.8 + h, w, 'roof', 0.6)
        if dx == 0.0:
            curved_roof(G, gx, 1.8 + h * 0.45, w + 0.3, 'roof2', 0.55)
    G.done()['outline'] = 0.35
    H = Builder('L0_haze', L)
    H.box('haze', (P / 2, 0.3, -0.2), (P + 2.0, 0.1, 0.8), bevel=0.0)
    H.done(period=None)['outline'] = 0


def flame_tree(B, x, s, rng):
    B.rod('trunk', (x, 0.4, -0.5), (x, 0.4, 1.4 * s), 0.12 * s, segs=6)
    for sgn in (-1, 1):
        B.rod('trunk', (x, 0.4, 1.1 * s), (x + sgn * 1.1 * s, 0.4, 1.8 * s), 0.07 * s, segs=5)
    for k in range(16):
        bx = x + rng.uniform(-1.7, 1.7) * s
        bz = (1.8 + rng.uniform(-0.1, 0.9) - 0.25 * abs(bx - x) / s) * s
        B.sphere(rng.choice(('bloom', 'bloom2', 'bloom3', 'bloom', 'leaf')), (bx, rng.uniform(-0.2, 0.3), bz), rng.uniform(0.35, 0.55) * s, scale=(1.3, 0.6, 0.8), subdiv=1)


def build_L1(rng):
    L = 'L1'
    G = Builder('L1_bank', L)
    G.box('bank', (P / 2, 1.0, -1.5), (P + 2.0, 1.0, 3.2), bevel=0.0)
    for k in range(int(P / 1.4)):
        G.sphere('bank2', ((k + 0.5) * P / int(P / 1.4), 0.8, 0.05), 0.7, scale=(1.0, 0.5, 0.3), subdiv=1)
    G.done()
    Tr = Builder('L1_trees', L)
    x = 1.5
    while x < P:
        flame_tree(Tr, x, rng.uniform(1.3, 1.55), rng)
        x += rng.uniform(5.0, 7.5)
    Tr.done()['outline'] = 0.5


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    """Staggered terracotta tiles (two courses per tile, each cut inside the tile) under a gold kerb with red dashes."""
    K.use(MODULE, PALETTE, LAYERS)
    c = new_collection(GROUND_COLL)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', GROUND_COLL)
    B.box('g_grout', (GP / 2, 0.5, -D / 2 - 0.4), (GP + 1.0, 1.0, D + 0.6), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', GROUND_COLL)
    B.box('g_cap', (GP / 2, 0.1, -0.14), (GP + 1.0, 0.9, 0.24), bevel=0.0)
    B.box('g_cap_hi', (GP / 2, 0.04, -0.04), (GP + 1.0, 0.96, 0.05), bevel=0.0)
    for col in range(8):
        for k in range(2):
            B.box('g_dash', (col * T + 0.3 + k * 0.55, -0.37, -0.15), (0.2, 0.04, 0.07), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_tiles', GROUND_COLL)
    for col in range(8):
        for row in range(3):
            x0, x1 = col * T + CELL_MARGIN, (col + 1) * T - CELL_MARGIN
            z0, z1 = -row * T - CELL_MARGIN - (0.28 if row == 0 else 0.0), -(row + 1) * T + CELL_MARGIN
            zm = (z0 + z1) / 2
            for ci, (za, zb) in enumerate(((z0, zm), (zm, z1))):
                if (row + ci) % 2 == 0:
                    spans = ((x0, x1),)
                else:
                    xm = (x0 + x1) / 2
                    spans = ((x0, xm), (xm, x1))
                for xa, xb in spans:
                    B.rbox(rng.choice(('g_t1', 'g_t2', 'g_t3')), ((xa + xb) / 2, -0.1, (za + zb) / 2), (xb - xa - 0.06, 0.3, abs(za - zb) - 0.06), bevel=0.03, segments=1)
    B.done(period=None)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
