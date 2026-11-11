# France overhaul theme fr_place (7-1 "Paris Morning Rounds", the hub square; level overhaul §8: N fr_place): original
# toon art for a Paris square in the morning, built with the France toolkit of fr_morning.py.
# Suggested theme entry: sky ['#6aa8e8', '#c8e0ff', '#ffe8e0'], ground 'frCobble', layers
#   [{kind:'frTower', color:'#9aa8c0', base:330, f:0.03, blur:true}, {kind:'frFacades', color:'#f0e4cc', base:350, f:0.1},
#    {kind:'frSquare', color:'#5a9a4a', base:385, f:0.3}].
#   L0  frTower   (base 330, f 0.03, blur): the lattice tower far away, a plain daylight silhouette (never lit)
#   L1  frFacades (base 350, f 0.1): the square's ring of cream Haussmann houses with zinc mansards (paler and
#       lower than 7-1's boulevard, so the square feels open)
#   L2  frSquare  (base 385, f 0.3): the square itself, on a terrace 1.7 m up so it clears the floor: round plane trees, a merry-go-round with a striped top,
#       a tiered fountain, benches, Paris lanterns and a Morris column; rounded tops, nothing that reads as a ledge
#   ground frCobble: chunky grey cobblestones under a pale kerb cap (as 7-1)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_kit as K
from fr_kit import Builder, P, TAU, OVER, PPM, wraps
import fr_morning as FM

MODULE = 'fr_place'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 330, 'L1': 350, 'L2': 385}
SKY = ['#6aa8e8', '#c8e0ff', '#ffe8e0']
PALETTE = {
    'iron': '#a6b2c8', 'deck': '#b0bcd0',
    'stone': '#f2e8d6', 'stone2': '#f6eee0', 'stone3': '#ece2ce', 'stone_light': '#faf6ec', 'stone_dark': '#dcd0bc',
    'roof': '#98a6ba', 'roof_dark': '#8a98ae', 'window': '#94a2bc', 'window_hi': '#d4dce8', 'dormer_win': '#c4d0e4',
    'dormer_glow': '#ffd890', 'win_glow': '#ffd890', 'win_dark': '#1a2034', 'chimney': '#c4927a', 'pot': '#d8a08a',
    'balcony': '#727488', 'door': '#7a6a5a', 'shop_win': '#94a2bc', 'flower_a': '#ff8aa0', 'flower_b': '#ffe070',
    'flower_c': '#ffb070', 'leaf': '#5a9a5a',
    'tree': '#5a9a4a', 'tree_light': '#74b45c', 'tree_dark': '#4a8240', 'trunk': '#9a8a72', 'trunk_patch': '#d0c4aa',
    'bench': '#2a5a42', 'lamp_iron': '#2a3a30', 'lamp_glass': '#f4ecd0', 'column': '#2a4a3a', 'poster': '#f4e8d0',
    'red': '#c8283a', 'blue': '#2a6ac8', 'gold': '#d8a848', 'cream': '#fff4e8',
    'carousel_top': '#e8384f', 'carousel_top2': '#fff4e8', 'carousel_pole': '#d8a848', 'carousel_base': '#3a6ac8',
    'horse': '#fff4e8', 'horse2': '#ffd0a8', 'fountain': '#d8d0c0', 'fountain2': '#c4bba8', 'water': '#8ac8f0', 'water2': '#c8ecff',
    'g_mortar': '#a0a0ae', 'g_cap': '#c8ccd8', 'g_cap_hi': '#eef0f8', 'g_stone_a': '#8e94a6', 'g_stone_b': '#7e8496', 'g_stone_c': '#9aa0b2',
}
TH = FM.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
LIFT = 1.7
FACADE_ROLES = dict(FM.FACADE_ROLES)


def build_L0(rng):
    FM.lattice_tower(TH, 'L0', 'L0_tower', P * 620 / 1024, 290 / PPM, {'iron': 'iron', 'deck': 'deck'}, y=2.0)


def build_L1(rng):
    FM.facade_row(TH, 'L1', rng, FACADE_ROLES, floors=(3, 4), flowers=True, detail=False)


def plane_tree(B, x, s, rng):
    B.rod('trunk', (x, 0.6, 0.0), (x, 0.6, 2.4 * s), 0.16 * s, segs=6, r2=0.11 * s)
    for k in range(3):
        B.box('trunk_patch', (x + rng.uniform(-0.06, 0.06), 0.42, rng.uniform(0.4, 2.0) * s), (0.12 * s, 0.04, 0.2 * s), bevel=0.02)
    for k in range(9):
        a = rng.uniform(0, TAU)
        r = rng.uniform(0.0, 1.0) ** 0.7
        role = ('tree', 'tree_light', 'tree_dark')[k % 3]
        B.sphere(role, (x + math.cos(a) * 1.1 * s * r, 0.2 - 0.1 * (k % 2), 3.0 * s + math.sin(a) * 0.7 * s * r), rng.uniform(0.6, 0.85) * s, scale=(1.15, 0.7, 0.85), subdiv=2)


def bench(B, x):
    B.box('bench', (x, -0.3, 0.45), (1.4, 0.4, 0.07), bevel=0.02)
    B.box('bench', (x, -0.12, 0.78), (1.4, 0.05, 0.36), bevel=0.02)
    for sx in (-0.6, 0.6):
        B.rod('lamp_iron', (x + sx, -0.3, 0.0), (x + sx, -0.3, 0.45), 0.035, segs=4)


def carousel(B, x, rng):
    """An original merry-go-round: a blue drum base, gold poles with cream horses, a striped red-and-cream tent top
    with a pennant."""
    B.lathe('carousel_base', [(2.1, 0.0), (2.1, 0.45), (1.9, 0.5), (0.0, 0.5)], 18, at=(x, 0.4, 0.0), yscale=0.45, smooth=True)
    for k in range(5):
        px = x - 1.6 + 0.8 * k
        B.rod('carousel_pole', (px, -0.2, 0.5), (px, -0.2, 2.6), 0.04, segs=5)
        hz = 1.2 + 0.25 * math.sin(k * 1.7)
        role = 'horse' if k % 2 == 0 else 'horse2'
        B.sphere(role, (px, -0.26, hz), 0.22, scale=(1.5, 0.5, 0.75), subdiv=2)
        B.rod(role, (px + 0.22, -0.26, hz + 0.08), (px + 0.36, -0.26, hz + 0.36), 0.08, segs=5)
        B.slab(role, [(0.0, -0.06), (0.24, -0.1), (0.26, 0.0), (0.06, 0.1), (-0.04, 0.06)], 0.1, at=(px + 0.34, -0.31, hz + 0.4))
        B.slab('red', [(-0.02, 0.0), (0.12, -0.1), (0.1, 0.06)], 0.08, at=(px + 0.28, -0.33, hz + 0.44))
        for lx, ang in ((-0.18, 0.5), (0.2, -0.5)):
            B.rod(role, (px + lx, -0.26, hz - 0.08), (px + lx + 0.14 * ang, -0.26, hz - 0.34), 0.045, segs=4)
    B.lathe('carousel_top', [(2.3, 0.0), (2.3, 0.3), (0.0, 0.3)], 18, at=(x, 0.4, 2.6), yscale=0.45, cap_bottom=True)
    for k in range(8):
        role = 'carousel_top' if k % 2 == 0 else 'carousel_top2'
        a0 = -2.2 + 0.55 * k
        B.slab(role, [(a0, 0.0), (a0 + 0.55, 0.0), (0.0, 1.3)], 0.05, at=(x, -0.6, 2.9))
    B.rod('carousel_pole', (x, -0.5, 4.2), (x, -0.5, 4.8), 0.04, segs=4)
    B.slab('red', [(0.0, 0.0), (0.45, 0.12), (0.0, 0.24)], 0.03, at=(x, -0.52, 4.55))


def fountain(B, x):
    B.lathe('fountain', [(1.5, 0.0), (1.5, 0.5), (1.3, 0.55), (0.3, 0.55), (0.3, 1.4), (0.9, 1.5), (0.95, 1.65), (0.2, 1.7), (0.2, 2.3), (0.45, 2.45), (0.0, 2.55)], 16, at=(x, 0.3, 0.0), yscale=0.5, smooth=False)
    B.lathe('water', [(1.35, 0.42), (1.35, 0.5), (0.0, 0.5)], 16, at=(x, 0.28, 0.0), yscale=0.5)
    for sx in (-1, 1):
        B.chain('water2', [(x + sx * 0.3, -0.1, 2.5), (x + sx * 0.7, -0.1, 2.3), (x + sx * 0.92, -0.1, 1.75)], 0.05)
        B.chain('water2', [(x + sx * 0.8, -0.1, 1.6), (x + sx * 1.15, -0.1, 1.2), (x + sx * 1.3, -0.1, 0.6)], 0.05)


def build_L2(rng):
    L = 'L2'
    B = Builder('L2_square', L, TH)
    items = ['tree', 'bench', 'lamp', 'carousel', 'lamp', 'tree', 'column', 'tree', 'fountain', 'bench', 'tree', 'lamp']
    x = 1.0
    for it in items:
        if it == 'tree':
            s = rng.uniform(0.9, 1.1)
            for dx in wraps(x + 1.0, 1.4 * s):
                plane_tree(B, x + 1.0 + dx, s, random.Random(int(x * 13)))
            x += 2.6
        elif it == 'bench':
            for dx in wraps(x + 0.7, 0.8):
                bench(B, x + 0.7 + dx)
            x += 1.8
        elif it == 'carousel':
            for dx in wraps(x + 2.2, 2.4):
                carousel(B, x + 2.2 + dx, rng)
            x += 5.0
        elif it == 'fountain':
            for dx in wraps(x + 1.5, 1.6):
                fountain(B, x + 1.5 + dx)
            x += 3.4
        elif it == 'lamp':
            FM.street_lamp(TH, L, f'L2_lamp_{int(x * 10)}', x + 0.4, rng)
            x += 1.2
        else:
            FM.morris_column(TH, L, f'L2_col_{int(x * 10)}', x + 0.7, rng)
            x += 1.8
    B.done(period=None)
    # the square sits on a terrace LIFT m up, so its furniture clears the floor at the level camera
    for ob in TH.COLL[L].objects:
        ob.location.z += LIFT


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    build_L2(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return FM.cobble_ground(TH, random.Random(seed), {'mortar': 'g_mortar', 'cap': 'g_cap', 'cap_hi': 'g_cap_hi', 'stone_a': 'g_stone_a', 'stone_b': 'g_stone_b', 'stone_c': 'g_stone_c'})


def clear():
    TH.clear()
