# Spain (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) N `es_pintxos`: "Pintxos Bar" (6-2, MINI: tiny Brady
# on a giant bar counter). Not wired into the game yet; its key matches this atlas's name. Original art, no brands.
#   L0  (base 280, f 0.05): the bar's back wall at giant scale: blue-and-white tiled wall, wooden shelves of plain
#       bottles and jars, cured hams hanging from a rail, a blank chalkboard with doodled squiggles
#   L1  (base 360, f 0.2):  the far end of the counter: plates of pintxos (bread slices with toppings on toothpicks),
#       a glass display case, a bowl of olives, a stack of small plates, a salt shaker and a fat pepper pot
#   ground: the counter top as the engine's 'marble' style: a pale marble edge over dark varnished wood panels
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import es_tomatina as K
from es_tomatina import Builder, P, TAU, OVER

MODULE = 'es_pintxos'
LAYERS = ['L0', 'L1']
BASES = {'L0': 280, 'L1': 360}
SKY = ['#e8c89a', '#f4dcb4', '#fff0d8']          # warm interior light (the theme's sky gradient)
PALETTE = {
    'tile_w': '#f4f0e6', 'tile_b': '#7a9ed4', 'tile_b2': '#8ab0e0', 'wall_dk': '#c8b896', 'shelf': '#7a4a2a', 'shelf2': '#5a3420',
    'bottle_g': '#3a7a4a', 'bottle_b': '#3a6aa0', 'bottle_a': '#c88a2a', 'jar': '#e8e0c8', 'jar_lid': '#c84a3a', 'label': '#f4ecd8',
    'ham': '#a8463a', 'ham2': '#c8705a', 'ham_hoof': '#3a2a22', 'rail': '#4a4a52', 'board': '#2e3a34', 'chalk': '#e8f0e8', 'frame': '#7a4a2a',
    'bread': '#e8b870', 'bread2': '#d89a50', 'pick': '#e8d8a8', 'pepper_r': '#d83a2a', 'egg': '#fff4d8', 'yolk': '#ffc030', 'anchovy': '#7a8a98',
    'olive': '#6a8a3a', 'olive2': '#4a6a2a', 'ham_s': '#c85a5a', 'cheese': '#f4d870', 'plate': '#fbfbf6', 'plate_rim': '#2a5aa8',
    'glass': '#cfe6ee', 'glass_rim': '#9abccc', 'bowl': '#c8603a', 'salt': '#f4f4f4', 'cap': '#b8b8c0', 'pepperpot': '#6a4a3a',
    'fill': '#c8b896',
    'g_cap': '#ece6dc', 'g_cap_hi': '#ffffff', 'g_seam': '#5a3a24', 'g_slab': '#7a4a2a', 'g_slab2': '#6a3e22', 'g_mortar': '#4a2c18', 'g_vein': '#9a6a42',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
TOP = 280 / 28.1 + 0.5


def build_L0(rng):
    """Everything here is giant (Brady is tiny on the counter): big calm wall tiles, one shelf of huge bottles and
    jars, three cured hams, a chalkboard."""
    L = 'L0'
    B = Builder('L0_wall', L, TH)
    B.box('tile_w', (P / 2, 3.0, (TOP - 3.0) / 2), (P + 2 * OVER, 0.4, TOP + 3.0), bevel=0.0)
    s = 2.6
    for i in range(int(P / s) + 1):
        for j in range(int((TOP + 2.0) / s)):
            if (i + j) % 2 == 0:
                x, z = (i + 0.5) * s, -2.0 + (j + 0.5) * s
                B.box('tile_b2' if (i * 3 + j) % 5 == 0 else 'tile_b', (x, 2.75, z), (s * 0.3, 0.05, s * 0.3), bevel=0.0, rot=(0, math.pi / 4, 0))
    zs = 4.6
    B.box('shelf', (P / 2, 2.0, zs), (P + 2 * OVER, 1.6, 0.4), bevel=0.0)
    B.box('shelf2', (P / 2, 1.18, zs - 0.25), (P + 2 * OVER, 0.04, 0.16), bevel=0.0)
    x = 0.6
    while x < P - 1.2:
        if rng.random() < 0.65:
            role = rng.choice(('bottle_g', 'bottle_b', 'bottle_a'))
            h = rng.uniform(3.6, 4.6)
            B.lathe(role, [(0.6, 0.0), (0.6, h * 0.6), (0.2, h * 0.8), (0.2, h)], 10, at=(x + 0.6, 1.8, zs + 0.2), cap_top=True, cap_bottom=True)
            B.box('label', (x + 0.6, 1.18, zs + 0.2 + h * 0.3), (0.9, 0.04, h * 0.2), bevel=0.0)
            x += 1.4
        else:
            B.lathe('jar', [(0.8, 0.0), (0.85, 1.7), (0.65, 2.0)], 12, at=(x + 0.9, 1.8, zs + 0.2), cap_top=True, cap_bottom=True)
            B.lathe('jar_lid', [(0.7, 2.0), (0.7, 2.3)], 12, at=(x + 0.9, 1.8, zs + 0.2), cap_top=True, cap_bottom=True)
            x += 2.0
        x += rng.uniform(0.2, 0.8)
    # a blank chalkboard with squiggles (no words)
    bx = 12.0
    B.box('frame', (bx, 1.9, 1.9), (6.0, 0.1, 3.4), bevel=0.0)
    B.box('board', (bx, 1.84, 1.9), (5.5, 0.06, 2.9), bevel=0.0)
    for r in range(4):
        z = 2.9 - r * 0.62
        pts = [(bx - 2.2 + 0.45 * k, z + 0.1 * math.sin(k * 2.1 + r)) for k in range(int(rng.uniform(5, 10)))]
        for p0, p1 in zip(pts, pts[1:]):
            B.rod('chalk', (p0[0], 1.78, p0[1]), (p1[0], 1.78, p1[1]), 0.05, segs=3)
    B.done()


def pintxo(B, x, y, z, rng, s=3.0):
    """A pintxo: a bread slice with a topping and a toothpick through it (s = giant scale)."""
    B.box('bread', (x, y, z + 0.12 * s), (0.9 * s, 0.5 * s, 0.24 * s), bevel=0.06 * s)
    kind = rng.randrange(4)
    if kind == 0:
        B.sphere('egg', (x, y - 0.05 * s, z + 0.32 * s), 0.3 * s, scale=(1.2, 0.8, 0.45), subdiv=2)
        B.sphere('yolk', (x, y - 0.2 * s, z + 0.38 * s), 0.12 * s, scale=(1, 0.6, 0.5), subdiv=1)
    elif kind == 1:
        B.box('ham_s', (x, y, z + 0.3 * s), (0.8 * s, 0.45 * s, 0.1 * s), bevel=0.04 * s, rot=(0, 0.1, 0))
        B.sphere('olive', (x + 0.1 * s, y - 0.1 * s, z + 0.45 * s), 0.13 * s, subdiv=2)
    elif kind == 2:
        B.box('cheese', (x, y, z + 0.32 * s), (0.7 * s, 0.45 * s, 0.16 * s), bevel=0.02 * s)
        B.box('pepper_r', (x, y - 0.05 * s, z + 0.45 * s), (0.5 * s, 0.35 * s, 0.08 * s), bevel=0.03 * s)
    else:
        for k in range(2):
            B.sphere('anchovy', (x - 0.15 * s + k * 0.3 * s, y, z + 0.3 * s), 0.14 * s, scale=(2.0, 0.6, 0.5), subdiv=2)
    B.rod('pick', (x + 0.05 * s, y - 0.1 * s, z + 0.1 * s), (x + 0.15 * s, y - 0.1 * s, z + 1.1 * s), 0.03 * s, segs=5)


def build_L1(rng):
    L = 'L1'
    K.fill_below(TH, L, 'fill', top=0.2, depth=3.0, y=3.0)
    B = Builder('L1_counter', L, TH)
    # two giant plates of pintxos
    for x in (5.0, 24.0):
        B.lathe('plate', [(3.6, 0.0), (4.2, 0.3), (4.2, 0.4)], 20, at=(x, 1.0, 0.0), cap_top=True, cap_bottom=True)
        B.lathe('plate_rim', [(4.2, 0.3), (4.25, 0.42)], 20, at=(x, 1.0, 0.0), cap_top=True)
        for k in range(2):
            pintxo(B, x - 1.5 + k * 3.0, 0.2, 0.4, rng)
    # olives in a terracotta bowl
    ox = 14.5
    B.lathe('bowl', [(1.4, 0.0), (2.4, 1.3), (2.5, 1.4)], 14, at=(ox, 1.0, 0.0), cap_bottom=True)
    for k in range(5):
        B.sphere('olive' if k % 2 else 'olive2', (ox - 1.4 + k * 0.7, 0.0, 1.45 + (k % 2) * 0.25), 0.5, scale=(1.25, 1, 1), subdiv=2)
    # a towering salt shaker
    sx = 32.5
    B.lathe('salt', [(1.3, 0.0), (1.4, 5.6), (1.1, 6.6)], 14, at=(sx, 1.4, 0.0), cap_top=True, cap_bottom=True)
    B.lathe('cap', [(1.15, 6.5), (1.0, 7.6), (0.0, 7.9)], 14, at=(sx, 1.4, 0.0), cap_bottom=True)
    B.done()


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return K.marble_ground(TH, random.Random(seed), {'cap': 'g_cap', 'cap_hi': 'g_cap_hi', 'seam': 'g_seam', 'slab': 'g_slab',
                                                     'slab2': 'g_slab2', 'mortar': 'g_mortar', 'vein': 'g_vein'})


def clear():
    TH.clear()


if __name__ == '__main__':
    K.preview(TH, build, build_ground)
