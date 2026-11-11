# France overhaul theme fr_baie (7-3 "Mont-Saint-Michel Tides", level overhaul §8: N fr_baie): original toon art for
# the tidal flats of a great bay at low tide. The island abbey is ONLY a far, plain, unlined silhouette (no detail).
# Suggested theme entry: sky ['#5a9ad8', '#b8dcf4', '#fff4e4'], ground 'sand', liquid 'sea', layers
#   [{kind:'frMount', color:'#a8b4c8', base:290, f:0.02, blur:true}, {kind:'frFlats', color:'#d8c8a0', base:335, f:0.08}].
#   L0  frMount (base 290, f 0.02, blur): a far grey-blue line of coast and, once per period, the island mount as one
#               plain pale silhouette (a rocky cone with stepped roofs and a pointed top), over a hazy sea band
#   L1  frFlats (base 335, f 0.08): wet sand flats shining with winding tide channels and pools, rows of wooden mussel
#               posts, a beached rowing boat, a tethered marker buoy; low and calm behind the play
#   ground sand: a pale dry-sand cap over darker wet sand with little shells and pebbles
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_kit as K
from fr_kit import Builder, P, TAU, OVER, PPM, wraps, ridge_slab, periodic_fn, fill_below
import fr_morning as FM

MODULE = 'fr_baie'
LAYERS = ['L0', 'L1']
BASES = {'L0': 290, 'L1': 335}
SKY = ['#5a9ad8', '#b8dcf4', '#fff4e4']
PALETTE = {
    'coast': '#a8b8cc', 'mount': '#a4b0c6', 'sea_far': '#8ab4d8', 'sea_hi': '#c8e0f0',
    'sand': '#d8c8a0', 'sand2': '#ccbb90', 'wet': '#b8b498', 'chan': '#9ccce4', 'chan_hi': '#d4ecf8',
    'post': '#6a5440', 'post2': '#54402e', 'mussel': '#3a3a4a', 'boat': '#2a6ab8', 'boat2': '#f2ece0', 'boat_in': '#8a6a4a',
    'buoy': '#e8423a', 'buoy2': '#f4f0e8', 'rope': '#8a7a62',
    'turf': '#e8d8a8', 'turf_hi': '#e8d8a8', 'soil': '#bca878', 'soil_dark': '#aa9668', 'rock': '#f4eee0',
}
TH = FM.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)


def build_L0(rng):
    L = 'L0'
    fill_below(TH, L, 'sea_far', top=0.6, depth=3.0, y=4.0)['outline'] = 0
    ridge_slab(TH, L, 'L0_coast', periodic_fn(rng, 0.5, 1.1, 3), 'coast', y=3.6, depth=0.5, zb=-1.0)['outline'] = 0
    B = Builder('L0_mount', L, TH)
    x = P * 0.62
    for dx in wraps(x, 3.2):
        cx = x + dx
        B.lathe('mount', [(3.0, 0.0), (2.4, 0.9), (1.6, 1.7), (1.1, 2.6), (0.7, 3.3), (0.0, 3.5)], 10, at=(cx, 3.2, 0.0), yscale=0.3)
        for k, (ox, w, h) in enumerate(((-1.2, 0.8, 1.6), (-0.5, 0.9, 2.6), (0.3, 1.0, 3.2), (1.0, 0.8, 2.2))):
            B.box('mount', (cx + ox, 3.0, h / 2 + 0.3), (w, 0.3, h), bevel=0.0)
            B.slab('mount', [(-w / 2, 0.0), (w / 2, 0.0), (0.0, 0.35)], 0.3, at=(cx + ox, 2.85, h + 0.3))
        B.slab('mount', [(-0.35, 0.0), (0.35, 0.0), (0.0, 2.2)], 0.3, at=(cx + 0.3, 2.84, 3.8))
    B.done(period=None)['outline'] = 0
    S = Builder('L0_shine', L, TH)
    S.box('sea_hi', (P / 2, 3.4, 0.55), (P + 2 * OVER, 0.05, 0.06), bevel=0.0)
    S.done(period=None)['outline'] = 0


def channel(B, x0, x1, z, rng, role, w=0.16):
    n = 10
    pts = []
    for k in range(n + 1):
        u = k / n
        pts.append((x0 + (x1 - x0) * u, z + 0.12 * math.sin(u * TAU * rng.uniform(0.8, 1.6) + rng.uniform(0, TAU))))
    for (xa, za), (xb, zb) in zip(pts, pts[1:]):
        B.slab(role, [(xa, za - w / 2), (xb, zb - w / 2), (xb, zb + w / 2), (xa, za + w / 2)], 0.02, at=(0, 1.0, 0))


def build_L1(rng):
    L = 'L1'
    ridge_slab(TH, L, 'L1_flats', lambda x: 0.12 + 0.05 * math.sin(TAU * 3 * x / P), 'sand', y=2.0, depth=1.0, zb=-4.0)['outline'] = 0.4
    D = Builder('L1_channels', L, TH)
    for k in range(7):
        z = -0.3 - k * 0.45
        x0 = rng.uniform(-2.0, P * 0.5)
        x1 = x0 + rng.uniform(6.0, 14.0)
        channel(D, x0, x1, z, rng, ('chan', 'wet')[k % 2], w=0.14 + 0.04 * (k % 3))
        if x1 > P:
            channel(D, x0 - P, x1 - P, z, rng, ('chan', 'wet')[k % 2], w=0.14 + 0.04 * (k % 3))
    for k in range(10):
        x = rng.uniform(0, P)
        for dx in wraps(x, 0.8):
            D.sphere('chan_hi', (x + dx, 0.95, rng.uniform(-2.5, -0.2)), 0.35, scale=(1.8, 0.1, 0.25), subdiv=1)
    D.done(period=None)['outline'] = 0
    B = Builder('L1_props', L, TH)
    # rows of wooden mussel posts marching out over the flats
    for r in range(2):
        x = P * (0.12 + 0.45 * r)
        for k in range(9):
            px = x + k * 0.55
            for dx in wraps(px, 0.2):
                B.rod('post' if k % 2 else 'post2', (px + dx, 1.4, -0.1), (px + dx, 1.4, 0.9 + 0.1 * (k % 3)), 0.07, segs=5)
                B.sphere('mussel', (px + dx, 1.3, 0.25), 0.1, scale=(1.0, 0.8, 1.4), subdiv=1)
    # a beached rowing boat, tilted on its keel
    bx = P * 0.38
    for dx in wraps(bx, 1.5):
        B.slab('boat', [(-1.3, 0.0), (1.2, 0.0), (1.5, 0.55), (-1.5, 0.45)], 0.8, at=(bx + dx, 1.2, 0.05), rot=(0, 0.12, 0))
        B.slab('boat2', [(-1.48, 0.42), (1.48, 0.52), (1.5, 0.6), (-1.5, 0.5)], 0.82, at=(bx + dx, 1.18, 0.05), rot=(0, 0.12, 0))
        B.box('boat_in', (bx + dx - 0.2, 1.0, 0.62), (0.15, 0.6, 0.06), bevel=0.0)
    # a marker buoy on a rope
    ux = P * 0.85
    for dx in wraps(ux, 0.5):
        B.lathe('buoy', [(0.3, 0.0), (0.32, 0.3), (0.16, 0.6), (0.0, 0.62)], 10, at=(ux + dx, 1.3, 0.0), smooth=True)
        B.box('buoy2', (ux + dx, 1.0, 0.32), (0.62, 0.05, 0.12), bevel=0.0)
        B.rod('rope', (ux + dx + 0.3, 1.3, 0.05), (ux + dx + 1.4, 1.3, 0.0), 0.02, segs=3)
    B.done(period=None)


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return K.grass_ground(TH, random.Random(seed), {'turf': 'turf', 'turf_hi': 'turf_hi', 'soil': 'soil', 'soil_dark': 'soil_dark', 'rock': 'rock'})


def clear():
    TH.clear()
