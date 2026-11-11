# Brazil 3-3's secret room "Behind the Falls" (theme br_garganta, an interior of br_falls): the cave behind Iguaçu's
# water, as a Fiesta Toon diorama. The cave layer order (03_themes.js caveVariant):
#   L0  (base 0)    wet slate rock in vertical plates, two bright windows where the falling water is seen from
#                   behind (pale streaked sheets, unlit glow), mist at their feet, moss on the ledges of the rock
#   L1  (base 380)  wet round boulders with ferns, dark teal (round tops: nothing reads as a ledge)
#   L2  (base 420)  the near rocks, darker, with dripping moss
#   ground: wet slate stones (grass style: a slick grey-green cap)
# Helpers: ma_kit.py.
import math, random
import ma_kit as K
from ma_kit import P, Builder

MODULE = 'br_garganta'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 0, 'L1': 380, 'L2': 420}
SKY = ['#0a1a2a', '#123a4a', '#1a5a6a']
PALETTE = {
    'back': '#1e3a44', 'rock_a': '#28485a', 'rock_b': '#224050', 'rock_c': '#2e5262', 'rock_lit': '#3a6a78',
    'fall_glow': '#d8f6ff', 'fall_streak_glow': '#a8e2f4', 'mist': '#c8eef4', 'moss': '#3a7a5a', 'moss2': '#2e6a4c',
    'boulder': '#1a3440', 'boulder2': '#203c4a', 'fern': '#2a6a4a', 'near': '#10222a', 'near2': '#162c34', 'drip': '#2a5a4a',
    'g_cap': '#4a6a6a', 'g_cap_hi': '#7aa0a0', 'g_dirt': '#2a3e44', 'g_dirt2': '#22343a', 'g_rock': '#4a5e64',
}
K.use(MODULE, PALETTE, LAYERS)
HH = 16.6
FALLS = (P * 0.3, P * 0.76)


def build_L0(rng):
    L = 'L0'
    Builder('L0_back', L).box('back', (P / 2, 4.0, -HH / 2), (P + 2.0, 1.0, HH + 0.4), bevel=0.0).done(period=None)['outline'] = 0
    W = Builder('L0_falls', L)
    for f in FALLS:
        W.box('fall_glow', (f, 3.5, -HH / 2), (4.2, 0.2, HH + 0.4), bevel=0.0)
        for k in range(12):
            for j in range(5):
                W.box('fall_streak_glow', (f - 1.9 + 0.34 * k, 3.4, -rng.uniform(0.5, HH)), (0.08, 0.05, rng.uniform(1.0, 2.6)), bevel=0.0)
    W.done(period=None)['outline'] = 0
    S = Builder('L0_rock', L)
    x = -1.0
    while x < P + 1.0:
        w = rng.uniform(1.0, 2.2)
        near_fall = any(abs(x + w / 2 - f) < 2.3 for f in FALLS)
        if not near_fall:
            top = 0.4
            S.rbox(rng.choice(('rock_a', 'rock_b', 'rock_c')), (x + w / 2, 3.0, -HH / 2 + 0.2), (w - 0.1, 0.6, HH + 0.4), bevel=0.3, segments=2)
        else:
            # the frame of rock around the window: arches of rock from above and below
            S.rbox('rock_b', (x + w / 2, 3.0, -0.8), (w, 0.6, 2.2), bevel=0.4, segments=2)
            S.rbox('rock_a', (x + w / 2, 3.0, -HH + 1.0), (w, 0.6, 3.0), bevel=0.4, segments=2)
        x += w
    S.done(period=None)['outline'] = 0.3
    M = Builder('L0_moss', L)
    for k in range(22):
        x, z = rng.uniform(0, P), -rng.uniform(1.0, HH - 1.0)
        for dx in K.wraps(x, 0.6):
            M.sphere(rng.choice(('moss', 'moss2')), (x + dx, 2.6, z), rng.uniform(0.3, 0.6), scale=(1.6, 0.4, 0.5), subdiv=1)
    for f in FALLS:
        for k in range(6):
            M.sphere('mist', (f + rng.uniform(-2.0, 2.0), 2.5, -HH + 3.6 + rng.uniform(-0.5, 0.8)), rng.uniform(0.7, 1.2), scale=(1.5, 0.4, 0.7), subdiv=2)
    M.done(period=None)['outline'] = 0


def build_L1(rng):
    L = 'L1'
    K.plain(L, 'L1_fill', 'boulder', y=3.0, depth=1.0, top=-0.6, bottom=-3.5)
    B = Builder('L1_boulders', L)
    x = rng.uniform(0, 1)
    while x < P:
        r = rng.uniform(1.0, 2.2)
        for dx in K.wraps(x, r * 1.2):
            B.sphere(rng.choice(('boulder', 'boulder2')), (x + dx, 2.4, -0.4 + r * 0.25), r * 1.1, scale=(1.0, 0.5, rng.uniform(0.6, 0.85)), subdiv=2, rot=(0, rng.uniform(-0.4, 0.4), 0))
        x += r * 1.8
    B.done(period=None)['outline'] = 0.4
    F = Builder('L1_ferns', L)
    for k in range(8):
        x, z = rng.uniform(0, P), rng.uniform(0.2, 1.2)
        for j in range(5):
            a = -math.pi / 2 + (j - 2) * 0.45
            F.sphere('fern', (x + math.cos(a + math.pi) * 0.4, 1.8, z - math.sin(a + math.pi) * 0.4), 0.42, scale=(1.0, 0.25, 0.3), rot=(0, a, 0), subdiv=1)
    F.done()['outline'] = 0.4


def build_L2(rng):
    L = 'L2'
    K.plain(L, 'L2_fill', 'near', y=2.0, depth=1.0, top=-0.4, bottom=-3.5)
    B = Builder('L2_rocks', L)
    x = rng.uniform(0, 1)
    while x < P:
        r = rng.uniform(0.9, 1.6)
        for dx in K.wraps(x, r * 1.2):
            B.sphere(rng.choice(('near', 'near2')), (x + dx, 1.4, -0.3 + r * 0.2), r, scale=(1.0, 0.5, rng.uniform(0.55, 0.8)), subdiv=2)
            for j in range(2):
                B.rod('drip', (x + dx + (j - 0.5) * r * 0.8, 1.0, r * 0.7), (x + dx + (j - 0.5) * r * 0.8, 1.0, r * 0.2), 0.06, segs=4, r2=0.02)
        x += r * 2.6
    B.done(period=None)['outline'] = 0.4


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts=None, stone_p=0.55, patch_p=0.2, cap_h=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
