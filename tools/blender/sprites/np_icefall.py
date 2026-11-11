# Nepal 12-4 "Khumbu Icefall" (theme np_icefall): original toon art for the climb up the great icefall.
#   L0  npIceWall (base 0, f 0.05, #5a98c8): a backdrop of glacier ice: stacked serac blocks in pale and deeper blues,
#       white snow on their tops, dark blue crevasse slots between them, all calm and pale behind the climb
#   ground npGlacier: blue ice blocks under a white snow cap
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU

MODULE = 'np_icefall'
LAYERS = ['L0']
BASES = {'L0': 0}
SKY = ['#8ac8f0', '#c8e8fa', '#f4fbff']
PX = 28.1
PALETTE = {
    'back': '#a8d4f0', 'ice1': '#bfe4f8', 'ice2': '#9acdee', 'ice3': '#86bfe6', 'ice4': '#b0dcf4', 'slot': '#5a98c8',
    'snowtop': '#f4fbff', 'glint': '#e8f8ff',
    'g_cap': '#f4faff', 'g_cap_hi': '#ffffff', 'g_dirt': '#5a98c8', 'g_rock': '#9ad0f0', 'g_rock2': '#86c0e8', 'g_rock3': '#a8daf4',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    # the wall hangs from z = 0 down ~16 m: the deep slots first, then rows of seracs over them
    S = Builder('L0_back', L)
    S.box('slot', (P / 2, 3.0, -8.0), (P + 2.0, 0.5, 18.0), bevel=0.0)
    os_ = S.done(period=None)
    os_['outline'] = 0
    B = Builder('L0_seracs', L)
    T_ = Builder('L0_tops', L)
    z = 0.4
    row = 0
    while z > -16.5:
        h = rng.uniform(1.8, 2.8)
        x = rng.uniform(-1.0, 0.0) + (0.8 if row % 2 else 0.0)
        while x < P:
            w = rng.uniform(1.6, 3.4)
            role = rng.choice(('ice1', 'ice2', 'ice3', 'ice4'))
            tilt = rng.uniform(-0.12, 0.12)
            cx = x + w / 2
            for dx in wraps(cx, w / 2 + 0.3):
                pts = [(-w / 2 + 0.1, -h), (w / 2 - 0.1, -h), (w / 2, -h * 0.3), (w / 2 - rng.uniform(0.1, 0.4), 0.0), (-w / 2 + rng.uniform(0.1, 0.4), rng.uniform(-0.25, 0.0)), (-w / 2, -h * 0.4)]
                B.slab(role, pts, 1.0, at=(cx + dx, 1.0 - 0.3 * (row % 3), z), rot=(0, tilt, 0))
                gx = rng.uniform(-w / 3, w / 3)
                T_.slab('glint', [(gx, -h * 0.75), (gx + 0.1, -h * 0.75), (gx + 0.3, -h * 0.2), (gx + 0.2, -h * 0.2)], 0.9, at=(cx + dx, 0.9 - 0.3 * (row % 3), z), rot=(0, tilt, 0))
            x += w + rng.uniform(0.12, 0.3)
        z -= h + rng.uniform(0.1, 0.3)
        row += 1
    ob = B.done(period=None)
    ob['outline'] = 0.6
    ot = T_.done(period=None)
    ot['outline'] = 0


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.26, rows=(1, 2), cols=(1, 2), gap=0.08, jitter=0.35, roles=('g_rock', 'g_rock2', 'g_rock3'), bevel=0.08, hi_h=0.08)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
