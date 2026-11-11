# Ecuador 2-2 "Canopy of Baños" (theme ec_amazon_dusk): the rainforest canopy of ec_amazon.py at dusk. The same
# diorama (treetop mound, trunks, a canopy ceiling, vines, glowing mushrooms) in dusk colours: violet silhouettes
# against the sunset, warm mushroom lanterns. The vines stay thin and dark so they never read as the level's swing
# vines.
#   L0  ecCanopy (base 300, #3a2a4a)  the far canopy, mauve
#   L1  ecCanopy (base 355, #1e1a2a)  the near canopy, deep violet
#   ground                            grass at dusk: a moss cap over dark soil
# Contract, conventions and the shared toolkit: see ec_equator.py; geometry: ec_amazon.canopy().
import os, sys, random
HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import ec_equator as K
import ec_amazon as AM
from ec_equator import PPM, P

MODULE = 'ec_amazon_dusk'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 355}
SKY = ['#2a1a4a', '#a84a6a', '#ffb070']
PALETTE = {
    'dusk_far_fill': '#3a2a4a', 'dusk_far_bump': '#46324e', 'dusk_far_bump2': '#503a58', 'dusk_far_trunk': '#2e2038',
    'dusk_far_vine': '#4a3a58', 'dusk_far_leaf': '#56405e', 'dusk_far_shroom_glow': '#ffc878', 'dusk_far_stem': '#ffe8c8',
    'dusk_fill': '#1e1a2a', 'dusk_bump': '#262034', 'dusk_bump2': '#2e263c', 'dusk_trunk': '#16121e',
    'dusk_vine': '#2e2a3e', 'dusk_leaf': '#342c44', 'dusk_shroom_glow': '#ffb070', 'dusk_stem': '#ffe0c0',
    'dusk_g_turf': '#3e7a46', 'dusk_g_turf_hi': '#7ab070', 'dusk_g_soil': '#3a2a24', 'dusk_g_soil_dark': '#221814', 'dusk_g_rock': '#5a4a46',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
from ec_equator import Builder, TAU
import math


# ec_amazon.canopy with fewer vines (no leaf pairs) and fewer upright leaves: a calmer dusk silhouette that packs small
def canopy_lite(L, rng, roles, z_top, near=False):
    """One canopy layer: the treetop mound on the ground line, trunks up to the strip top, a treetop ceiling hanging
    from it, vines dangling between, leaves and glowing mushrooms."""
    s = 1.25 if near else 1.0
    K.fill_below(AM.TH, L, roles['fill'], top=0.4, depth=2.4, y=2.5)
    # the mound: overlapping rounded treetops along the ground line, two tones, staggered in depth
    B = Builder(f'{L}_mound', L, AM.TH)
    x = rng.uniform(0, 1.0); i = 0
    while x < P:
        r = rng.uniform(1.1, 2.5) * s
        for dx in K.wraps(x, r):
            B.sphere(roles['bump'] if i % 3 else roles['bump2'], (x + dx, rng.uniform(0.0, 2.0), -0.1), r, scale=(1.1, 0.7, 0.75), subdiv=2)
        x += rng.uniform(1.0, 2.0) * s
        i += 1
    B.done(period=None)
    # the ceiling: treetops hanging from the top of the strip
    B = Builder(f'{L}_ceiling', L, AM.TH)
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
    B = Builder(f'{L}_trunks', L, AM.TH)
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
    B = Builder(f'{L}_vines', L, AM.TH)
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
            for k in ():
                px, py, pz = shifted[k]
                for sx in (-1, 1):
                    B.sphere(roles['leaf'], (px + sx * 0.22 * s, py - 0.05, pz + 0.05), 0.2 * s, scale=(1.0, 0.5, 0.6), subdiv=1, rot=(0, sx * 0.4, 0))
            B.sphere(roles['leaf'], (shifted[-1][0], y - 0.05, shifted[-1][2] - 0.1), 0.26 * s, scale=(0.8, 0.5, 1.0), subdiv=1)
        x += rng.uniform(2.2, 4.0)
    B.done(period=None)
    # upright leaves and glowing mushrooms on the mound
    B = Builder(f'{L}_dressing', L, AM.TH)
    for x in K.jittered(rng, rng.randint(5, 6), 0.4):
        for dx in K.wraps(x, 1.2):
            for k in range(rng.randint(2, 3)):
                AM.big_leaf(B, roles['leaf'], x + dx + (k - 1) * 0.35, 0.3, 0.6, rng.uniform(1.2, 2.2) * s, (k - 1) * 0.45 + rng.uniform(-0.1, 0.1))
    for x in K.jittered(rng, rng.randint(5, 7), 0.4):
        for dx in K.wraps(x, 0.6):
            AM.mushrooms(B, x + dx, -0.2, rng.uniform(0.5, 1.4), rng, roles, n=rng.randint(2, 3), scale=s)
    B.done(period=None)



def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    AM.TH = TH                    # ec_amazon's canopy builds into this theme's collections and palette
    rng = random.Random(seed + 11)
    far = {k: 'dusk_far_' + v for k, v in (('fill', 'fill'), ('bump', 'bump'), ('bump2', 'bump2'), ('trunk', 'trunk'), ('vine', 'vine'),
                                            ('leaf', 'leaf'), ('glow', 'shroom_glow'), ('stem', 'stem'))}
    near = {k: 'dusk_' + v for k, v in (('fill', 'fill'), ('bump', 'bump'), ('bump2', 'bump2'), ('trunk', 'trunk'), ('vine', 'vine'),
                                         ('leaf', 'leaf'), ('glow', 'shroom_glow'), ('stem', 'stem'))}
    canopy_lite('L0', random.Random(rng.random()), far, z_top=BASES['L0'] / PPM, near=False)
    canopy_lite('L1', random.Random(rng.random()), near, z_top=BASES['L1'] / PPM, near=True)
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return K.grass_ground(TH, random.Random(seed), {'turf': 'dusk_g_turf', 'turf_hi': 'dusk_g_turf_hi', 'soil': 'dusk_g_soil',
                                                    'soil_dark': 'dusk_g_soil_dark', 'rock': 'dusk_g_rock'})


def clear():
    TH.clear()
