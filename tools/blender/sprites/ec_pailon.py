# Ecuador 2-7 "Devil's Cauldron" (theme ec_pailon): the waterfall gorge as a Fiesta Toon diorama.
#   L0  ecGorge  (base 0, #2a5a3a): tall basalt columns with rounded broken tops against the misty sky (muted, no
#       ledge-like tops), two white torrents falling the full height with pale streaks, mist at their feet, ferns
#   L1  ecCanopy (base 380, #1e3a2a): the near jungle along the gorge floor: dark treetops, tree ferns, big leaves
#   ground: wet mossy rock (grass style): a moss cap over dark stone
# Contract, conventions and the shared toolkit: see ec_equator.py.
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import ec_equator as K
import ec_amazon as AM
from ec_equator import Builder, P, TAU

MODULE = 'ec_pailon'
LAYERS = ['L0', 'L1']
BASES = {'L0': 0, 'L1': 380}
SKY = ['#cfeff0', '#7ab8a8', '#2a5a4a']
PALETTE = {
    'pai_back': '#2c4e44', 'pai_col_a': '#3a5e52', 'pai_col_b': '#34564c', 'pai_col_c': '#40665a', 'pai_col_lit': '#4e7a6a',
    'pai_moss': '#5a9a4a', 'pai_moss2': '#4a8a40', 'pai_fall': '#f4fcff', 'pai_fall2': '#cfeef4', 'pai_mist': '#eefaf8', 'pai_fern': '#3a6a40',
    'pai_near_fill': '#1e3a2a', 'pai_near_bump': '#24422f', 'pai_near_bump2': '#2a4a34', 'pai_near_trunk': '#162a1e', 'pai_near_leaf': '#2c5236',
    'pai_g_turf': '#3a8a4a', 'pai_g_turf_hi': '#7ac070', 'pai_g_soil': '#3a4a3e', 'pai_g_soil_dark': '#24302a', 'pai_g_rock': '#5a6a62',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
HH = 16.6


def build_L0(rng):
    L = 'L0'
    Builder('L0_back', L, TH).box('pai_back', (P / 2, 4.0, -HH / 2 - 1.2), (P + 2 * K.OVER, 1.0, HH - 2.4), bevel=0.0).done(period=None)['outline'] = 0.0
    falls = [P * 0.27, P * 0.71]
    # basalt columns: tall vertical slabs side by side, their tops ragged against the sky, lit a little near the top
    C = Builder('L0_columns', L, TH)
    x = -K.OVER
    while x < P + K.OVER:
        w = rng.uniform(1.0, 2.2)
        if any(abs(x + w / 2 - f) < 1.6 for f in falls):
            x += w; continue
        top = -rng.uniform(0.3, 2.8)
        C.box(rng.choice(('pai_col_a', 'pai_col_b', 'pai_col_c')), (x + w / 2, 3.2, top - HH / 2), (w - 0.12, 0.8, HH), bevel=0.25)
        # a rounded, broken cap (never a flat lit top that could read as a ledge)
        C.sphere(rng.choice(('pai_col_a', 'pai_col_b')), (x + w / 2 + rng.uniform(-0.2, 0.2), 3.25, top - 0.05), (w - 0.1) / 2, scale=(1.0, 0.5, rng.uniform(0.45, 0.9)), subdiv=2)
        x += w
    ob = C.done(period=None); ob['outline'] = 0.3
    F = Builder('L0_ferns', L, TH)
    for k in range(10):
        x, z = rng.uniform(0, P), -rng.uniform(1.0, HH - 2.0)
        if any(abs(x - f) < 1.8 for f in falls):
            continue
        for j in range(5):
            a = -math.pi / 2 + (j - 2) * 0.45
            F.sphere('pai_fern', (x + math.cos(a) * 0.45, 2.4, z + math.sin(a) * 0.45), 0.4, scale=(1.0, 0.25, 0.3), rot=(0, -a, 0), subdiv=1)
    ob = F.done(period=None); ob['outline'] = 0.4
    # the torrents: white ribbons the full height, pale streaks, mist at the foot
    W = Builder('L0_falls', L, TH)
    for f in falls:
        W.box('pai_fall', (f, 2.0, -HH / 2), (2.4, 0.3, HH + 0.2), bevel=0.0)
        for k in range(9):
            sx = f - 1.0 + 0.25 * k
            for j in range(6):
                zc = -rng.uniform(0.5, HH - 1.0)
                W.box('pai_fall2', (sx, 1.85, zc), (0.08, 0.05, rng.uniform(0.8, 2.2)), bevel=0.0)
    ob = W.done(period=None); ob['outline'] = 0.0
    Ms = Builder('L0_mist', L, TH)
    for f in falls:
        for k in range(7):
            Ms.sphere('pai_mist', (f + rng.uniform(-2.2, 2.2), 1.6, -HH + 2.0 + rng.uniform(-0.6, 1.2)), rng.uniform(0.8, 1.4), scale=(1.4, 0.5, 0.8), subdiv=2)
    ob = Ms.done(period=None); ob['outline'] = 0.0


def build_L1(rng):
    L = 'L1'
    K.fill_below(TH, L, 'pai_near_fill', top=0.4, depth=2.6, y=2.5)
    B = Builder('L1_mound', L, TH)
    x, i = rng.uniform(0, 1.0), 0
    while x < P:
        r = rng.uniform(1.1, 2.3)
        for dx in K.wraps(x, r):
            B.sphere('pai_near_bump' if i % 3 else 'pai_near_bump2', (x + dx, rng.uniform(0.0, 2.0), -0.1), r, scale=(1.1, 0.7, 0.75), subdiv=2)
        x += rng.uniform(1.1, 2.0); i += 1
    B.done(period=None)
    T = Builder('L1_treeferns', L, TH)
    for x in K.jittered(rng, 5, 0.3):
        h = rng.uniform(2.6, 4.2)
        for dx in K.wraps(x, 2.0):
            T.rod('pai_near_trunk', (x + dx, 1.0, 0.0), (x + dx + rng.uniform(-0.3, 0.3), 1.0, h), 0.16, segs=6, r2=0.12)
            for k in range(7):
                a = math.pi * k / 6
                T.sphere('pai_near_leaf', (x + dx + math.cos(a) * 1.0, 0.9, h + math.sin(a) * 0.45 - 0.2), 0.75, scale=(1.4, 0.3, 0.28), rot=(0, -(a - math.pi / 2) * 0.9, 0), subdiv=1)
    T.done(period=None)
    D = Builder('L1_leaves', L, TH)
    for x in K.jittered(rng, 9, 0.4):
        for dx in K.wraps(x, 1.2):
            for k in range(3):
                AM.big_leaf(D, 'pai_near_leaf', x + dx + (k - 1) * 0.35, 0.3, 0.5, rng.uniform(1.0, 1.9), (k - 1) * 0.45)
    D.done(period=None)


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return K.grass_ground(TH, random.Random(seed), {'turf': 'pai_g_turf', 'turf_hi': 'pai_g_turf_hi', 'soil': 'pai_g_soil',
                                                    'soil_dark': 'pai_g_soil_dark', 'rock': 'pai_g_rock'})


def clear():
    TH.clear()
