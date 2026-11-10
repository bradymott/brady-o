# Spain 6-4 "The Giant Falla" (theme es_fallas): the parallax background as a Fiesta Toon diorama. Original art: a
# spring festival town where giant papier-mache monuments of FOOD AND ANIMALS (never people) tower over the square,
# under arches of festival lights and strings of firecrackers.
#
#   L0  esTown (base 330, f 0.04, #f0e8dc): a far, pale town: whitewashed houses and terracotta roofs, flags
#   L1  esFallas (base 360, f 0.12, #e8dcc8): the monuments on tiered plinths: a beaming orange wearing a fan, a
#       grinning paella pan with a prawn, a cheeky cat on a stack of fruit, a smiling sun; light arches of coloured
#       bulbs between them and firecracker strings hanging from a wire
#   ground: grass style as paving: a pale stone kerb cap with bits of confetti over sandy pavers
# Contract and shared toolkit: es_tomatina.py.
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import es_tomatina as K
from es_tomatina import Builder, P, TAU, OVER

MODULE = 'es_fallas'
LAYERS = ['L0', 'L1']
BASES = {'L0': 330, 'L1': 360}
SKY = ['#3a6ad8', '#9ac8ff', '#fff0e8']
FL = ['fl_pink', 'fl_yellow', 'fl_blue', 'fl_green', 'fl_orange', 'fl_violet']
PALETTE = {
    # L0 the far town (pale, low contrast)
    'wall_a': '#f0e8dc', 'wall_b': '#ece0d0', 'wall_c': '#f4ece0', 'wall_d': '#efe4c8', 'roof': '#d8907a', 'roof_dark': '#c47a64',
    'shutter': '#7aa88a', 'frame': '#fbf6ee', 'glass': '#b8ccd8', 'door': '#9a7a62', 'iron': '#6a6a70', 'pot': '#c89a7a', 'leaf': '#7aa87a',
    'street': '#e4dccc', 'string': '#8a7a6a',
    'fl_pink': '#ff5a8a', 'fl_yellow': '#ffd23a', 'fl_blue': '#3ac8ff', 'fl_green': '#7ae05a', 'fl_orange': '#ff8a2a', 'fl_violet': '#b86aff',
    'splat': '#e8322a', 'splat_dark': '#b81e1e',
    # L1 the monuments
    'plinth': '#e8dcc8', 'plinth2': '#d8c8ae', 'plinth_band': '#c8a03a', 'orange': '#ff8a1a', 'orange_hi': '#ffb050', 'leaf_g': '#3a9a3a',
    'eye_w': '#ffffff', 'eye_p': '#1a1020', 'cheek': '#ff6a7a', 'mouth': '#7a1a2a', 'fan': '#e8322a', 'fan2': '#ffd23a',
    'pan': '#3a3a44', 'pan_rim': '#5a5a66', 'rice': '#ffd04a', 'rice2': '#f0b830', 'prawn': '#ff7a5a', 'prawn2': '#ffa080', 'lemon': '#fff04a',
    'pea': '#5ab84a', 'pepper_r': '#e8322a', 'cat': '#f4a050', 'cat2': '#fff0d8', 'cat_dk': '#c87a34', 'melon': '#3a9a3a', 'melon_red': '#ff5a6a',
    'grape': '#8a4ab8', 'sun': '#ffd23a', 'sun2': '#ffb01a', 'pole': '#6a6a74', 'bulb_glow': '#fff4c0', 'cracker': '#e8322a', 'cracker2': '#ffd23a',
    'fill': '#e8dcc8',
    # ground (paving)
    'g_turf': '#e0d4c0', 'g_turf_hi': '#f4ecdc', 'g_soil': '#c8b89c', 'g_soil_dark': '#a8987c', 'g_rock': '#d8c8ac',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
HOUSE_ROLES = {'roof': 'roof', 'roof_dark': 'roof_dark', 'shutter': 'shutter', 'frame': 'frame', 'glass': 'glass', 'door': 'door',
               'iron': 'iron', 'pot': 'pot', 'leaf': 'leaf', 'flowers': FL, 'splat': 'splat', 'splat_dark': 'splat_dark',
               'string': 'string', 'flags': FL}


def build_L0(rng):
    L = 'L0'
    K.fill_below(TH, L, 'street', top=0.2, depth=3.0, y=3.0)
    n = 13
    ws = [rng.uniform(2.2, 3.6) for _ in range(n)]
    s = P / sum(ws); ws = [w * s for w in ws]
    x = 0.0
    B = Builder('L0_houses', L, TH)
    walls = ['wall_a', 'wall_b', 'wall_c', 'wall_d']
    for i, w in enumerate(ws):
        h = rng.choice([3.4, 4.2, 5.0, 5.8]) + rng.uniform(-0.2, 0.2)
        y = rng.choice([1.0, 1.6, 2.2])
        roles = dict(HOUSE_ROLES, wall=walls[i % 4])
        K.house(B, x, y, w, h, roles, rng, door=False, splats=0)
        if rng.random() < 0.5:
            K.bunting(B, x + w * 0.5, x + w + ws[(i + 1) % n] * 0.5, y - 1.1, min(h, 4.6) - 0.3, 0.45, roles, rng)
        x += w
    B.done()


def face(B, xc, y, zc, s, rng, mouth=True):
    """A cartoon face for a monument: two big eyes with pupils, rosy cheeks and a wide smile."""
    for side in (-1, 1):
        B.sphere('eye_w', (xc + side * 0.32 * s, y, zc + 0.18 * s), 0.2 * s, scale=(0.9, 0.5, 1.1), subdiv=2)
        B.sphere('eye_p', (xc + side * 0.3 * s + 0.04 * s, y - 0.08 * s, zc + 0.16 * s), 0.09 * s, scale=(1, 0.5, 1.1), subdiv=1)
        B.sphere('cheek', (xc + side * 0.55 * s, y + 0.02, zc - 0.12 * s), 0.12 * s, scale=(1.2, 0.4, 0.8), subdiv=1)
    if mouth:
        pts = [(xc + 0.28 * s * math.cos(math.pi + math.pi * k / 8), zc - 0.12 * s + 0.2 * s * math.sin(math.pi + math.pi * k / 8)) for k in range(9)]
        for a, b in zip(pts, pts[1:]):
            B.rod('mouth', (a[0], y - 0.02, a[1]), (b[0], y - 0.02, b[1]), 0.04 * s, segs=4)


def plinth(B, xc, w, h, y=0.0):
    """A tiered festival plinth: two stepped blocks with a gold band and a scalloped trim."""
    B.box('plinth2', (xc, y, h * 0.3), (w, 1.6, h * 0.6), bevel=0.04)
    B.box('plinth', (xc, y - 0.1, h * 0.8), (w * 0.8, 1.4, h * 0.4), bevel=0.04)
    B.box('plinth_band', (xc, y - 0.82, h * 0.6), (w + 0.04, 0.05, 0.12), bevel=0.0)
    n = int(w / 0.4)
    for k in range(n):
        B.sphere(FL[k % len(FL)], (xc - w / 2 + (k + 0.5) * w / n, y - 0.85, h * 0.6 - 0.12), 0.12, scale=(1.0, 0.4, 0.8), subdiv=1)
    return h


def mon_orange(B, xc, y, rng):
    top = plinth(B, xc, 3.0, 1.2, y)
    c = (xc, y - 0.2, top + 1.5)
    B.sphere('orange', c, 1.45, subdiv=3)
    B.sphere('orange_hi', (xc - 0.55, y - 1.3, top + 2.1), 0.32, scale=(1.2, 0.3, 0.8), subdiv=1)
    face(B, xc, y - 1.5, top + 1.45, 1.4, rng)
    B.sphere('leaf_g', (xc + 0.4, y - 0.4, top + 3.05), 0.45, scale=(1.6, 0.5, 0.5), rot=(0, -0.4, 0), subdiv=1)
    # a red fan held beside it, open
    for k in range(7):
        a0, a1 = math.radians(100 + 15 * k), math.radians(115 + 15 * k)
        piv = (xc + 1.45, top + 0.9)
        pts = [(0.0, 0.0), (1.1 * math.cos(a0), 1.1 * math.sin(a0)), (1.1 * math.cos(a1), 1.1 * math.sin(a1))]
        B.slab('fan' if k % 2 else 'fan2', [(px * -1 + piv[0], pz + piv[1]) for px, pz in pts], 0.06, at=(0, y - 1.4, 0))


def mon_paella(B, xc, y, rng):
    top = plinth(B, xc, 3.6, 1.0, y)
    # a giant paella pan tipped toward us, with a grinning prawn sitting in the rice
    B.lathe('pan', [(1.7, 0.0), (1.85, 0.3), (1.85, 0.36)], 16, at=(xc, y - 0.2, top + 0.9), rot=(-1.15, 0, 0), cap_bottom=True, yscale=1.0)
    B.lathe('rice', [(1.68, 0.12), (0.0, 0.3)], 16, at=(xc, y - 0.25, top + 0.9), rot=(-1.15, 0, 0), cap_bottom=True)
    for k in range(10):
        a = TAU * k / 10
        r = rng.uniform(0.4, 1.3)
        role = rng.choice(('pea', 'pepper_r', 'lemon', 'rice2'))
        B.sphere(role, (xc + math.cos(a) * r, y - 0.9, top + 0.9 + math.sin(a) * r * 0.42 + 0.1), 0.14, subdiv=1)
    for side in (-1, 1):
        B.rod('pan_rim', (xc + side * 1.8, y - 0.6, top + 0.9), (xc + side * 2.35, y - 0.6, top + 1.0), 0.09, segs=5)
    # the prawn: a curled body of segments, a fan tail, feelers and a face
    pc = (xc + 0.2, y - 1.2, top + 2.1)
    for k in range(6):
        a = math.radians(200 - k * 30)
        r = 0.75
        B.sphere('prawn' if k % 2 else 'prawn2', (pc[0] + r * math.cos(a), pc[1], pc[2] + r * math.sin(a) * 0.9), 0.42 - k * 0.04, scale=(1, 0.7, 1), subdiv=2)
    B.sphere('prawn', (pc[0] - 0.85, pc[1], pc[2] - 0.15), 0.5, subdiv=2)
    face(B, pc[0] - 0.9, pc[1] - 0.45, pc[2] - 0.1, 0.55, rng)
    for k in range(2):
        B.rod('prawn2', (pc[0] - 1.1, pc[1], pc[2] + 0.3), (pc[0] - 1.6 - k * 0.3, pc[1], pc[2] + 1.6 + k * 0.2), 0.03, segs=4)


def mon_cat(B, xc, y, rng):
    top = plinth(B, xc, 2.8, 1.1, y)
    # a stack of fruit: a melon slice, grapes, then a smug cat on top
    B.slab('melon', [(-1.2, 0.0), (1.2, 0.0)] + [(1.2 * math.cos(math.pi * k / 10), -0.0 + 0.9 * math.sin(math.pi * k / 10)) for k in range(1, 10)][::-1], 0.8, at=(xc, y - 0.5, top + 0.01), rot=(0, math.pi, 0))
    B.slab('melon_red', [(-1.05, 0.08)] + [(1.05 * math.cos(math.pi - math.pi * k / 10), 0.08 + 0.75 * math.sin(math.pi * k / 10)) for k in range(1, 10)] + [(1.05, 0.08)], 0.1, at=(xc, y - 0.95, top + 0.01))
    for k in range(6):
        B.sphere('grape', (xc - 0.5 + (k % 3) * 0.5, y - 0.3, top + 1.1 + (k // 3) * 0.4), 0.28, subdiv=2)
    cc = (xc, y - 0.3, top + 2.4)
    B.sphere('cat', cc, 0.75, scale=(1.0, 0.8, 0.9), subdiv=2)
    B.sphere('cat2', (cc[0], cc[1] - 0.55, cc[2] - 0.25), 0.4, scale=(1.1, 0.4, 0.8), subdiv=1)
    for side in (-1, 1):
        B.slab('cat', [(-0.3, 0.0), (0.3, 0.0), (0.05 * side, 0.55)], 0.3, at=(cc[0] + side * 0.45, cc[1] - 0.15, cc[2] + 0.5))
        B.slab('cheek', [(-0.15, 0.04), (0.15, 0.04), (0.03 * side, 0.32)], 0.05, at=(cc[0] + side * 0.45, cc[1] - 0.32, cc[2] + 0.52))
        for k in range(2):
            B.rod('cat_dk', (cc[0] + side * 0.4, cc[1] - 0.7, cc[2] - 0.15 + k * 0.1), (cc[0] + side * 1.0, cc[1] - 0.7, cc[2] - 0.1 + k * 0.2), 0.02, segs=3)
    face(B, cc[0], cc[1] - 0.66, cc[2] + 0.05, 0.6, rng)
    B.rod('cat', (cc[0] + 0.6, cc[1] + 0.2, cc[2] - 0.4), (cc[0] + 1.3, cc[1] + 0.2, cc[2] + 0.5), 0.13, segs=6)


def mon_sun(B, xc, y, rng):
    top = plinth(B, xc, 2.4, 1.3, y)
    c = (xc, y - 0.2, top + 2.0)
    for k in range(12):
        a = TAU * k / 12
        B.slab('sun2' if k % 2 else 'sun', [(-0.22, 0.0), (0.22, 0.0), (0.0, 0.7)], 0.2, at=(c[0] + math.cos(a) * 1.15, c[1] + 0.2, c[2] + math.sin(a) * 1.15), rot=(0, -(a - math.pi / 2), 0))
    B.sphere('sun', c, 1.05, scale=(1, 0.5, 1), subdiv=3)
    face(B, xc, y - 0.75, top + 2.0, 1.0, rng)


def light_arch(B, xc, w, h, y, rng):
    """A festival light arch: two poles and a pointed arch of coloured bulbs."""
    for side in (-1, 1):
        B.rod('pole', (xc + side * w / 2, y, 0.0), (xc + side * w / 2, y, h * 0.6), 0.06, segs=5)
    n = 18
    for k in range(n + 1):
        a = math.pi - math.pi * k / n
        x = xc + w / 2 * math.cos(a)
        z = h * 0.6 + (h * 0.4) * math.sin(a) ** 0.7
        B.sphere('bulb_glow' if k % 3 else FL[k % len(FL)], (x, y - 0.05, z), 0.11, subdiv=1)


def build_L1(rng):
    L = 'L1'
    K.fill_below(TH, L, 'fill', top=0.2, depth=3.0, y=2.5)
    B = Builder('L1_monuments', L, TH)
    mon_orange(B, 4.6, 1.2, rng)
    mon_paella(B, 13.5, 1.6, rng)
    mon_cat(B, 22.5, 1.2, rng)
    mon_sun(B, 31.0, 1.6, rng)
    B.done()
    A = Builder('L1_lights', L, TH)
    for xc in (9.0, 18.0, 27.0, 35.6):
        light_arch(A, xc, 3.0, 5.6, 0.2, rng)
    A.done()
    C = Builder('L1_crackers', L, TH)
    zw = 6.3
    C.rod('pole', (-OVER, -0.4, zw), (P + OVER, -0.4, zw), 0.02, segs=4)
    for k in range(int(P / 0.9)):
        x = (k + 0.5) * 0.9
        ln = 0.6 + 0.3 * ((k * 7) % 3)
        for j in range(int(ln / 0.2)):
            C.rod('cracker' if j % 2 else 'cracker2', (x, -0.45, zw - 0.05 - j * 0.2), (x, -0.45, zw - 0.2 - j * 0.2), 0.05, segs=5)
    C.done(period=None)


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    rng = random.Random(seed)
    def confetti(B, col, x0, x1):
        for k in range(2):
            if rng.random() < 0.7:
                cx = rng.uniform(x0 + 0.1, x1 - 0.1)
                B.box(rng.choice(FL), (cx, -0.36, -0.2), (0.09, 0.02, 0.06), bevel=0.0, rot=(0, rng.uniform(0, 3), 0))
    return K.grass_ground(TH, rng, {'turf': 'g_turf', 'turf_hi': 'g_turf_hi', 'soil': 'g_soil', 'soil_dark': 'g_soil_dark', 'rock': 'g_rock'}, extra=confetti)


def clear():
    TH.clear()


if __name__ == '__main__':
    K.preview(TH, build, build_ground)
