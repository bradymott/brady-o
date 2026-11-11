# Ecuador 2-3 "Booby Dash" (theme ec_islas): the lava coast of the Galápagos as a Fiesta Toon diorama.
#   L0  ecIslands (base 330, #5a5a66)  hazy volcanic islands on the horizon: soft faceted cones, a pale surf line
#   L1  ecSea     (base 370, #2a8ad8)  the open sea from the horizon down: bands of blue, wave crests, glints, a few
#                                      far sea stacks with surf; flat colour, so nothing reads as ground
#   The horizon sits HZ above both ground lines (the floor of 2-3 covers the rows under the painter's bases), so the
#   islands and the sea show above the lava coast.
#   ground                             black lava rock (basalt): a grey cap with a pale edge over rounded basalt blocks
# Contract, conventions and the shared toolkit: see ec_equator.py.
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import ec_equator as K
from ec_equator import Builder, P, TAU, GP, GROUND_DEPTH, CAP_H

MODULE = 'ec_islas'
LAYERS = ['L0', 'L1']
BASES = {'L0': 330, 'L1': 370}
SKY = ['#3ab8f0', '#9ae4ff', '#fff4d8']
PALETTE = {
    'islas_isle': '#6a7080', 'islas_isle2': '#7a8292', 'islas_isle_top': '#7a9878', 'islas_surf': '#e8f4ff', 'islas_haze': '#8a94a8',
    'islas_sea': '#2a8ad8', 'islas_sea2': '#2478c4', 'islas_sea3': '#1e68ae', 'islas_crest': '#e8f8ff', 'islas_glint': '#ffffff',
    'islas_stack': '#3a3a46', 'islas_stack2': '#4a4a58',
    'islas_g_body': '#24242c', 'islas_g_rock': '#3e3e4a', 'islas_g_rock2': '#4a4a58', 'islas_g_cap': '#3a3a44', 'islas_g_cap_hi': '#7a7a88',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
HZ0, HZ1 = 3.0, 4.2          # the horizon above L0's and L1's ground lines (L1 is drawn 35 px higher by the engine)


def build_L0(rng):
    L = 'L0'
    K.fill_below(TH, L, 'islas_haze', top=HZ0 - 0.6, depth=5.0, y=4.0)
    B = Builder('L0_isles', L, TH)
    x = rng.uniform(0, 3)
    while x < P:
        w, h = rng.uniform(4.0, 9.0), rng.uniform(1.2, 3.6)
        prof = [(w / 2, -1.2), (w * 0.42, h * 0.3), (w * 0.26, h * 0.75), (w * 0.12, h * 0.97), (0.0, h)]
        role = rng.choice(('islas_isle', 'islas_isle2'))
        for dx in K.wraps(x, w / 2):
            B.lathe(role, prof, rng.choice((6, 7, 8)), at=(x + dx, rng.uniform(1.0, 3.0), HZ0), yscale=0.3, phase=rng.uniform(0, TAU))
            if h > 2.2:
                B.lathe('islas_isle_top', [(w * 0.27, h * 0.72), (w * 0.12, h * 0.97), (0.0, h + 0.03)], 7, at=(x + dx, 0.6, HZ0), yscale=0.3)
            B.box('islas_surf', (x + dx, 0.0, HZ0 - 0.05), (w * 0.85, 0.3, 0.12), bevel=0.04)
        x += w + rng.uniform(2.5, 7.0)
    ob = B.done(period=None); ob['outline'] = 0.4


def build_L1(rng):
    L = 'L1'
    S = Builder('L1_sea', L, TH)
    for k, (top, d, role) in enumerate(((HZ1, 1.6, 'islas_sea'), (HZ1 - 1.6, 1.8, 'islas_sea2'), (HZ1 - 3.4, 4.6, 'islas_sea3'))):
        S.box(role, (P / 2, 3.0 + k * 0.01, top - d / 2), (P + 2 * K.OVER, 1.0, d), bevel=0.0)
    ob = S.done(period=None); ob['outline'] = 0.0
    C = Builder('L1_crests', L, TH)
    for i in range(46):
        x, z = rng.uniform(0, P), HZ1 - rng.uniform(0.25, 3.8)
        w = rng.uniform(0.5, 1.6) * (1.0 - 0.15 * ((HZ1 - z) / 3.8))
        for dx in K.wraps(x, w / 2):
            C.box('islas_crest' if i % 3 else 'islas_glint', (x + dx, 2.0, z), (w, 0.1, 0.07), bevel=0.0)
    ob = C.done(period=None); ob['outline'] = 0.0
    St = Builder('L1_stacks', L, TH)
    for x in K.jittered(rng, 3, 0.3):
        h, w = rng.uniform(1.0, 1.9), rng.uniform(0.7, 1.2)
        for dx in K.wraps(x, w):
            St.lathe(rng.choice(('islas_stack', 'islas_stack2')), [(w, -0.4), (w * 0.8, h * 0.6), (w * 0.5, h), (0.0, h * 1.05)], 6, at=(x + dx, 1.2, HZ1 - 0.6), yscale=0.45, phase=rng.uniform(0, TAU))
            St.box('islas_crest', (x + dx, 0.6, HZ1 - 0.65), (w * 2.4, 0.2, 0.14), bevel=0.05)
    ob = St.done(period=None); ob['outline'] = 0.6


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    """Black lava rock: a grey cap band with a pale edge along z = 0, rounded basalt blocks in a near-black body,
    one or two per 32-px tile (nothing crosses a tile edge)."""
    rng = random.Random(seed)
    L = TH.GROUND
    c = TH.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_body', L, TH).box('islas_g_body', (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_blocks', L, TH)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in K.cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.12, top=(CAP_H if row == 0 else 0.0), jitter=0.3):
                if rng.random() < 0.15:
                    continue
                B.rbox(rng.choice(('islas_g_rock', 'islas_g_rock2', 'islas_g_rock')), (xc, -0.12, zc), (w * rng.uniform(0.82, 1.0), 0.4, h * rng.uniform(0.8, 1.0)), bevel=0.12, segments=2)
    B.done(period=None)
    B = Builder('ground_cap', L, TH)
    B.box('islas_g_cap', (GP / 2, 0.1, -0.03 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box('islas_g_cap_hi', (GP / 2, 0.06, -0.06), (GP + 0.6, 0.95, 0.08), bevel=0.0)
    for col in range(8):
        x0, x1 = K.tile_span(col, 0.12)
        for k in range(2):
            B.sphere('islas_g_cap', (rng.uniform(x0 + 0.1, x1 - 0.1), 0.05, -0.03 - CAP_H), 0.14, scale=(1.4, 0.8, 0.6), subdiv=1)
    B.done(period=None)
    return c


def clear():
    TH.clear()
