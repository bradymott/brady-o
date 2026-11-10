# Ecuador 2-5 "Ice Fort of Cotopaxi" (theme ec_cotopaxi): the parallax background as a Fiesta Toon diorama, one
# Collection per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: the volcano Cotopaxi
# standing over a snowy pine forest.
#
#   L0  ecCotopaxi (base 330, #8a9ac0)  the perfect cone with its snow cap and a wisp of steam, foothills, and the
#                                       Ice Fort far off at its foot (towers, crenellated wall, keep, pennants)
#   L1  pines      (base 365, #4a6a8a)  a dense snowy forest: tiered pines with snow collars, round trees with
#                                       snow caps, snow mounds and a dusting along the base
#   ground                              snow: a snow cap (with icicles) over packed ice blocks
#
# Contract, conventions and the shared toolkit: see ec_equator.py.
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/ec_cotopaxi.py [--seed N]
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import ec_equator as K
from ec_equator import Builder, P, TAU, GP, GROUND_DEPTH, T, CELL_MARGIN, CAP_H

MODULE = 'ec_cotopaxi'
LAYERS = ['L0', 'L1']
BASES = {'L0': 330, 'L1': 365}
SKY = ['#3a5a9a', '#9ac0f0', '#e8f4ff']
PALETTE = {
    # L0 Cotopaxi (#8a9ac0)
    'cotopaxi_cone': '#8a9ac0', 'cotopaxi_cone_snow': '#ffffff', 'cotopaxi_steam': '#f4f8ff', 'cotopaxi_foot': '#7a8ab0',
    # the distant Ice Fort (pale ice blues, a red pennant)
    'cotopaxi_fort': '#b8d4ec', 'cotopaxi_fort_hi': '#d4e8f8', 'cotopaxi_fort_line': '#94b4d4', 'cotopaxi_fort_gate': '#5a7aa0',
    'cotopaxi_fort_roof': '#e8f4ff', 'cotopaxi_flag': '#e8323a',
    # L1 pines (#4a6a8a)
    'cotopaxi_pine': '#4a6a8a', 'cotopaxi_pine2': '#3f5c7a', 'cotopaxi_trunk': '#2e3e54', 'cotopaxi_pine_snow': '#f0f8ff',
    'cotopaxi_drift': '#e4f0fc', 'cotopaxi_forest_fill': '#425f7e',
    # ground (snow)
    'cotopaxi_g_snow': '#f0f8ff', 'cotopaxi_g_snow_hi': '#ffffff', 'cotopaxi_g_icicle': '#dcf4ff',
    'cotopaxi_g_mortar': '#8ab0d0', 'cotopaxi_g_ice': '#6a8aaa', 'cotopaxi_g_ice_deep': '#3a5a7a', 'cotopaxi_g_ice_light': '#8aa8c8',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)

def ice_fort(L, x0, y, z0):
    """The Ice Fort itself, far off at the volcano's foot: a crenellated wall of ice blocks between two round towers
    with cone roofs and pennants, a gate arch, and a tall keep behind."""
    B = Builder('L0_fort', L, TH)
    W, H = 5.6, 1.7
    B.box('cotopaxi_fort', (x0 + W / 2, y, z0 + H / 2), (W, 0.8, H), bevel=0.06)
    for k in range(9):                                            # crenels
        B.box('cotopaxi_fort_hi', (x0 + 0.3 + k * (W - 0.6) / 8, y - 0.05, z0 + H + 0.18), (0.34, 0.7, 0.36), bevel=0.04)
    for k in range(4):                                            # block courses
        B.box('cotopaxi_fort_line', (x0 + W / 2, y - 0.42, z0 + 0.4 + k * 0.38), (W - 0.2, 0.04, 0.05), bevel=0.0)
    B.arch('cotopaxi_fort_gate', (x0 + W / 2, y - 0.45, z0), 1.0, 1.1, 0.1)
    for tx, th in ((x0, 2.9), (x0 + W, 2.6)):
        B.lathe('cotopaxi_fort', [(0.75, -0.3), (0.72, th)], 10, at=(tx, y, z0), yscale=0.8, cap_top=True)
        B.lathe('cotopaxi_fort_roof', [(0.95, th), (0.0, th + 1.3)], 10, at=(tx, y, z0), yscale=0.8, cap_top=False)
        B.rod('cotopaxi_trunk', (tx, y, z0 + th + 1.2), (tx, y, z0 + th + 2.0), 0.04, segs=4)
        B.slab('cotopaxi_flag', [(tx, z0 + th + 1.95), (tx + 0.7, z0 + th + 1.8), (tx, z0 + th + 1.6)], 0.04, at=(0, y - 0.1, 0))
    kx = x0 + W * 0.62
    B.box('cotopaxi_fort_hi', (kx, y + 0.9, z0 + 1.9), (1.6, 0.8, 3.8), bevel=0.06)
    B.lathe('cotopaxi_fort_roof', [(1.05, 3.8), (0.0, 5.1)], 4, at=(kx, y + 0.9, z0), yscale=0.6, cap_top=False, phase=math.pi / 4)
    B.done(period=None)
    B = Builder('L0_fort_snow', L, TH)                            # snow banked against the foot of the walls
    for k in range(7):
        B.sphere('cotopaxi_steam', (x0 - 0.6 + k * 1.15, y - 0.6, z0 - 0.1), 0.65, scale=(1.3, 0.6, 0.45), subdiv=1)
    B.done(period=None)

def build_L0(rng):
    K.volcano_cone(TH, 'L0', rng, {'rock': 'cotopaxi_cone', 'snow': 'cotopaxi_cone_snow', 'steam': 'cotopaxi_steam', 'foot': 'cotopaxi_foot'}, h=8.6, R=11.2)
    ice_fort('L0', P * 0.08, 2.2, 0.35)

def pine(B, x, y, h, w, role, ph):
    """A tiered pine: four stacked cones (6 sides) on a short trunk, each tier with a zig-zag snow collar."""
    B.rod('cotopaxi_trunk', (x, y, -0.3), (x, y, h * 0.3), 0.07 * (1 + w), segs=5)
    for i in range(4):
        zt = h - i * h * 0.2
        tw = w * (0.35 + i * 0.22)
        zb = zt - h * 0.32
        B.lathe(role, [(tw, zb), (0.0, zt)], 6, at=(x, y, 0), yscale=0.5, phase=ph)
        snow = [(tw * 0.5 + 0.03, zt - h * 0.32 * 0.5), (0.0, zt + 0.03)]
        B.lathe('cotopaxi_pine_snow', snow, 6, at=(x, y, 0), yscale=0.5, phase=ph, jag=lambda k: (-0.1 * h * 0.3 if k % 2 else 0.0))

def round_tree(B, x, y, h, w, role, rng):
    """A round-crowned tree: an ellipsoid crown on a trunk with a snow cap sitting on top."""
    B.rod('cotopaxi_trunk', (x, y, -0.3), (x, y, h * 0.55), 0.09, segs=5)
    B.sphere(role, (x, y, h * 0.62), 1.0, scale=(w * 0.6, w * 0.4, h * 0.38), subdiv=2)
    B.sphere('cotopaxi_pine_snow', (x, y, h * 0.62 + h * 0.38 * 0.55), 1.0, scale=(w * 0.5, w * 0.36, h * 0.16), subdiv=2)

def build_L1(rng):
    """The snowy forest: the painter's dense row of pines and round trees, staggered in depth, snow mounds and
    a dusting of snow along the ground line."""
    L = 'L1'
    K.fill_below(TH, L, 'cotopaxi_forest_fill', top=0.1, depth=2.0, y=3.0)
    B = Builder('L1_trees', L, TH)
    x, i = rng.uniform(0, 0.6), 0
    while x < P:
        h = rng.uniform(2.5, 4.6)
        w = h * rng.uniform(0.3, 0.45)
        y = rng.choice([0.0, 1.4, 2.8])
        role = 'cotopaxi_pine' if i % 3 else 'cotopaxi_pine2'
        for dx in K.wraps(x, w):
            if rng.random() < 0.3:
                round_tree(B, x + dx, y, h, w, role, rng)
            else:
                pine(B, x + dx, y, h, w, role, rng.uniform(0, TAU))
        x += w * rng.uniform(0.7, 1.5)
        i += 1
    B.done(period=None)
    B = Builder('L1_drifts', L, TH)
    B.box('cotopaxi_drift', (P / 2, -0.5, 0.0), (P + 2, 2.0, 0.16), bevel=0.0)
    for x in K.jittered(rng, 12, 0.4):
        for dx in K.wraps(x, 1.2):
            B.sphere('cotopaxi_drift', (x + dx, -0.8, -0.1), rng.uniform(0.6, 1.1), scale=(1.4, 0.8, 0.45), subdiv=1)
    B.done(period=None)

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    """Snow floor: a snow cap band (pale rim, lumpy underside, an icicle or two per tile) over packed ice: rounded
    ice blocks in three blues on a lighter ice mortar, tile-aligned (two rows of up to two blocks per tile)."""
    L = TH.GROUND
    c = TH.new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    Builder('ground_backing', L, TH).box('cotopaxi_g_mortar', (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_ice', L, TH)
    roles = ['cotopaxi_g_ice', 'cotopaxi_g_ice', 'cotopaxi_g_ice_deep', 'cotopaxi_g_ice_light']
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in K.cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.12, top=(CAP_H if row == 0 else 0.0), jitter=0.3):
                if w < 0.22 or h < 0.22:
                    continue
                B.rbox(rng.choice(roles), (xc, -0.1, zc), (w, 0.4, h), bevel=0.12, segments=2)
    B.done(period=None)
    B = Builder('ground_cap', L, TH)
    B.box('cotopaxi_g_snow', (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box('cotopaxi_g_snow_hi', (GP / 2, 0.08, -0.09), (GP + 0.6, 0.95, 0.06), bevel=0.0)
    for col in range(8):
        x0, x1 = K.tile_span(col, 0.12)
        for k in range(2):
            lx = rng.uniform(x0 + 0.1, x1 - 0.1)
            B.sphere('cotopaxi_g_snow', (lx, 0.05, -0.06 - CAP_H), 0.16, scale=(1.3, 0.8, 0.7), subdiv=1)
        if rng.random() < 0.6:
            ix = rng.uniform(x0 + 0.12, x1 - 0.12)
            B.lathe('cotopaxi_g_icicle', [(0.11, -0.06), (0.0, rng.uniform(0.34, 0.5))], 5, at=(ix, -0.2, -0.06 - CAP_H), rot=(math.pi, 0, 0))
    B.done(period=None)
    return c

def clear():
    TH.clear()

if __name__ == '__main__':
    K.preview(TH, build, build_ground)
