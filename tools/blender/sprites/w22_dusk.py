# World 22 22-1 "The Station of Clocks" (theme w22_dusk): original toon art for a dream station at dusk where every
# clock says 22:22.
#   L0  w22Clocks (base 300, f 0.04, #fff0e0, dyn w22Cards): great cream clock faces hanging on long threads in the
#       dusk, all stopped at 22:22 (the engine drifts the postcards over them); soft, no heavy ink
#   L1  w22Doors  (base 350, f 0.12, #6a5a9a): doors numbered 22 floating in pastel colours over wisps of cloud, above
#       the station's violet viaduct (arched openings) that fills the bottom
#   ground marble: lilac marble blocks with pale veins under a white cap
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU
import w22_kit as WK

MODULE = 'w22_dusk'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 350}
SKY = ['#2a1a4a', '#8a6ab8', '#ffc8b8']
PX = 28.1
DREAM = ('dream1', 'dream2', 'dream3', 'dream4', 'dream5')
PALETTE = {
    'clock_face': '#f6e6de', 'clock_rim': '#c8a8d8', 'clock_hand': '#6a4a8a', 'thread': '#d8c0e8',
    'dream1': '#c8b8ff', 'dream2': '#ffc8d8', 'dream3': '#a8f0e8', 'dream4': '#ffe8b0', 'dream5': '#b8d8ff',
    'door_frame': '#8a7ab8', 'door_plaque': '#f4ecd8', 'door_num': '#4a3a6a', 'door_knob': '#ffd8a0',
    'wisp': '#c8b4e4', 'wisp2': '#d8c4ec',
    'via': '#6a5a9a', 'via_top': '#8a7ab8', 'via_arch': '#4e4080', 'via_lamp_glow': '#ffe0c8',
    'g_cap': '#e8dcff', 'g_cap_hi': '#ffffff', 'g_dirt': '#9a88c8', 'g_rock': '#d2c2f0', 'g_rock2': '#c6b4ea', 'g_rock3': '#dccef4',
    'g_vein': '#ece4ff',
}
K.use(MODULE, PALETTE, LAYERS)


def clocks(L, rng, roles=('clock_face', 'clock_rim', 'clock_hand', 'thread'), n=6):
    B = Builder(L + '_clocks', L)
    S = Builder(L + '_threads', L)
    for k in range(n):
        x = (k + rng.uniform(0.2, 0.8)) * P / n
        r = rng.uniform(0.95, 2.0)
        z = rng.uniform(4.6, 8.4)
        for dx in wraps(x, r + 0.2):
            WK.bg_clock(B, x + dx, 2.0 + rng.uniform(-0.3, 0.3), z, r, face=roles[0], rim=roles[1], hand=roles[2])
            S.rod(roles[3], (x + dx, 2.3, z + r), (x + dx, 2.3, 14.0), 0.025, segs=3)
    ob = B.done(period=None)
    ob['outline'] = 0.5
    os_ = S.done(period=None)
    os_['outline'] = 0


def doors(L, rng, n=5, wisps=True, reflect=None):
    B = Builder(L + '_doors', L)
    W = Builder(L + '_wisps', L)
    R = Builder(L + '_reflect', L) if reflect else None
    for k in range(n):
        x = (k + rng.uniform(0.2, 0.8)) * P / n
        w, h = rng.uniform(0.8, 1.05), rng.uniform(1.45, 1.9)
        z = rng.uniform(0.7, 3.0)
        body = DREAM[k % 5]
        for dx in wraps(x, w):
            WK.bg_door(B, x + dx, 1.4, z, w, h, body)
            if wisps:
                for j in range(3):
                    W.sphere(('wisp', 'wisp2')[j % 2], (x + dx + (j - 1) * 0.55, 1.7, z - 0.05 + 0.12 * (j % 2)), 0.36 + 0.06 * (j % 2), scale=(1.25, 0.5, 0.8), subdiv=2)
            if R is not None:
                R.arch(reflect, (x + dx, 1.8, -z), w, h, 0.02, rot=(0, math.pi, 0))
    ob = B.done(period=None)
    ob['outline'] = 0.6
    ow = W.done(period=None)
    ow['outline'] = 0
    if R is not None:
        orf = R.done(period=None)
        orf['outline'] = 0


def viaduct(L, rng, body='via', top='via_top', arch='via_arch', lamp='via_lamp_glow'):
    plain(L, L + '_via', body, y=2.4, depth=1.0, top=0.0, bottom=-4.5)
    B = Builder(L + '_via_detail', L)
    B.box(top, (P / 2, 1.85, -0.12), (P + 2.0, 0.08, 0.24), bevel=0.0)
    n = 9
    for k in range(n):
        x = (k + 0.5) * P / n
        for dx in wraps(x, 1.6):
            B.arch(arch, (x + dx, 1.84, -4.6), 2.4, 3.6, 0.04)
            B.sphere(lamp, (x + dx + P / n / 2, 1.8, -0.65), 0.12, subdiv=2)
    ob = B.done(period=None)
    ob['outline'] = 0


def build_L0(rng):
    clocks('L0', rng)


def build_L1(rng):
    viaduct('L1', rng)
    doors('L1', rng)


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    c = K.ground_blocks(seed, cap_h=0.28, rows=(1, 1, 2), cols=(1, 2), gap=0.08, jitter=0.25, roles=('g_rock', 'g_rock2', 'g_rock3'), bevel=0.05, hi_h=0.07)
    WK.marble_veins(random.Random(seed + 7), 'g_vein', n_per_tile=1)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
