# Vietnam 10-6 "Mekong Floating Market" (overhaul secret level, HUB): theme vn_mekong. Rendered ahead of the engine work
# (no THEMES entry exists yet; the atlas is not referenced). Suggested theme: sky ['#4a9ad8', '#b8e0e8', '#fff6dc'],
# ground 'wood' (the bobbing boat decks), liquid a brown-green river, layers in this order with these bases.
#   L0  far bank (base 290, f 0.04): a low green bank of coconut palms and banana trees with tin-roofed stilt houses
#       standing in the water, a haze band at the waterline (no ink on the haze)
#   L1  the market (base 322, f 0.12): the wide brown-green river with long pale glints, wooden market boats riding
#       low under heaps of fruit (watermelons, pineapples, coconuts), each with a pole flying a sample of its goods;
#       painted eyes on the bows
#   ground: a boat deck of worn planks, one plank per tile row, nail heads, a tarred rail along the top
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, T, CELL_MARGIN, GP, GROUND_DEPTH, GROUND_COLL, new_collection

MODULE = 'vn_mekong'
LAYERS = ['L0', 'L1']
BASES = {'L0': 290, 'L1': 322}
SKY = ['#4a9ad8', '#b8e0e8', '#fff6dc']
PALETTE = {
    'bank': '#7aa86a', 'bank2': '#6a9a5c', 'trunk': '#8a7a5a', 'palm': '#5a9a4a', 'palm2': '#4c8a40', 'banana': '#6aaa4a',
    'stilt': '#7a6a52', 'hwall': '#c8b48a', 'hroof': '#9aa4ac', 'hroof2': '#8a949c', 'haze': '#d8ecdc',
    'river': '#6a8a5a', 'river2': '#5a7a4c', 'river3': '#4a6a40', 'glint': '#b8d8a8',
    'hull': '#6a4a30', 'hull2': '#583c26', 'eye_w': '#fbfbf2', 'eye_r': '#c8322a', 'eye_p': '#1a1020', 'pole': '#8a6a42',
    'melon': '#3a8a3a', 'melon2': '#ff5a4a', 'pine': '#e8b030', 'pine_top': '#4a8a3a', 'coco': '#8a5a2a', 'mango': '#ffb02a', 'tarp': '#2a8ad8',
    # ground (boat deck)
    'g_gap': '#3a2618', 'g_plank': '#9a6a42', 'g_plank2': '#8a5c38', 'g_plank3': '#a8784c', 'g_nail': '#4a4a52', 'g_rail': '#4a3020', 'g_rail_hi': '#7a5a38',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def stilt_house(B, x, y, rng):
    w = rng.uniform(1.6, 2.4)
    for dx in (-w / 2 + 0.15, 0, w / 2 - 0.15):
        B.rod('stilt', (x + dx, y, -0.6), (x + dx, y, 0.6), 0.05, segs=4)
    B.box('hwall', (x, y, 1.05), (w, 0.8, 0.9), bevel=0.0)
    B.slab(rng.choice(('hroof', 'hroof2')), [(x - w / 2 - 0.2, 1.45), (x + w / 2 + 0.2, 1.45), (x, 2.1)], 1.0, at=(0, y - 0.1, 0))
    B.box('stilt', (x - w * 0.2, y - 0.42, 1.0), (0.3, 0.05, 0.4), bevel=0.0)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'bank2', y=3.0, depth=2.0, top=-0.1, bottom=-3.0)
    B = Builder('L0_bank', L)
    B.box('bank', (P / 2, 2.0, 0.15), (P + 2.0, 1.0, 0.5), bevel=0.0)
    x = 0.5
    while x < P:
        if rng.random() < 0.7:
            K.palm(B, x, 1.6, 0.3, rng.uniform(2.0, 3.4), rng.uniform(-0.5, 0.5), 'trunk', 'palm', 'palm2', fronds=7, size=0.6)
        else:
            for k in range(5):
                a = math.pi * (0.1 + 0.8 * k / 4)
                B.sphere('banana', (x + math.cos(a) * 0.5, 1.6, 0.9 + math.sin(a) * 0.4), 0.5, scale=(1.0, 0.25, 0.3), rot=(0, -a + math.pi / 2, 0), subdiv=1)
        x += rng.uniform(1.2, 2.2)
    B.done()['outline'] = 0.45
    H = Builder('L0_houses', L)
    x = 3.0
    while x < P - 1.5:
        stilt_house(H, x, 0.8, rng)
        x += rng.uniform(6.0, 9.0)
    H.done()['outline'] = 0.5
    M = Builder('L0_haze', L)
    M.box('haze', (P / 2, 0.3, -0.05), (P + 2.0, 0.1, 0.35), bevel=0.0)
    M.done(period=None)['outline'] = 0


def boat(B, x, rng):
    w = rng.uniform(3.2, 4.4)
    B.slab('hull', [(x - w / 2 - 0.3, 0.45), (x - w / 2 + 0.3, -0.1), (x + w / 2 - 0.3, -0.1), (x + w / 2 + 0.3, 0.5), (x + w / 2, 0.42), (x - w / 2, 0.38)], 0.8, at=(0, 0.2, 0))
    B.box('hull2', (x, -0.25, 0.32), (w, 0.04, 0.08), bevel=0.0)
    # painted eye on the bow
    B.sphere('eye_w', (x + w / 2 - 0.15, -0.24, 0.24), 0.12, scale=(1.4, 0.2, 0.9), subdiv=1)
    B.sphere('eye_r', (x + w / 2 - 0.12, -0.27, 0.24), 0.07, scale=(1.0, 0.2, 1.0), subdiv=1)
    B.sphere('eye_p', (x + w / 2 - 0.1, -0.29, 0.24), 0.035, scale=(1.0, 0.2, 1.0), subdiv=1)
    goods = rng.choice(('melon', 'pine', 'coco', 'mango'))
    for k in range(rng.randint(6, 9)):
        gx = x - w * 0.35 + rng.uniform(0, w * 0.7)
        gz = 0.6 + (k // 4) * 0.3
        if goods == 'melon':
            B.sphere('melon', (gx, rng.uniform(-0.1, 0.2), gz), 0.24, scale=(1.2, 1.0, 0.9), subdiv=1)
        elif goods == 'pine':
            B.sphere('pine', (gx, rng.uniform(-0.1, 0.2), gz), 0.17, scale=(0.9, 0.9, 1.3), subdiv=1)
            B.lathe('pine_top', [(0.08, 0.0), (0.0, 0.2)], 5, at=(gx, -0.05, gz + 0.2), cap_bottom=True)
        elif goods == 'coco':
            B.sphere('coco', (gx, rng.uniform(-0.1, 0.2), gz), 0.18, subdiv=1)
        else:
            B.sphere('mango', (gx, rng.uniform(-0.1, 0.2), gz), 0.14, scale=(1.3, 1.0, 0.9), subdiv=1)
    # the advertising pole: a sample of the goods hung on top
    px = x - w * 0.42
    B.rod('pole', (px, 0.1, 0.4), (px, 0.1, 2.4), 0.04, segs=4)
    if goods == 'melon':
        B.sphere('melon', (px, 0.05, 2.5), 0.2, subdiv=1)
    else:
        B.sphere(goods if goods != 'pine' else 'pine', (px, 0.05, 2.45), 0.14, subdiv=1)
    if rng.random() < 0.5:
        B.slab('tarp', [(x + 0.2, 0.6), (x + w * 0.4, 0.6), (x + w * 0.35, 1.3), (x + 0.3, 1.35)], 0.6, at=(0, 0.3, 0))


def build_L1(rng):
    L = 'L1'
    W = Builder('L1_river', L)
    W.box('river', (P / 2, 1.5, -0.5), (P + 2.0, 1.0, 1.0), bevel=0.0)
    W.box('river2', (P / 2, 1.55, -2.0), (P + 2.0, 1.0, 2.0), bevel=0.0)
    W.box('river3', (P / 2, 1.6, -8.0), (P + 2.0, 1.0, 10.0), bevel=0.0)
    W.done(period=None)['outline'] = 0
    G = Builder('L1_glints', L)
    for k in range(40):
        G.sphere('glint', (rng.uniform(0, P), 1.0, -rng.uniform(0.1, 3.0)), rng.uniform(0.3, 0.8), scale=(1.0, 0.1, 0.05), subdiv=1)
    G.done()
    K.no_ink(L, 'L1_glints')
    B = Builder('L1_boats', L)
    x = 2.5
    while x < P - 2.0:
        boat(B, x, rng)
        x += rng.uniform(6.5, 9.0)
    B.done()['outline'] = 0.6


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    """A boat deck: one worn plank per tile (two in the lower rows), nail heads, a tarred rail as the cap."""
    K.use(MODULE, PALETTE, LAYERS)
    c = new_collection(GROUND_COLL)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', GROUND_COLL)
    B.box('g_gap', (GP / 2, 0.5, -D / 2 - 0.4), (GP + 1.0, 1.0, D + 0.6), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', GROUND_COLL)
    B.box('g_rail', (GP / 2, 0.1, -0.15), (GP + 1.0, 0.9, 0.26), bevel=0.0)
    B.box('g_rail_hi', (GP / 2, 0.04, -0.04), (GP + 1.0, 0.96, 0.05), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_planks', GROUND_COLL)
    for col in range(8):
        for row in range(3):
            x0, x1 = col * T + CELL_MARGIN, (col + 1) * T - CELL_MARGIN
            z0, z1 = -row * T - CELL_MARGIN - (0.3 if row == 0 else 0.0), -(row + 1) * T + CELL_MARGIN
            n = 1 if row == 0 else 2
            for k in range(n):
                za = z0 + (z1 - z0) * k / n
                zb = z0 + (z1 - z0) * (k + 1) / n
                zc = (za + zb) / 2
                B.rbox(rng.choice(('g_plank', 'g_plank2', 'g_plank3')), ((x0 + x1) / 2, -0.1, zc), (x1 - x0, 0.3, abs(zb - za) - 0.07), bevel=0.04, segments=1)
                for sx in (x0 + 0.12, x1 - 0.12):
                    B.sphere('g_nail', (sx, -0.27, zc), 0.035, subdiv=1)
    B.done(period=None)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
