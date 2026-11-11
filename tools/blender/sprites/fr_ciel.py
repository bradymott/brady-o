# France overhaul theme fr_ciel (7-7 "Montgolfière Skies", level overhaul §8: N fr_ciel): original toon art for a sky
# full of hot-air balloons over the countryside, the iron lattice tower a plain DAYLIGHT silhouette on the horizon.
# Suggested theme entry: sky ['#3a8ae8', '#a8d8ff', '#fff4e8'], ground 'cloud', layers
#   [{kind:'frHorizon', color:'#a8b8d0', base:330, f:0.02, blur:true}, {kind:'clouds', color:'#ffffff', base:260, f:0.1}].
#   L0  frHorizon (base 330, f 0.02, blur): a far patchwork of fields and hedges, a low hazy city with the lattice
#                 tower as a plain unlit silhouette, all pale and unlined
#   L1  clouds    (base 260, f 0.1): soft cumulus banks (no ink) with a few far hot-air balloons of our own (striped,
#                 checked and dotted envelopes, wicker baskets) drifting among them
#   ground cloud: a puffy white cloud cap over soft blue-lilac cloud billows
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_kit as K
from fr_kit import Builder, P, TAU, OVER, PPM, GP, GROUND_DEPTH, wraps, ridge_slab, periodic_fn, fill_below, cell_rects, tile_span, CAP_H
import fr_morning as FM

MODULE = 'fr_ciel'
LAYERS = ['L0', 'L1']
BASES = {'L0': 330, 'L1': 260}
SKY = ['#3a8ae8', '#a8d8ff', '#fff4e8']
FIELDS = ('field1', 'field2', 'field3', 'field4')
PALETTE = {
    'haze': '#b8cce0', 'field1': '#a8c898', 'field2': '#c4d4a0', 'field3': '#b8c4a8', 'field4': '#d0cca0', 'hedge': '#8aa888',
    'city': '#b0bccc', 'iron': '#a4b2c8', 'deck': '#aebcd0',
    'cloud': '#ffffff', 'cloud2': '#eef4fc', 'cloud3': '#dce8f6',
    'env1': '#e8384f', 'env2': '#ffd23a', 'env3': '#2a7ad8', 'env4': '#3ab87a', 'env5': '#fff4e8', 'env6': '#8a5ac8',
    'basket': '#b88a4a', 'basket2': '#8a6232', 'rope': '#6a5a48',
    'g_body': '#d4def0', 'g_body2': '#c4d0e8', 'g_cap': '#ffffff', 'g_cap_hi': '#ffffff', 'g_puff': '#eaf0fa',
}
TH = FM.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)


def build_L0(rng):
    L = 'L0'
    fill_below(TH, L, 'haze', top=0.4, depth=3.0, y=5.5)['outline'] = 0
    B = Builder('L0_fields', L, TH)
    x = -OVER
    while x < P + OVER:
        w = rng.uniform(1.2, 3.0)
        for row in range(3):
            z = -0.3 - row * 0.5
            B.box(rng.choice(FIELDS), (x + w / 2, 2.0 + 0.1 * row, z), (w, 0.1, 0.48), bevel=0.0)
        B.box('hedge', (x + w, 1.9, -0.8), (0.06, 0.1, 1.5), bevel=0.0)
        x += w
    B.done(period=None)['outline'] = 0
    ridge_slab(TH, L, 'L0_city', lambda x: 0.35 + 0.25 * abs(math.sin(TAU * 7 * x / P)) + 0.15 * abs(math.sin(TAU * 13 * x / P)), 'city', y=3.0, depth=0.5, zb=-0.4)['outline'] = 0
    FM.lattice_tower(TH, L, 'L0_tower', P * 0.7, 120 / PPM, {'iron': 'iron', 'deck': 'deck'}, y=2.6, detail=False)
    for ob in TH.COLL[L].objects:
        if ob.name.startswith('L0_tower'):
            ob['outline'] = 0          # far and hazy: a plain daylight silhouette, no ink


def balloon(B, x, z, s, roles, pattern, rng, y=0.6):
    """A hot-air balloon: an envelope of gores (striped, checked or dotted), a skirt, ropes and a wicker basket."""
    R = 1.0 * s
    prof = [(0.0, -1.0 * R), (0.35 * R, -0.95 * R), (0.75 * R, -0.6 * R), (0.98 * R, -0.1 * R), (1.0 * R, 0.25 * R), (0.85 * R, 0.65 * R), (0.5 * R, 0.92 * R), (0.0, 1.0 * R)]
    B.lathe(roles[0], prof, 16, at=(x, y, z), smooth=True)
    if pattern == 'stripes':
        for k in range(4):
            a = -0.75 + 0.5 * k
            B.slab(roles[1], [(math.sin(a) * 0.98 * R - 0.12 * s, -0.55 * R), (math.sin(a) * 0.98 * R + 0.12 * s, -0.55 * R), (math.sin(a) * 0.55 * R + 0.06 * s, 0.85 * R), (math.sin(a) * 0.55 * R - 0.06 * s, 0.85 * R)], 0.02, at=(x, y - R * 0.95, z))
    elif pattern == 'band':
        B.lathe(roles[1], [(0.99 * R, -0.25 * R), (1.01 * R, 0.0), (1.0 * R, 0.25 * R)], 16, at=(x, y, z), cap_top=False, smooth=True)
    else:
        for k in range(7):
            a = rng.uniform(-1.0, 1.0)
            zz = rng.uniform(-0.5, 0.7) * R
            B.sphere(roles[1], (x + math.sin(a) * 0.8 * R * math.sqrt(max(0.1, 1 - (zz / R) ** 2)), y - R * 0.95, z + zz), 0.12 * s, scale=(1, 0.2, 1), subdiv=1)
    B.lathe(roles[1], [(0.35 * R, -1.05 * R), (0.28 * R, -0.95 * R)], 12, at=(x, y, z), cap_top=False)
    bz = z - 1.55 * R
    for sx in (-1, 1):
        B.rod('rope', (x + sx * 0.32 * R, y - 0.3, z - 1.0 * R), (x + sx * 0.2 * R, y - 0.3, bz + 0.18 * s), 0.015 * s, segs=3)
    B.box('basket', (x, y, bz), (0.42 * s, 0.4 * s, 0.32 * s), bevel=0.04)
    B.box('basket2', (x, y - 0.21 * s, bz + 0.1 * s), (0.44 * s, 0.02, 0.05 * s), bevel=0.0)


def build_L1(rng):
    L = 'L1'
    C = Builder('L1_clouds', L, TH)
    x = rng.uniform(0, 3)
    while x < P:
        w = rng.uniform(3.0, 6.0)
        z = rng.uniform(-1.5, 2.5)
        for k in range(int(w / 0.8) + 2):
            cx = x + k * 0.8 * rng.uniform(0.8, 1.1)
            r = rng.uniform(0.6, 1.1) * (1.0 - 0.5 * abs(k / (w / 0.8 + 1) - 0.5))
            for dx in wraps(cx, r * 1.4):
                C.sphere(('cloud', 'cloud2')[k % 2], (cx + dx, 1.8 + 0.1 * (k % 3), z + r * 0.5), r, scale=(1.4, 0.6, 0.85), subdiv=2)
                C.sphere('cloud3', (cx + dx, 1.9, z + 0.1), r * 0.9, scale=(1.5, 0.6, 0.4), subdiv=2)
        x += w + rng.uniform(2.0, 4.5)
    C.done(period=None)['outline'] = 0
    B = Builder('L1_balloons', L, TH)
    pats = [('env1', 'env5', 'stripes'), ('env3', 'env2', 'band'), ('env4', 'env5', 'dots'), ('env6', 'env2', 'stripes'), ('env2', 'env1', 'band')]
    for k, (a, b, pat) in enumerate(pats):
        x = (k + rng.uniform(0.2, 0.8)) * P / len(pats)
        s = rng.uniform(0.6, 1.0)
        for dx in wraps(x, 1.2 * s):
            balloon(B, x + dx, rng.uniform(4.0, 8.5), s, (a, b), pat, rng)
    B.done(period=None)['outline'] = 0.5


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    """Cloud floor: soft billows (two per tile row, inside the tile) on a pale body under a puffy white cap."""
    rng = random.Random(seed)
    L = TH.GROUND
    c = TH.new_collection(L)
    D = GROUND_DEPTH
    Builder('ground_backing', L, TH).box('g_body', (GP / 2, 0.5, -D / 2), (GP + 2 * OVER, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_billows', L, TH)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(1,), cols=(1, 2), gap=0.16, top=(CAP_H if row == 0 else 0.0), jitter=0.3):
                if rng.random() < 0.5:
                    B.sphere('g_body2' if rng.random() < 0.6 else 'g_puff', (xc, -0.1, zc), min(w, h) * 0.45, scale=(w / min(w, h), 0.6, h / min(w, h)), subdiv=2)
    B.done(period=None)['outline'] = 0.5
    B = Builder('ground_cap', L, TH)
    B.box('g_cap', (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 2 * OVER, 0.9, CAP_H), bevel=0.0)
    for col in range(8):
        x0, x1 = tile_span(col, 0.12)
        for k in range(2):
            xc = x0 + (k + 0.5) * (x1 - x0) / 2
            B.sphere('g_cap', (xc, 0.0, -0.06 - CAP_H), 0.2, scale=(1.4, 0.8, 0.7), subdiv=2)
    B.done(period=None)
    return c


def clear():
    TH.clear()
