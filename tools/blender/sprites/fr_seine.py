# France 7-2 "Seine Chase" (theme fr_seine): the parallax background as a Fiesta Toon diorama, one Collection per
# parallax layer. Original art: a sunny river quay. Far away the plain lattice tower in daylight, then a row of pale
# limestone houses on the far bank, the river with two stone arch bridges and a moored barge, and in front the quay
# parapet with plane trees and the green book boxes of the riverside booksellers.
#
#   L0  frTower   (base 300, #a8b4cc, blur)   the lattice tower at 300/1024 of the period, daylight, plain
#   L1  frFacades (base 330, #f2e8d4)         a hazier, lower row of limestone houses on the far bank (3-4 storeys)
#   L2  frSeine   (base 325, #d8ccb0)         the river (z <= 0) with ripple strokes, the far quay wall, two stone
#                                              bridges (arches, a balustrade, unlit lamp posts), a moored barge
#   L3  frTrees   (base 385, #5a9a4a)         the near quay parapet with green book boxes and round plane trees
#   ground        frCobble (shared with fr_morning)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_kit as K
from fr_kit import Builder, P, TAU, OVER, PPM
import fr_morning as FM

MODULE = 'fr_seine'
LAYERS = ['L0', 'L1', 'L2', 'L3']
BASES = {'L0': 300, 'L1': 330, 'L2': 325, 'L3': 385}
SKY = ['#5a98e0', '#b8d8ff', '#fff0d8']

PALETTE = {
    'iron': '#a8b4cc', 'deck': '#b4bfd4',
    # far-bank facades: paler, hazier than fr_morning's so the river layer leads
    'stone': '#efe6d6', 'stone2': '#f4ecde', 'stone3': '#e8decc', 'stone_light': '#f8f2e8', 'stone_dark': '#d8ccb8',
    'roof': '#9eaabe', 'roof_dark': '#8e9ab0', 'window': '#8a98b4', 'window_hi': '#d0d8e6', 'dormer_win': '#c4d0e4',
    'dormer_glow': '#ffd890', 'win_glow': '#ffd890', 'win_dark': '#1a2034', 'chimney': '#c08c70', 'pot': '#d49c80',
    'balcony': '#6a6c7c', 'door': '#7a6a5a', 'shop_win': '#8a98b4', 'flower_a': '#ff8aa0', 'flower_b': '#ffe070',
    'flower_c': '#ffb070', 'leaf': '#5a9a5a',
    # the river
    'water': '#4a86c0', 'water_deep': '#3a6ea8', 'ripple': '#a8d4f4', 'ripple2': '#7ab4e4',
    'quay': '#d8ccb0', 'quay_dark': '#b8ac90', 'quay_top': '#ece2cc',
    'arch_shadow': '#7a8494', 'bridge': '#d8ccb0', 'bridge_dark': '#bcae90', 'bridge_light': '#ece4d0', 'baluster': '#e6dcc4',
    'lamp_iron': '#3a4a44', 'lamp_glass': '#e8e4d0',
    'hull': '#2a3a5a', 'hull_stripe': '#c8283a', 'cabin': '#f2e8d0', 'cabin_win': '#4a6a9a', 'deckwood': '#8a6a4a',
    'pot_red': '#c85a3a', 'geranium': '#ff5a6a', 'plant': '#3a8a3a',
    # the near quay
    'tree': '#5a9a4a', 'tree_light': '#74b45c', 'tree_dark': '#4a8240', 'trunk': '#8a7a62', 'trunk_patch': '#c8bca0',
    'parapet': '#a89c80', 'parapet_top': '#c4b89c', 'parapet_dark': '#8a7e66',
    'box': '#2a6a4a', 'box_lid': '#1e5a3e', 'book_a': '#c8a070', 'book_b': '#e8d8b0', 'book_c': '#b85a4a',
    # ground (frCobble)
    'g_mortar': '#a0a0ae', 'g_cap': '#c8ccd8', 'g_cap_hi': '#eef0f8', 'g_stone_a': '#8e94a6', 'g_stone_b': '#7e8496', 'g_stone_c': '#9aa0b2',
}
TH = FM.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
FACADE_ROLES = dict(FM.FACADE_ROLES)

def build_L0(rng):
    FM.lattice_tower(TH, 'L0', 'L0_tower', P * 300 / 1024, 270 / PPM, {'iron': 'iron', 'deck': 'deck'}, y=2.0)

def build_L1(rng):
    FM.facade_row(TH, 'L1', rng, FACADE_ROLES, floors=(3, 4), flowers=False, detail=False)

def stone_bridge(th, L, name, x0, span, n, deck_z, rng):
    """A stone bridge seen side-on: one slab whose bottom edge rises into n semicircular-ish arches between piers,
    a cornice, a balustrade of chunky balusters, unlit lamp posts over the piers."""
    B = Builder(name, L, th)
    pier = span * 0.1
    aw = (span - (n + 1) * pier) / n
    zb = -1.0
    rise = deck_z - 0.75
    pts = [(x0, zb)]
    x = x0
    for k in range(n):
        x += pier
        pts.append((x, zb))
        pts.append((x, 0.0))
        for i in range(1, 12):
            a = math.pi - math.pi * i / 12
            pts.append((x + aw / 2 + aw / 2 * math.cos(a), rise * math.sin(a)))
        pts.append((x + aw, 0.0))
        pts.append((x + aw, zb))
        x += aw
    pts.append((x0 + span, zb))
    pts.append((x0 + span, deck_z))
    pts.append((x0, deck_z))
    B.slab('bridge', pts, 1.4, at=(0, 0.0, 0))
    # voussoir ring and keystone on each arch, a pale cornice, the dark course under it
    x = x0
    for k in range(n):
        x += pier
        B.band_arch('bridge_light', (x + aw / 2, -0.03, 0.0), aw / 2, rise, 0.1, 0.06, segs=12)
        B.arch('arch_shadow', (x + aw / 2, 1.2, -0.9), aw - 0.02, rise + 0.9, 0.1, segs=12)
        B.box('bridge_light', (x + aw / 2, -0.06, rise + 0.08), (0.24, 0.06, 0.3), bevel=0.02)
        x += aw
    B.box('bridge_dark', (x0 + span / 2, -0.04, deck_z - 0.22), (span + 0.2, 0.08, 0.12), bevel=0.0)
    B.box('bridge_light', (x0 + span / 2, -0.06, deck_z - 0.06), (span + 0.4, 0.2, 0.18), bevel=0.02)
    # balustrade: a rail over chunky balusters
    nb = int(span / 0.42)
    for i in range(nb):
        bx = x0 + 0.2 + (span - 0.4) * i / (nb - 1)
        B.lathe('baluster', [(0.07, 0.0), (0.1, 0.12), (0.05, 0.28), (0.08, 0.42), (0.07, 0.5)], 6, at=(bx, 0.3, deck_z + 0.02), cap_top=True)
    B.box('bridge_light', (x0 + span / 2, 0.3, deck_z + 0.57), (span + 0.2, 0.34, 0.12), bevel=0.02)
    # lamp posts over the piers (never lit)
    x = x0
    for k in range(n + 1):
        lx = x + pier / 2
        B.box('bridge', (lx, 0.0, deck_z + 0.35), (pier * 0.9, 0.5, 0.7), bevel=0.02)
        B.rod('lamp_iron', (lx, 0.0, deck_z + 0.7), (lx, 0.0, deck_z + 2.2), 0.045, segs=6, r2=0.035)
        for sx in (-1, 1):
            B.rod('lamp_iron', (lx, 0.0, deck_z + 2.1), (lx + sx * 0.3, 0.0, deck_z + 2.3), 0.025, segs=4)
            B.box('lamp_glass', (lx + sx * 0.3, 0.0, deck_z + 2.48), (0.18, 0.18, 0.26), bevel=0.01)
            B.lathe('lamp_iron', [(0.15, 0.0), (0.02, 0.12)], 4, at=(lx + sx * 0.3, 0.0, deck_z + 2.61), phase=math.pi / 4, cap_bottom=True)
        x += pier + aw
    B.done()

def barge(th, L, name, x, rng, length=6.0):
    """A moored river barge: a long dark hull with a red stripe, a cream cabin with windows, potted geraniums."""
    B = Builder(name, L, th)
    hl = length
    B.slab('hull', [(x - hl / 2, -0.35), (x + hl / 2 - 0.2, -0.35), (x + hl / 2 + 0.35, 0.55), (x - hl / 2 - 0.15, 0.55)], 1.6, at=(0, -0.8, 0))
    B.box('hull_stripe', (x, -0.84, 0.36), (hl + 0.2, 0.06, 0.12), bevel=0.0)
    B.box('deckwood', (x, 0.0, 0.6), (hl + 0.1, 1.6, 0.1), bevel=0.01)
    cx = x - hl * 0.12
    B.box('cabin', (cx, 0.0, 1.05), (hl * 0.48, 1.3, 0.8), bevel=0.04)
    B.box('hull', (cx, 0.0, 1.5), (hl * 0.52, 1.4, 0.1), bevel=0.02)
    for k in range(4):
        B.box('cabin_win', (cx - hl * 0.18 + k * hl * 0.12, -0.67, 1.08), (0.36, 0.04, 0.34), bevel=0.0)
    for k in range(3):
        px = cx - hl * 0.15 + k * hl * 0.15
        B.lathe('pot_red', [(0.1, 0.0), (0.14, 0.2)], 8, at=(px, -0.2, 1.55), cap_top=True, cap_bottom=True)
        for q in range(3):
            B.sphere('geranium' if q != 1 else 'plant', (px + (q - 1) * 0.09, -0.2, 1.84 + 0.05 * (q == 1)), 0.09, subdiv=1)
    B.rod('hull', (x + hl * 0.32, 0.0, 0.6), (x + hl * 0.32, 0.0, 2.0), 0.04, segs=5)
    B.box('hull_stripe', (x + hl * 0.32 + 0.22, 0.0, 1.85), (0.4, 0.03, 0.24), bevel=0.0)
    B.done()

def build_L2(rng):
    L = 'L2'
    # the water and the far quay wall
    B = Builder('L2_water', L, TH)
    B.box('water', (P / 2, 3.0, -1.25), (P + 2 * OVER, 1.0, 2.5), bevel=0.0)
    B.box('quay', (P / 2, 4.2, 0.35), (P + 2 * OVER, 1.0, 0.9), bevel=0.0)
    B.box('quay_top', (P / 2, 4.0, 0.84), (P + 2 * OVER, 1.2, 0.12), bevel=0.0)
    B.box('quay_dark', (P / 2, 3.6, -0.05), (P + 2 * OVER, 0.2, 0.12), bevel=0.0)
    B.done(period=None)
    B = Builder('L2_ripples', L, TH)
    for i in range(34):
        x = rng.uniform(0, P); z = -rng.uniform(0.25, 2.2); w = rng.uniform(0.5, 1.4)
        role = 'ripple' if rng.random() < 0.55 else 'ripple2'
        for dx in K.wraps(x, w / 2):
            B.box(role, (x + dx, 2.4, z), (w, 0.05, 0.07), bevel=0.0)
    B.done(period=None)
    stone_bridge(TH, L, 'L2_bridge_a', P * 120 / 1024, 9.6, 3, 2.6, rng)
    stone_bridge(TH, L, 'L2_bridge_b', P * 640 / 1024, 9.0, 3, 2.4, rng)
    barge(TH, L, 'L2_barge', P * 520 / 1024, rng)

def plane_tree(B, x, h, rng):
    """A round-headed plane tree: a mottled trunk and a canopy of five overlapping spheres in three greens."""
    B.rod('trunk', (x, 0.4, -0.4), (x, 0.4, h * 0.6), 0.16, segs=7, r2=0.11)
    B.rod('trunk', (x, 0.4, h * 0.45), (x - 0.4, 0.4, h * 0.75), 0.07, segs=5)
    B.rod('trunk', (x, 0.4, h * 0.5), (x + 0.45, 0.4, h * 0.78), 0.07, segs=5)
    for dz in (0.6, 1.3):
        B.sphere('trunk_patch', (x + rng.uniform(-0.05, 0.05), 0.24, dz), 0.07, scale=(1.0, 0.5, 1.3), subdiv=1)
    R = rng.uniform(0.95, 1.15)
    cz = h * 0.8 + R * 0.5
    for dx, dz, r, role in ((0, 0.35, 1.0, 'tree'), (-0.75, 0, 0.78, 'tree_dark'), (0.78, -0.05, 0.8, 'tree'),
                            (-0.3, 0.75, 0.7, 'tree_light'), (0.4, 0.62, 0.62, 'tree_light')):
        B.sphere(role, (x + dx * R, 0.5 - 0.2 * (role == 'tree_light'), cz + dz * R), r * R, scale=(1.0, 0.7, 0.9), subdiv=2)

def book_box(B, x):
    """A green booksellers' box on four legs, its lid propped open over a row of books."""
    for sx in (-0.6, 0.6):
        B.rod('box_lid', (x + sx, -0.1, -0.3), (x + sx, -0.1, 0.75), 0.05, segs=5)
    B.box('box', (x, -0.1, 0.92), (1.5, 0.6, 0.42), bevel=0.03)
    for k in range(6):
        B.box(('book_a', 'book_b', 'book_c')[k % 3], (x - 0.55 + k * 0.22, -0.3, 1.22), (0.16, 0.3, 0.24 + 0.04 * (k % 2)), bevel=0.0)
    B.box('box_lid', (x, 0.18, 1.52), (1.5, 0.06, 0.62), bevel=0.02, rot=(0.25, 0, 0))

def build_L3(rng):
    """The near quay: a few plane trees with gaps between them so the bridges show, and book boxes on legs."""
    L = 'L3'
    B = Builder('L3_kerb', L, TH)
    B.box('parapet', (P / 2, 0.8, -0.1), (P + 2 * OVER, 1.0, 0.8), bevel=0.0)
    B.box('parapet_dark', (P / 2, 0.25, 0.26), (P + 2 * OVER, 0.1, 0.08), bevel=0.0)
    B.done(period=None)
    xs = K.jittered(rng, 8, jitter=0.15)
    B = Builder('L3_trees', L, TH)
    for i, x in enumerate(xs):
        for dx in K.wraps(x, 1.3):
            plane_tree(B, x + dx, rng.uniform(2.3, 2.8), random.Random(i))
    B.done(period=None)
    B = Builder('L3_boxes', L, TH)
    for i in range(len(xs)):
        a, b = xs[i], xs[(i + 1) % len(xs)] + (P if i == len(xs) - 1 else 0)
        if i % 2 != 1:
            continue
        x = (a + b) / 2
        for dx in K.wraps(x, 0.8):
            book_box(B, x + dx)
    B.done(period=None)

def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    build_L2(random.Random(rng.random()))
    build_L3(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    return FM.cobble_ground(TH, random.Random(seed), {'mortar': 'g_mortar', 'cap': 'g_cap', 'cap_hi': 'g_cap_hi', 'stone_a': 'g_stone_a', 'stone_b': 'g_stone_b', 'stone_c': 'g_stone_c'})

def clear():
    TH.clear()

if __name__ == '__main__':
    FM.preview(TH, build, build_ground)
