# Japan (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) N `jp_gacha`: "Capsule Toy Machine" (11-6 MINI, secret),
# inside a giant capsule-toy machine. Not wired into the game yet: the overhaul's engine work will add the theme; its key
# matches this atlas's name. Original toon art:
#   L0  (base 0, f 0.04): the backdrop: the machine's clear dome seen from inside, a soft pastel arcade glow beyond it,
#       big curved highlight streaks on the plastic and the dome's ribbed rim near the top
#   L1  (base 356, f 0.15): the heap of big capsules piled up behind the play area (two-tone: a coloured half and a
#       clear half), a few toys peeking out, a chrome crank gear on the wall
#   ground: the machine's floor: rounded pastel plastic panels under a glossy white lip
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU

MODULE = 'jp_gacha'
LAYERS = ['L0', 'L1']
BASES = {'L0': 0, 'L1': 356}
SKY = ['#ffd8ec', '#e8e0ff', '#d8f4ff']
PX = 28.1
PALETTE = {
    'dome': '#e4e8ff', 'dome2': '#f2eeff', 'glowA': '#ffd0e8', 'glowB': '#d0e8ff', 'glowC': '#fff0c0', 'streak': '#ffffff',
    'rim': '#c8c8e0', 'rim2': '#b0b0cc',
    'cap_pink': '#ff8ab8', 'cap_blue': '#7ac8ff', 'cap_yellow': '#ffd84a', 'cap_green': '#8ae07a', 'cap_violet': '#c8a0ff',
    'clear': '#eef6ff', 'band': '#ffffff', 'toy': '#ffb84a', 'toy2': '#ff6a6a', 'chrome': '#c8ccd8', 'chrome2': '#9aa0b0',
    'g_cap': '#ffffff', 'g_cap_hi': '#ffffff', 'g_dirt': '#d8c8f0', 'g_rock': '#ffc0dc', 'g_rock2': '#c0e0ff', 'g_rock3': '#fff0b0',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    # a backdrop hanging from z = 0 down ~16 m: the dome wall, glows behind it, highlight streaks
    W = Builder('L0_dome', L)
    W.box('dome', (P / 2, 2.0, -8.0), (P + 2.0, 0.5, 18.0), bevel=0.0)
    for k in range(9):
        x = rng.uniform(0, P)
        z = rng.uniform(-14.0, -3.0)
        for dx in wraps(x, 3.0):
            W.sphere(rng.choice(('glowA', 'glowB', 'glowC')), (x + dx, 1.6, z), rng.uniform(1.6, 2.8), scale=(1.0, 0.1, 1.0), subdiv=3)
    ow = W.done(period=None)
    ow['outline'] = 0
    S = Builder('L0_streaks', L)
    for k in range(6):
        x = (k + 0.5) * P / 6 + rng.uniform(-1, 1)
        for dx in wraps(x, 2.5):
            S.slab('streak', [(0.0, 0.0), (0.35, 0.0), (1.9, -7.0), (1.55, -7.0)], 0.03, at=(x + dx, 1.2, -2.0))
            S.slab('dome2', [(0.55, 0.0), (0.7, 0.0), (2.2, -6.5), (2.05, -6.5)], 0.03, at=(x + dx, 1.2, -2.0))
    os_ = S.done(period=None)
    os_['outline'] = 0
    R = Builder('L0_rim', L)
    R.box('rim', (P / 2, 1.0, -0.6), (P + 2.0, 0.6, 0.9), bevel=0.0)
    n = int(P / 0.9)
    for k in range(n):
        R.box('rim2', ((k + 0.5) * P / n, 0.65, -0.6), (0.12, 0.1, 0.8), bevel=0.0)
    orr = R.done(period=None)
    orr['outline'] = 0.6


def capsule(B, x, z, r, rng, ang):
    col = rng.choice(('cap_pink', 'cap_blue', 'cap_yellow', 'cap_green', 'cap_violet'))
    c = (x, 0.0, z)
    a = ang
    B.sphere(col, c, r, subdiv=2)
    # the clear half: a slightly bigger hemisphere-ish cap on one side, tilted
    B.lathe('clear', [(r * 1.04, 0.0), (r * 0.99, r * 0.32), (r * 0.79, r * 0.68), (r * 0.45, r * 0.94), (0.0, r * 1.05)], 14, at=c, rot=(0, a, 0), smooth=True)
    B.lathe('band', [(r * 1.06, -0.03), (r * 1.06, 0.03), (0.0, 0.03)], 14, at=c, rot=(0, a, 0), cap_top=False)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'cap_violet', y=3.0, depth=3.0, top=-0.5, bottom=-3.0)
    B = Builder('L1_heap', L)
    # three rows of capsules, the back row highest, a soft heap profile over the period
    for row, (y, zb, rmin, rmax) in enumerate(((2.0, 0.6, 0.8, 1.1), (1.0, 0.1, 0.75, 1.0), (0.0, -0.4, 0.7, 0.95))):
        x = rng.uniform(0, 1.0)
        while x < P:
            r = rng.uniform(rmin, rmax)
            hump = 1.6 * (0.5 + 0.5 * math.sin(TAU * x / P * 2 + row))
            z = zb + hump * (1.0 - row * 0.3) + r * 0.6
            for dx in wraps(x, r + 0.1):
                capsule(B, x + dx, z, r, random.Random(int(x * 100) + row), rng.uniform(-1.2, 1.2) + (math.pi / 2 if rng.random() < 0.5 else 0))
            x += r * 1.8
    B.done(period=None)
    G = Builder('L1_crank', L)
    for k in range(2):
        gx = (0.25 + 0.5 * k) * P
        G.lathe('chrome', [(1.0, 0.0), (1.0, 0.25), (0.0, 0.25)], 12, at=(gx, 3.0, 4.6), rot=(math.pi / 2, 0, 0))
        G.lathe('chrome2', [(0.4, 0.0), (0.4, 0.3), (0.0, 0.3)], 12, at=(gx, 2.9, 4.6), rot=(math.pi / 2, 0, 0))
        for j in range(12):
            a = TAU * j / 12
            G.box('chrome', (gx + 1.08 * math.cos(a), 3.1, 4.6 + 1.08 * math.sin(a)), (0.22, 0.2, 0.22), bevel=0.02, rot=(0, -a, 0))
    G.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.24, rows=(1,), cols=(1,), gap=0.12, jitter=0.0, roles=('g_rock', 'g_rock2', 'g_rock3'), rounded=True, hi_h=0.08)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
