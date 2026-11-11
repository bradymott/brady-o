# Mozambique 4-1's secret room "Inside the Termite Mound" (theme mz_cupim, an interior of mz_savanna), as a Fiesta Toon
# diorama in the cave layer order (03_themes.js caveVariant):
#   L0  (base 0)    the mound's inner wall: red-orange clay in rounded lumps, dark tunnel mouths, the termites' ridged
#                   chimneys climbing up, a shaft of light at the top
#   L1  (base 380)  clay pillars and mounds
#   L2  (base 420)  the near clay lumps, darker
#   ground: packed clay (grass style: an orange cap over red clay with pebbles)
# Helpers: ma_kit.py.
import math, random
import ma_kit as K
from ma_kit import P, Builder

MODULE = 'mz_cupim'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 0, 'L1': 380, 'L2': 420}
SKY = ['#2a120a', '#5a2a14', '#8a4a24']
PALETTE = {
    'back': '#6a3218', 'clay_a': '#8a4422', 'clay_b': '#7a3a1c', 'clay_c': '#9a5028', 'clay_lit': '#b8683a', 'hole': '#2a1008',
    'ridge': '#a85a30', 'mound': '#5a2a14', 'mound2': '#66301a', 'near': '#3a1a0c', 'near2': '#44200e',
    'g_cap': '#c8703a', 'g_cap_hi': '#e8905a', 'g_dirt': '#8a4422', 'g_dirt2': '#743818', 'g_rock': '#a86a4a',
}
K.use(MODULE, PALETTE, LAYERS)
HH = 16.6


def build_L0(rng):
    L = 'L0'
    Builder('L0_back', L).box('back', (P / 2, 4.0, -HH / 2), (P + 2.0, 1.0, HH + 0.4), bevel=0.0).done(period=None)['outline'] = 0
    S = Builder('L0_lumps', L)
    for r in range(13):
        zc = -0.5 - r * HH / 13
        x = rng.uniform(-1.0, 0.0)
        while x < P + 0.5:
            w = rng.uniform(1.6, 3.2)
            role = 'clay_lit' if r < 2 and rng.random() < 0.6 else rng.choice(('clay_a', 'clay_b', 'clay_c'))
            for dx in K.wraps(x + w / 2, w / 2 + 0.3):
                S.sphere(role, (x + w / 2 + dx, 3.3, zc + rng.uniform(-0.25, 0.25)), w / 2, scale=(1.0, 0.4, rng.uniform(0.55, 0.8)), subdiv=2)
            x += w * rng.uniform(0.75, 0.9)
    S.done(period=None)['outline'] = 0
    H = Builder('L0_holes', L)
    for k in range(9):
        x, z = rng.uniform(0, P), -rng.uniform(2.0, HH - 2.0)
        for dx in K.wraps(x, 0.8):
            H.sphere('hole', (x + dx, 2.6, z), rng.uniform(0.45, 0.8), scale=(1.0, 0.2, 0.75), subdiv=2)
    H.done(period=None)['outline'] = 0.4
    R = Builder('L0_chimneys', L)
    for k in range(5):
        x = (k + 0.5) * P / 5 + rng.uniform(-1, 1)
        for j in range(10):
            R.sphere('ridge', (x + 0.15 * math.sin(j), 2.5, -HH + 1.0 + j * 1.4), 0.5 - 0.02 * j, scale=(1.0, 0.4, 0.8), subdiv=1)
    R.done(period=None)['outline'] = 0.3


def build_L1(rng):
    L = 'L1'
    K.plain(L, 'L1_fill', 'mound', y=3.0, depth=1.0, top=-0.6, bottom=-3.5)
    B = Builder('L1_pillars', L)
    x = rng.uniform(0, 1)
    while x < P:
        r = rng.uniform(1.0, 1.8)
        for dx in K.wraps(x, r * 1.2):
            B.sphere(rng.choice(('mound', 'mound2')), (x + dx, 2.4, -0.3), r * 1.2, scale=(1.2, 0.5, 0.65), subdiv=2)
            if rng.random() < 0.4:
                B.lathe('mound2', [(0.5, 0.0), (0.38, 1.2), (0.22, 2.0), (0.0, 2.4)], 8, at=(x + dx, 2.2, 0.0), cap_bottom=True)
        x += r * 2.0
    B.done(period=None)['outline'] = 0.4


def build_L2(rng):
    L = 'L2'
    K.plain(L, 'L2_fill', 'near', y=2.0, depth=1.0, top=-0.4, bottom=-3.5)
    B = Builder('L2_lumps', L)
    x = rng.uniform(0, 1)
    while x < P:
        r = rng.uniform(0.8, 1.4)
        for dx in K.wraps(x, r * 1.3):
            B.sphere(rng.choice(('near', 'near2')), (x + dx, 1.4, -0.2), r, scale=(1.3, 0.5, 0.7), subdiv=2)
        x += r * 2.4
    B.done(period=None)['outline'] = 0.4


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='nubs', stone_p=0.35, patch_p=0.35, cap_h=0.32)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
