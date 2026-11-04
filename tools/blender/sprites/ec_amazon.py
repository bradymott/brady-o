# Ecuador 2-3 "Amazon Canopy" (theme ec_amazon): the parallax background as a Fiesta Toon diorama, one Collection
# per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: the rainforest canopy at night, seen
# from inside it: a mound of treetops below, a ceiling of treetops above, great trunks between them and vines
# hanging down, lit by glowing mushrooms.
#
#   L0  ecCanopy (base 300, #0e2a1a)  the far canopy: rounded treetop mound, trunks up to the strip top, a canopy
#                                     ceiling hanging from it, thin vines with leaf pairs, a few glowing mushrooms
#   L1  ecCanopy (base 355, #081a10)  the near canopy: the same, bigger and darker, thicker vines, more mushrooms,
#                                     big upright leaves on the mound
#   ground                            grass (dark jungle variant): mossy turf cap over dark soil
#
# Contract, conventions and the shared toolkit: see ec_equator.py.
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/ec_amazon.py [--seed N]
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import ec_equator as K
from ec_equator import Builder, P, TAU, PPM

MODULE = 'ec_amazon'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 355}
SKY = ['#06120e', '#0e2a1e', '#1a3a2a']
PALETTE = {
    # L0 (#0e2a1a)
    'amazon_far_fill': '#0e2a1a', 'amazon_far_bump': '#133424', 'amazon_far_bump2': '#183e2a', 'amazon_far_trunk': '#0a1e12',
    'amazon_far_vine': '#265a3c', 'amazon_far_leaf': '#225638', 'amazon_far_shroom_glow': '#7affc0', 'amazon_far_stem': '#bfffdc',
    # L1 (#081a10)
    'amazon_fill': '#081a10', 'amazon_bump': '#0c2418', 'amazon_bump2': '#112c1e', 'amazon_trunk': '#04100a',
    'amazon_vine': '#1e5030', 'amazon_leaf': '#1a4a2c', 'amazon_shroom_glow': '#9affd0', 'amazon_stem': '#d0ffe6',
    # ground (dark grass)
    'amazon_g_turf': '#2a7a3a', 'amazon_g_turf_hi': '#5ab86a', 'amazon_g_soil': '#3e2c1c', 'amazon_g_soil_dark': '#1e140a', 'amazon_g_rock': '#4e3e2c',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)

def mushrooms(B, x, y, z, rng, roles, n=3, scale=1.0):
    """A little cluster of glowing mushrooms: pale stems, unlit glowing caps."""
    for k in range(n):
        dx = (k - (n - 1) / 2) * 0.22 * scale
        h = rng.uniform(0.3, 0.5) * scale
        r = rng.uniform(0.16, 0.26) * scale
        B.rod(roles['stem'], (x + dx, y, z), (x + dx, y, z + h), 0.035 * scale, segs=5)
        B.sphere(roles['glow'], (x + dx, y, z + h), r, scale=(1.0, 0.8, 0.6), subdiv=1)

def big_leaf(B, role, x, y, z, Lf, a):
    """An upright pointed leaf (a heliconia-like blade) leaning by angle a about Y."""
    pts = [(0.0, 0.0), (0.16, 0.25 * Lf), (0.2, 0.55 * Lf), (0.08, 0.85 * Lf), (0.0, Lf), (-0.08, 0.85 * Lf), (-0.2, 0.55 * Lf), (-0.16, 0.25 * Lf)]
    B.slab(role, [(px * Lf * 0.8, pz) for px, pz in pts], 0.06, at=(x, y, z), rot=(0, a, 0))

def canopy(L, rng, roles, z_top, near=False):
    """One canopy layer: the treetop mound on the ground line, trunks up to the strip top, a treetop ceiling hanging
    from it, vines dangling between, leaves and glowing mushrooms."""
    s = 1.25 if near else 1.0
    K.fill_below(TH, L, roles['fill'], top=0.4, depth=2.4, y=2.5)
    # the mound: overlapping rounded treetops along the ground line, two tones, staggered in depth
    B = Builder(f'{L}_mound', L, TH)
    x = rng.uniform(0, 1.0); i = 0
    while x < P:
        r = rng.uniform(1.1, 2.5) * s
        for dx in K.wraps(x, r):
            B.sphere(roles['bump'] if i % 3 else roles['bump2'], (x + dx, rng.uniform(0.0, 2.0), -0.1), r, scale=(1.1, 0.7, 0.75), subdiv=2)
        x += rng.uniform(1.0, 2.0) * s
        i += 1
    B.done(period=None)
    # the ceiling: treetops hanging from the top of the strip
    B = Builder(f'{L}_ceiling', L, TH)
    B.box(roles['fill'], (P / 2, 2.5, z_top + 1.0), (P + 2, 6.0, 2.4), bevel=0.0)
    x = rng.uniform(0, 1.0); i = 0
    while x < P:
        r = rng.uniform(1.0, 2.2) * s
        for dx in K.wraps(x, r):
            B.sphere(roles['bump'] if i % 3 else roles['bump2'], (x + dx, rng.uniform(0.0, 2.0), z_top + 0.2), r, scale=(1.1, 0.7, 0.8), subdiv=2)
        x += rng.uniform(1.0, 2.0) * s
        i += 1
    B.done(period=None)
    # great trunks between mound and ceiling, with a couple of boughs reaching into the ceiling
    B = Builder(f'{L}_trunks', L, TH)
    for x in K.jittered(rng, rng.randint(4, 5), 0.3):
        r = rng.uniform(0.3, 0.5) * s
        y = rng.uniform(1.0, 2.5)
        for dx in K.wraps(x, r * 1.2):
            B.rod(roles['trunk'], (x + dx, y, -0.5), (x + dx + rng.uniform(-0.3, 0.3), y, z_top + 0.5), r * 1.15, segs=7, r2=r * 0.8)
            for sx in (-1, 1):
                zb = z_top - rng.uniform(1.0, 2.2)
                B.rod(roles['trunk'], (x + dx, y, zb), (x + dx + sx * rng.uniform(1.2, 2.2), y, zb + rng.uniform(0.9, 1.6)), r * 0.45, segs=5, r2=r * 0.25)
            # buttress roots flaring into the mound
            for sx in (-1, 1):
                B.rod(roles['trunk'], (x + dx + sx * r * 1.6, y, -0.3), (x + dx, y, 1.3), r * 0.4, segs=4, r2=r * 0.2)
    B.done(period=None)
    # vines: thin wobbly chains hanging from the ceiling to between 0.7 and 4.5 m, with leaf pairs
    B = Builder(f'{L}_vines', L, TH)
    x = rng.uniform(0, 0.8)
    while x < P:
        z_end = rng.uniform(0.7, 4.5)
        ph = rng.uniform(0, TAU)
        amp = rng.uniform(0.15, 0.35)
        n = 7
        pts = [(x + math.sin(ph + k * 1.1) * amp, rng.uniform(0.2, 1.8), z_top + 0.3 - (z_top + 0.3 - z_end) * k / n) for k in range(n + 1)]
        y = pts[0][1]
        pts = [(px, y, pz) for px, _, pz in pts]
        for dx in K.wraps(x, amp + 0.4):
            shifted = [(px + dx, py, pz) for px, py, pz in pts]
            B.chain(roles['vine'], shifted, 0.05 * s, segs=5, taper=0.7)
            for k in range(2, n, 2):
                px, py, pz = shifted[k]
                for sx in (-1, 1):
                    B.sphere(roles['leaf'], (px + sx * 0.22 * s, py - 0.05, pz + 0.05), 0.2 * s, scale=(1.0, 0.5, 0.6), subdiv=1, rot=(0, sx * 0.4, 0))
            B.sphere(roles['leaf'], (shifted[-1][0], y - 0.05, shifted[-1][2] - 0.1), 0.26 * s, scale=(0.8, 0.5, 1.0), subdiv=1)
        x += rng.uniform(0.9, 2.2)
    B.done(period=None)
    # upright leaves and glowing mushrooms on the mound
    B = Builder(f'{L}_dressing', L, TH)
    for x in K.jittered(rng, rng.randint(8, 11), 0.4):
        for dx in K.wraps(x, 1.2):
            for k in range(rng.randint(2, 3)):
                big_leaf(B, roles['leaf'], x + dx + (k - 1) * 0.35, 0.3, 0.6, rng.uniform(1.2, 2.2) * s, (k - 1) * 0.45 + rng.uniform(-0.1, 0.1))
    for x in K.jittered(rng, rng.randint(5, 7), 0.4):
        for dx in K.wraps(x, 0.6):
            mushrooms(B, x + dx, -0.2, rng.uniform(0.5, 1.4), rng, roles, n=rng.randint(2, 3), scale=s)
    B.done(period=None)

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    far = {'fill': 'amazon_far_fill', 'bump': 'amazon_far_bump', 'bump2': 'amazon_far_bump2', 'trunk': 'amazon_far_trunk',
           'vine': 'amazon_far_vine', 'leaf': 'amazon_far_leaf', 'glow': 'amazon_far_shroom_glow', 'stem': 'amazon_far_stem'}
    near = {'fill': 'amazon_fill', 'bump': 'amazon_bump', 'bump2': 'amazon_bump2', 'trunk': 'amazon_trunk',
            'vine': 'amazon_vine', 'leaf': 'amazon_leaf', 'glow': 'amazon_shroom_glow', 'stem': 'amazon_stem'}
    canopy('L0', random.Random(rng.random()), far, z_top=BASES['L0'] / PPM, near=False)
    canopy('L1', random.Random(rng.random()), near, z_top=BASES['L1'] / PPM, near=True)
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    """Dark jungle grass floor (mossy turf cap over dark soil), tile-aligned, period GP; collection 'ground'."""
    return K.grass_ground(TH, random.Random(seed), {'turf': 'amazon_g_turf', 'turf_hi': 'amazon_g_turf_hi', 'soil': 'amazon_g_soil',
                                                    'soil_dark': 'amazon_g_soil_dark', 'rock': 'amazon_g_rock'})

def clear():
    TH.clear()

if __name__ == '__main__':
    K.preview(TH, build, build_ground)
