# Vietnam 10-1 "Train Street": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  vnTubeHouses (base 300, f 0.05, blur): a far row of tall narrow tube houses in faded pastels
#   L1  vnTubeHouses (base 340, f 0.14): the near row: pastel tube houses with shuttered windows, little balconies
#       with railings and potted plants, shop signs with a picture (a bowl, a cup; no words)
#   L2  vnWires (base 330, f 0.22): leaning concrete poles and the famous tangle of drooping power lines (thin ink so
#       the wires never read as tightropes to stand on)
#   ground: the engine's 'vnPave' style: a grey kerb over square grey paving slabs
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, T, CELL_MARGIN, GP, GROUND_DEPTH, GROUND_COLL, new_collection

MODULE = 'vn_street'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 300, 'L1': 340, 'L2': 330}
SKY = ['#5aa0d8', '#bfe0f0', '#fff4dc']
FAR = ['#dccdb8', '#d4c4cc', '#c8d4cc', '#e0d4bc', '#ccd0dc']
NEAR = ['#f2d07a', '#e8a07a', '#9ad0c0', '#f0c8d0', '#c8d890', '#f4e4c0', '#a8c0e8']
PALETTE = {
    **{'far%d' % i: c for i, c in enumerate(FAR)}, **{'near%d' % i: c for i, c in enumerate(NEAR)},
    'far_win': '#a8a4a8', 'far_roof': '#b8aca0', 'win': '#4a4250', 'shutter': '#5a8a6a', 'shutter2': '#8a5a3a', 'rail': '#3a3a44',
    'roof': '#8a6a5a', 'plant': '#3a8a3a', 'pot': '#c8643a', 'sign_r': '#e8323a', 'sign_b': '#2a6ad8', 'sign_y': '#ffd23a',
    'sign_w': '#ffffff', 'awning': '#2aa86a', 'pole': '#8a8a92', 'pole2': '#6a6a72', 'wire': '#2a2a30', 'box': '#3a3a40',
    # ground (paving slabs)
    'g_cap': '#b8b0a0', 'g_cap_hi': '#e8e0d0', 'g_grout': '#5a5450', 'g_slab': '#8a8078', 'g_slab2': '#9a9088', 'g_slab3': '#7a7068',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def tube_house(B, x, w, floors, col, rng, y=0.0, near=True):
    fh = 0.95
    h = floors * fh + 0.4
    B.box(col, (x + w / 2, y + 0.4, h / 2 - 0.5), (w - 0.04, 0.8, h + 1.0), bevel=0.0)
    B.box('roof' if near else 'far_roof', (x + w / 2, y - 0.02, h + 0.06), (w + 0.06, 0.9, 0.14), bevel=0.02)
    for f in range(floors):
        z = 0.45 + f * fh + (0.0 if f else 0.0)
        if not near:
            B.box('far_win', (x + w / 2, y - 0.05, z + 0.3), (w * 0.55, 0.06, 0.42), bevel=0.0)
            continue
        if f == 0:
            continue                                      # the ground floor (shop) is hidden behind the street
        B.box('win', (x + w / 2, y - 0.02, z + 0.3), (w * 0.6, 0.06, 0.48), bevel=0.0)
        sh = rng.choice(('shutter', 'shutter2'))
        for s in (-1, 1):
            B.box(sh, (x + w / 2 + s * w * 0.38, y - 0.05, z + 0.3), (w * 0.14, 0.06, 0.52), bevel=0.0)
        if f < floors - 1:
            B.box('rail', (x + w / 2, y - 0.25, z - 0.02), (w * 0.82, 0.4, 0.05), bevel=0.0)
            B.box('rail', (x + w / 2, y - 0.43, z + 0.12), (w * 0.82, 0.03, 0.03), bevel=0.0)
            for q in range(5):
                B.box('rail', (x + w * 0.09 + q * w * 0.82 / 4, y - 0.43, z + 0.05), (0.025, 0.03, 0.16), bevel=0.0)
            if rng.random() < 0.6:
                px = x + rng.uniform(0.25, w - 0.25)
                B.lathe('pot', [(0.06, 0.0), (0.09, 0.13)], 6, at=(px, y - 0.32, z + 0.02), cap_bottom=True)
                B.sphere('plant', (px, y - 0.32, z + 0.22), 0.13, scale=(1.2, 0.8, 1.0), subdiv=1)
    if near and rng.random() < 0.7:
        col2 = rng.choice(('sign_r', 'sign_b', 'awning'))
        B.box(col2, (x + w / 2, y - 0.1, 1.15), (w * 0.85, 0.08, 0.36), bevel=0.02)
        if rng.random() < 0.5:     # a bowl picture
            B.lathe('sign_w', [(0.0, -0.08), (0.12, -0.05), (0.15, 0.04), (0.0, 0.04)], 10, at=(x + w / 2, y - 0.16, 1.14), yscale=0.2)
        else:                      # a coffee cup picture
            B.box('sign_w', (x + w / 2, y - 0.16, 1.13), (0.16, 0.02, 0.18), bevel=0.0)
            B.box('sign_y', (x + w / 2 + 0.1, y - 0.16, 1.15), (0.05, 0.02, 0.08), bevel=0.0)
    return h


def row(L, name, rng, cols, near, y0, floors=(3, 5)):
    B = Builder(name, L)
    x = 0.0
    while x < P - 0.6:
        w = min(P - x, rng.uniform(1.2, 2.1))
        tube_house(B, x, w, rng.randint(*floors), rng.choice(cols), rng, y=y0, near=near)
        x += w
    B.done(period=None)


def build_L0(rng):
    L = 'L0'
    row(L, 'L0_far', rng, ['far%d' % i for i in range(len(FAR))], False, 1.0, floors=(4, 6))
    for o in K.COLL[L].objects:
        o['outline'] = 0.4


def build_L1(rng):
    L = 'L1'
    row(L, 'L1_near', rng, ['near%d' % i for i in range(len(NEAR))], True, 0.5, floors=(3, 5))
    for o in K.COLL[L].objects:
        o['outline'] = 0.7


def build_L2(rng):
    L = 'L2'
    B = Builder('L2_poles', L)
    W = Builder('L2_wires', L)
    xs = []
    x = 1.0
    while x < P:
        xs.append(x)
        x += rng.uniform(4.0, 6.5)
    tops = []
    for x in xs:
        lean = rng.uniform(-0.15, 0.15)
        top = (x + lean, 5.6)
        B.rod('pole', (x, 0.0, -1.0), (top[0], 0.0, top[1]), 0.1, segs=6, r2=0.08)
        B.box('pole2', (top[0], -0.05, 5.3), (0.8, 0.12, 0.1), bevel=0.0)
        if rng.random() < 0.6:
            B.box('box', (top[0] + 0.12, -0.12, 4.6), (0.3, 0.2, 0.36), bevel=0.04)
        tops.append(top)
    tops.append((tops[0][0] + P, tops[0][1]))
    for (xa, za), (xb, zb) in zip(tops, tops[1:]):
        for k in range(6):
            z0 = za - 0.15 - k * 0.12 + rng.uniform(-0.05, 0.05)
            z1 = zb - 0.15 - k * 0.12 + rng.uniform(-0.05, 0.05)
            sag = rng.uniform(0.5, 1.2)
            n = 10
            pts = [(xa + (xb - xa) * j / n, z0 + (z1 - z0) * j / n - sag * math.sin(math.pi * j / n)) for j in range(n + 1)]
            for (p0, q0), (p1, q1) in zip(pts, pts[1:]):
                W.rod('wire', (p0, 0.1, q0), (p1, 0.1, q1), 0.022, segs=4)
        # a little tangle knot hanging from one span
        W.sphere('wire', ((xa + xb) / 2 + rng.uniform(-0.5, 0.5), 0.1, min(za, zb) - 1.1), 0.22, scale=(1.4, 0.5, 0.9), subdiv=1)
    B.done()['outline'] = 0.7
    W.done()['outline'] = 0.25


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    """Square grey paving slabs, one or four per tile, inside the tile with grout around them, under a kerb."""
    K.use(MODULE, PALETTE, LAYERS)
    c = new_collection(GROUND_COLL)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', GROUND_COLL)
    B.box('g_grout', (GP / 2, 0.5, -D / 2 - 0.4), (GP + 1.0, 1.0, D + 0.6), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', GROUND_COLL)
    B.box('g_cap', (GP / 2, 0.1, -0.15), (GP + 1.0, 0.9, 0.26), bevel=0.0)
    B.box('g_cap_hi', (GP / 2, 0.04, -0.04), (GP + 1.0, 0.96, 0.05), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_slabs', GROUND_COLL)
    for col in range(8):
        for row in range(3):
            x0, x1 = col * T + CELL_MARGIN, (col + 1) * T - CELL_MARGIN
            z0, z1 = -row * T - CELL_MARGIN - (0.3 if row == 0 else 0.0), -(row + 1) * T + CELL_MARGIN
            if rng.random() < 0.5:
                B.rbox(rng.choice(('g_slab', 'g_slab2', 'g_slab3')), ((x0 + x1) / 2, -0.1, (z0 + z1) / 2), (x1 - x0 - 0.04, 0.3, z0 - z1 - 0.04), bevel=0.04, segments=1)
            else:
                xm, zm = (x0 + x1) / 2, (z0 + z1) / 2
                for xa, xb in ((x0, xm), (xm, x1)):
                    for za, zb in ((z0, zm), (zm, z1)):
                        B.rbox(rng.choice(('g_slab', 'g_slab2', 'g_slab3')), ((xa + xb) / 2, -0.1, (za + zb) / 2), (abs(xb - xa) - 0.06, 0.3, abs(za - zb) - 0.06), bevel=0.03, segments=1)
    B.done(period=None)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
