# Brazil 3-3 "Iguaçu Falls": the parallax background as a low-poly Fiesta Toon diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a great wall of waterfalls pouring over
# a jungle-topped cliff into mist.
#
#   L0  brFalls   a mossy basalt cliff (chamfered plates) from the lip at 7.5 m down past the floor, white water
#                 curtains over it (some in two tiers over a rock ledge with a splash), paler streaks in the water,
#                 the forest crown along the lip with a few taller trees, boulders and mist puffs at the foot,
#                 a small rainbow in the spray
#   L1  brPalms   the shared leaning palms (br_beach.palm_row) in deep jungle greens
#   ground        grass: a turf cap with hanging tufts over red jungle soil with clods and rust rocks
#
# The grass floor builder is shared with br_pantanal. Shares the kit of br_beach; same contract.
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/br_falls.py
import os, sys, math, random
import bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import br_beach as K
from br_beach import Builder, wraps, cell_rects, new_collection, palm_row, P, GP, GROUND_DEPTH, GROUND_COLL, T, PX, TAU

MODULE = 'br_falls'
LAYERS = ['L0', 'L1']                      # back to front: brFalls, brPalms
BASES = {'L0': 320, 'L1': 390}
SKY = ['#3a8ad8', '#9ad8ff', '#e8fff8']
LIP = 7.5                                  # the cliff lip (painter: curtains start 220 px above the ground line)

PALETTE = {
    'falls_rock': '#245c34', 'falls_rock_a': '#2a6a3a', 'falls_rock_b': '#20522e', 'falls_rock_c': '#184424', 'falls_moss': '#3e8a46',
    'falls_water': '#e4f2fc', 'falls_streak': '#ffffff', 'falls_streak2': '#a8d2ea', 'falls_lip': '#ffffff', 'falls_ledge': '#24563a', 'falls_ledge_moss': '#3e8a46', 'falls_splash': '#ffffff',
    'falls_crown': '#3a7a46', 'falls_crown2': '#4a8e52', 'falls_crown3': '#2e6a3c', 'falls_tree_trunk': '#4a3a2a',
    'falls_mist': '#eef8ff', 'falls_mist2': '#dcf0fa', 'falls_boulder': '#4a5a50', 'falls_boulder2': '#3a4a42',
    'falls_rb_red_glow': '#ff9a9a', 'falls_rb_yellow_glow': '#ffe8a0', 'falls_rb_green_glow': '#b0f0b8', 'falls_rb_blue_glow': '#a8d8ff',
    'falls_trunk': '#4a3a2a', 'falls_trunk_ring': '#5a4a36', 'falls_frond': '#1e6a3a', 'falls_frond2': '#2a7e46', 'falls_coconut': '#7a8a34',
    'falls_turf': '#3aa85a', 'falls_turf_hi': '#7ae08a', 'falls_soil': '#8a4a2a', 'falls_clod': '#5a2a1a', 'falls_clod2': '#6e3822', 'falls_stone': '#a85a3a',
}
K.register(PALETTE)
PALM_R = {'trunk': 'falls_trunk', 'ring': 'falls_trunk_ring', 'frond': 'falls_frond', 'frond2': 'falls_frond2', 'coconut': 'falls_coconut'}

# ----------------------------------------------------------------------------------------------- L0 the falls
def build_L0(rng):
    L = 'L0'
    DOWN = 16.4
    B = Builder('falls_cliff', L)
    B.box('falls_rock', (P / 2, 4.0, (LIP - DOWN) / 2), (P, 1.0, LIP + DOWN), bevel=0.0)
    # chamfered basalt plates over the face, mossier near the lip
    rows, cols = 6, 12
    rp, cp = (LIP + 3.0) / rows, P / cols
    for r in range(rows):
        off = rng.uniform(0, cp)
        for k in range(cols):
            xc = (off + k * cp + rng.uniform(-0.5, 0.5)) % P
            zc = LIP - (r + 0.5) * rp + rng.uniform(-0.4, 0.4)
            role = rng.choice(['falls_rock_a', 'falls_rock_b', 'falls_rock_c', 'falls_rock_a']) if r > 0 else rng.choice(['falls_moss', 'falls_rock_a'])
            w, h = rng.uniform(2.2, 3.8), rng.uniform(1.2, 2.2)
            for dx in wraps(xc, w / 2):
                B.box(role, (xc + dx, 3.2, zc), (w, 0.6, h), bevel=0.2, rot=(0, rng.uniform(-0.08, 0.08), 0))
    B.done(period=None)
    # the curtains: 30-70 px wide with 55-110 px of rock between, from the lip down; some break over a rock ledge
    # into two tiers with a splash; white and pale-blue streaks run down the front of each
    B = Builder('falls_water', L)
    x = rng.uniform(0.3, 1.5)
    while x < P:
        w = rng.uniform(30, 70) * PX
        tiers = rng.random() < 0.4
        for dx in wraps(x + w / 2, w / 2 + 0.6):
            cx = x + w / 2 + dx
            def streaks(xc, ww, ztop, zbot, y):
                n = max(2, int(ww / 0.3))
                for k in range(n):
                    sx = xc - ww * 0.44 + (k + 0.5) * ww * 0.88 / n
                    z0 = ztop - rng.uniform(0.3, 1.2); z1 = zbot + rng.uniform(0.0, 1.5)
                    B.box('falls_streak' if k % 2 else 'falls_streak2', (sx, y, (z0 + z1) / 2), (0.13, 0.04, z0 - z1), bevel=0.0)
            if tiers:
                zl = rng.uniform(3.2, 4.6)
                B.box('falls_water', (cx, 1.6, (LIP + zl) / 2), (w, 0.5, LIP - zl), bevel=0.0)
                streaks(cx, w, LIP, zl, 1.33)
                B.rbox('falls_ledge', (cx + 0.1, 1.1, zl - 0.35), (w + 1.1, 1.0, 0.7), bevel=0.2, segments=2)
                B.box('falls_ledge_moss', (cx + 0.1, 1.08, zl - 0.04), (w + 1.0, 1.0, 0.1), bevel=0.0)
                sh = rng.uniform(-0.3, 0.3)
                B.box('falls_water', (cx + sh, 1.0, (zl - 0.6 - DOWN) / 2), (w * 0.92, 0.5, zl - 0.6 + DOWN), bevel=0.0)
                streaks(cx + sh, w * 0.92, zl - 0.6, -1.0, 0.73)
                for k in range(4):
                    B.sphere('falls_splash', (cx - w * 0.5 + k * w * 0.33, 0.6, zl - 0.15 + 0.08 * (k % 2)), rng.uniform(0.26, 0.38), scale=(1.3, 0.7, 0.8), subdiv=1)
            else:
                B.box('falls_water', (cx, 1.6, (LIP - DOWN) / 2), (w, 0.5, LIP + DOWN), bevel=0.0)
                streaks(cx, w, LIP, -1.0, 1.33)
            B.rbox('falls_lip', (cx, 1.4, LIP + 0.08), (w + 0.2, 0.9, 0.55), bevel=0.22, segments=2)
        x += w + rng.uniform(55, 110) * PX
    B.done(period=None)
    # the forest crown along the lip (painter: bubbles at base-220), with a few taller trees breaking the line
    B = Builder('falls_crown', L)
    x = 0.0
    while x < P:
        r = rng.uniform(0.6, 1.0)
        for dx in wraps(x, r * 1.3):
            B.sphere(rng.choice(['falls_crown', 'falls_crown2', 'falls_crown3']), (x + dx, rng.uniform(1.0, 2.6), LIP + r * 0.55), r, scale=(1.3, 0.7, 0.85), subdiv=1)
        x += rng.uniform(0.8, 1.3)
    for k in range(5):
        tx = rng.uniform(0, P); th = rng.uniform(1.4, 2.2)
        for dx in wraps(tx, 1.2):
            B.rod('falls_tree_trunk', (tx + dx, 1.5, LIP + 0.3), (tx + dx, 1.5, LIP + th), 0.12, segs=5)
            B.sphere(rng.choice(['falls_crown', 'falls_crown2']), (tx + dx, 1.5, LIP + th + 0.3), 0.9, scale=(1.1, 0.7, 0.75), subdiv=1)
            B.sphere('falls_crown2', (tx + dx + 0.3, 1.4, LIP + th + 0.75), 0.5, scale=(1.0, 0.7, 0.7), subdiv=1)
    B.done(period=None)
    # the foot: boulders in the plunge pool, then mist puffs in front of everything
    B = Builder('falls_foot', L)
    for k in range(9):
        bx = rng.uniform(0, P); bw = rng.uniform(0.7, 1.4)
        for dx in wraps(bx, bw):
            B.rbox(rng.choice(['falls_boulder', 'falls_boulder2']), (bx + dx, 0.6, rng.uniform(-0.1, 0.35)), (bw, 0.7, rng.uniform(0.5, 0.9)), bevel=0.2, segments=2, rot=(0, rng.uniform(-0.2, 0.2), 0))
    x = rng.uniform(0, 0.8)
    while x < P:
        r = rng.uniform(0.5, 0.9)
        for dx in wraps(x, r * 1.5):
            B.sphere(rng.choice(['falls_mist', 'falls_mist', 'falls_mist2']), (x + dx, rng.uniform(0.0, 0.4), rng.uniform(-0.25, 0.25)), r, scale=(1.5, 0.6, 0.7), subdiv=2)
        x += rng.uniform(0.9, 1.5)
    B.done(period=None)
    # a small rainbow standing in the spray
    B = Builder('falls_rainbow', L)
    rx, R = P * 0.3, 3.4
    for j, role in enumerate(['falls_rb_red_glow', 'falls_rb_yellow_glow', 'falls_rb_green_glow', 'falls_rb_blue_glow']):
        ro, ri = R - j * 0.14, R - (j + 1) * 0.14 + 0.02
        pts = [(ro * math.cos(math.pi * k / 16), ro * math.sin(math.pi * k / 16)) for k in range(17)]
        pts += [(ri * math.cos(math.pi * k / 16), ri * math.sin(math.pi * k / 16)) for k in range(16, -1, -1)]
        B.slab(role, [(-x, z) for x, z in pts], 0.03, at=(rx, 0.5, 0.4))
    B.done()

def build_L1(rng):
    palm_row('L1', PALM_R, rng, h_range=(3.4, 5.0), pitch=(3.4, 6.2))

# ----------------------------------------------------------------------------------------------- scene api
def clear():
    K.clear_collections(LAYERS)

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: K.COLL[name] for name in LAYERS}

# ----------------------------------------------------------------------------------------------- ground (grass, shared)
def grass_cap(B, turf, turf_hi, cap_h=9 * PX, tufts=6):
    """A turf cap along z = 0: a green band with a lighter top strip and tufts hanging from its lower edge,
    periodic per 32-px tile so shuffled tiles still join."""
    B.box(turf, (GP / 2, 0.25, -cap_h / 2), (GP, 0.9, cap_h), bevel=0.0)
    B.box(turf_hi, (GP / 2, 0.23, -2.5 * PX), (GP, 0.92, 2 * PX), bevel=0.0)
    for col in range(8):
        pts = [(col * T + T, -cap_h + 0.02), (col * T, -cap_h + 0.02)]
        for i in range(tufts):
            x0 = col * T + (i + 0.5) * T / tufts
            d = 3.5 * PX if i % 3 == 1 else 2.0 * PX
            pts += [(x0 - T / tufts * 0.45, -cap_h + 0.02), (x0, -cap_h - d)]
        B.slab(turf, pts, 0.5, at=(0.0, -0.45, 0.0))

def grass_ground(seed, R):
    """Grass: a turf cap with hanging tufts along the walking surface (z = 0), then dark soil clods and a few rocks
    set in lighter soil, 3 tiles deep, tile-aligned (see cell_rects). R maps 'turf', 'turf_hi', 'soil', 'clod',
    'clod2', 'stone' to material roles. Periodic in x with period GP (not P), collection 'ground'."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', L)
    B.box(R['soil'], (GP / 2, 0.5, -D / 2), (GP, 1.0, D), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L)
    grass_cap(B, R['turf'], R['turf_hi'])
    B.done(period=None)
    B = Builder('ground_clods', L)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.11, top=(13 * PX if row == 0 else 0.0), jitter=0.3):
                role = R['stone'] if rng.random() < 0.22 else rng.choice([R['clod'], R['clod'], R['clod2']])
                B.rbox(role, (xc, -0.15 + rng.uniform(-0.03, 0.03), zc), (w, 0.36, h), bevel=0.11, segments=2, rot=(0, rng.uniform(-0.05, 0.05), 0))
    B.done(period=None)
    return c

GRASS_R = {'turf': 'falls_turf', 'turf_hi': 'falls_turf_hi', 'soil': 'falls_soil', 'clod': 'falls_clod', 'clod2': 'falls_clod2', 'stone': 'falls_stone'}

def build_ground(seed=1):
    return grass_ground(seed, GRASS_R)

if __name__ == '__main__':
    seed = 1
    for i, a in enumerate(sys.argv):
        if a == '--seed' and i + 1 < len(sys.argv):
            seed = int(sys.argv[i + 1])
    K.preview(sys.modules[__name__], seed)
