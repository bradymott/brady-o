# France 7-4 "The Iron Tower" (theme fr_tower): the parallax background for the tower climb, as a Fiesta Toon diorama.
# Original art: the city seen from high on the tower in daylight, a sea of pale limestone blocks and blue-grey zinc
# roofs with chimney pots, tree-lined avenues and a far horizon of green hills, and puffy toon clouds drifting past.
#
#   L0  frFacades (base 450, #e8dcc4)   the roofscape from above: rows of house blocks with mansard roofs that shrink
#                                        and pale toward the horizon, avenue trees, green hills on the skyline
#   L1  clouds    (base 260, #ffffff)   loose clusters of cel-shaded cumulus with flat bellies, gaps between them
#   ground        metal: riveted iron plates under a safety band (fr_morning.iron_ground)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_kit as K
from fr_kit import Builder, P, TAU, OVER, PPM
import fr_morning as FM

MODULE = 'fr_tower'
LAYERS = ['L0', 'L1']
BASES = {'L0': 450, 'L1': 260}
SKY = ['#4a90e8', '#a8d0ff', '#f0f8ff']

PALETTE = {
    # L0 roofscape: three depth rows, each paler / bluer than the one in front
    'stone_0': '#e2dccc', 'roof_0': '#a8b4c6', 'win_0': '#b4bece', 'chim_0': '#cca48c',
    'stone_1': '#e0dcd2', 'roof_1': '#b4bece', 'win_1': '#c2cad8', 'chim_1': '#d0b2a0',
    'stone_2': '#dedcd8', 'roof_2': '#c0c8d6', 'win_2': '#cad0dc', 'chim_2': '#d4bcb0',
    'hill': '#a8c4b8', 'hill_far': '#bcd2d0', 'tree': '#6aa45a', 'tree_dark': '#5a9450',
    # L1 clouds
    'cloud': '#f4f9ff', 'cloud_shade': '#e2eefa',
    # ground (metal, the tower's brown iron)
    'g_dark': '#3a2a20', 'g_cap': '#8a6a4a', 'g_cap_hi': '#c89a6a', 'g_chevron': '#2a1e16',
    'g_plate_a': '#6a5040', 'g_plate_b': '#5e4638', 'g_rivet': '#a8805a',
}
TH = FM.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)

def block_row(L, name, rng, z0, y, scale, d):
    """One row of house blocks seen from above and in front: a stone body, a mansard roof band, a strip of windows,
    chimneys; d is the depth index (0 front .. 2 far)."""
    B = Builder(name, L, TH)
    x = rng.uniform(-0.8, -0.2)
    end = x + P
    while x < end - 0.3:
        w = min(rng.uniform(1.6, 3.2) * scale, end - x)
        if end - x - w < 1.0 * scale:
            w = end - x
        h = rng.uniform(1.2, 2.0) * scale
        top = z0 + h
        B.box(f'stone_{d}', (x + w / 2, y, (z0 - 2 + top) / 2), (w - 0.04 * scale, 1.0, top - z0 + 2), bevel=0.0)
        rh = 0.55 * scale
        B.slab(f'roof_{d}', [(x, top), (x + w, top), (x + w - 0.25 * scale, top + rh), (x + 0.25 * scale, top + rh)], 1.0, at=(0, y - 0.05, 0))
        n = max(1, int(w / (0.45 * scale)))
        for k in range(n):
            wx = x + (k + 0.5) * w / n
            B.box(f'win_{d}', (wx, y - 0.06, top - 0.42 * scale), (0.2 * scale, 0.04, 0.32 * scale), bevel=0.0)
        if rng.random() < 0.8:
            cx = x + w * rng.uniform(0.2, 0.8)
            B.box(f'chim_{d}', (cx, y + 0.1, top + rh + 0.12 * scale), (0.26 * scale, 0.3, 0.3 * scale), bevel=0.0)
        x += w
    for ob in [B.done()] + [o for o in TH.COLL[L].objects if o.name.startswith(name + '.')]:
        ob["outline"] = 0.45     # the far city: a thin ink line only, it stays behind the girders

def build_L0(rng):
    L = 'L0'
    # far green hills on the horizon
    K.ridge_slab(TH, L, 'L0_hills_far', K.periodic_fn(rng, 6.4, 7.6, 3), 'hill_far', y=5.5, zb=0.0)
    K.ridge_slab(TH, L, 'L0_hills', K.periodic_fn(rng, 5.6, 6.6, 4), 'hill', y=5.0, zb=0.0)
    # three rows of blocks, far (small, high) to near (bigger, low): a city seen from above
    block_row(L, 'L0_row2', random.Random(rng.random()), 3.9, 4.0, 0.55, 2)
    block_row(L, 'L0_row1', random.Random(rng.random()), 2.2, 2.5, 0.75, 1)
    # avenue trees between the near rows
    B = Builder('L0_trees', L, TH)
    for x in K.jittered(rng, 26, jitter=0.25):
        r = rng.uniform(0.35, 0.5)
        for dx in K.wraps(x, r):
            B.sphere('tree' if rng.random() < 0.6 else 'tree_dark', (x + dx, 1.8, 2.25), r, scale=(1.2, 0.6, 0.8), subdiv=1)
    B.done(period=None)
    block_row(L, 'L0_row0', random.Random(rng.random()), 0.0, 1.0, 1.0, 0)

def cloud(B, x, z, s, rng):
    """A cumulus: a flat-bottomed cluster of spheres, a big one in the middle, smaller ones on the shoulders."""
    parts = [(0.0, 0.55, 1.0), (-0.95, 0.25, 0.72), (0.95, 0.3, 0.78), (-1.7, 0.1, 0.5), (1.75, 0.12, 0.55), (0.4, 0.95, 0.62), (-0.45, 0.85, 0.6)]
    for dx, dz, r in parts:
        if rng.random() < 0.15 and abs(dx) > 1.5:
            continue
        for wx in K.wraps(x + dx * s, r * s * 1.2):
            B.sphere('cloud', (x + dx * s + wx, 0.0, z + dz * s), r * s, scale=(1.2, 0.7, 0.9), subdiv=2)
    for wx in K.wraps(x, 2.0 * s):
        B.box('cloud_shade', (x + wx, -0.1, z - 0.05 * s), (3.6 * s, 0.6, 0.35 * s), bevel=0.1 * s)

def build_L1(rng):
    L = 'L1'
    B = Builder('L1_clouds', L, TH)
    for k, x in enumerate(K.jittered(rng, 5, jitter=0.2)):
        cloud(B, x, rng.uniform(2.2, 5.0), rng.uniform(0.8, 1.2), rng)
    ob = B.done(period=None)
    ob['outline'] = 0.0          # soft sky clouds: no ink, so they never read as cloud platforms

def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    return FM.iron_ground(TH, random.Random(seed), {'dark': 'g_dark', 'cap': 'g_cap', 'cap_hi': 'g_cap_hi', 'chevron': 'g_chevron',
                                                   'plate_a': 'g_plate_a', 'plate_b': 'g_plate_b', 'rivet': 'g_rivet'})

def clear():
    TH.clear()

if __name__ == '__main__':
    FM.preview(TH, build, build_ground)
