# World 22 22-4 "The 22nd Door" (theme w22_white): original toon art for the quiet white dream room of the last door.
#   L0  w22White (base 360, f 0.06, #f4f0ff): a full pale backdrop: a soft lilac-white wall with faint panels, one
#       great faint clock face (22:22, no ink, so the arena's own clock reads first) high in the middle, four tall pastel doors numbered 22 standing on the floor line,
#       everything pale and calm so the mirror fight stays on top
#   ground marble: white marble blocks with faint lilac veins
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU
import w22_kit as WK

MODULE = 'w22_white'
LAYERS = ['L0']
BASES = {'L0': 360}
SKY = ['#e8e0ff', '#fff4f8', '#ffffff']
PX = 28.1
PALETTE = {
    'wall': '#f2eefc', 'panel': '#e8e2f8', 'floorline': '#ddd4f0', 'floor': '#e4dcf4',
    'dream1': '#d8ccff', 'dream2': '#ffd8e4', 'dream3': '#c4f4ee', 'dream4': '#fff0c8',
    'door_frame': '#c8bce4', 'door_plaque': '#fffaf0', 'door_num': '#8a7ab8', 'door_knob': '#f0d0a0',
    'clock_face': '#fbf8fd', 'clock_rim': '#e8e2f6', 'clock_hand': '#8a7ab8', 'clock_faint': '#ddd4ee',
    'g_cap': '#ffffff', 'g_cap_hi': '#ffffff', 'g_dirt': '#cfc6e6', 'g_rock': '#f0ecfa', 'g_rock2': '#e6e0f6', 'g_rock3': '#f6f2fe',
    'g_vein': '#d8cef0',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_wall', 'wall', y=3.0, depth=1.0, top=14.0, bottom=-4.0)['outline'] = 0
    W = Builder('L0_panels', L)
    for k in range(8):
        x = (k + 0.5) * P / 8
        for dx in wraps(x, 1.8):
            W.box('panel', (x + dx, 2.45, 4.6), (3.2, 0.04, 6.6), bevel=0.2)
    W.box('floorline', (P / 2, 2.4, 0.06), (P + 2.0, 0.06, 0.12), bevel=0.0)
    W.box('floor', (P / 2, 2.4, -2.0), (P + 2.0, 0.06, 4.0), bevel=0.0)
    W.done(period=None)['outline'] = 0
    # one great clock, kept faint (no ink, pale hands) so the arena's own 22:22 clock is the one that reads
    C = Builder('L0_clock', L)
    WK.bg_clock(C, P / 2, 2.2, 5.34, 3.2, face='clock_face', rim='clock_rim', hand='clock_faint', depth=0.2)
    C.done(period=None)['outline'] = 0
    B = Builder('L0_props', L)
    for k in range(4):
        x = 4.3 + k * 9.25
        WK.bg_door(B, x, 2.0, 0.0, 1.2, 2.28, ('dream1', 'dream2', 'dream3', 'dream4')[k])
    B.done(period=None)['outline'] = 0.45


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    c = K.ground_blocks(seed, cap_h=0.26, rows=(1, 1, 2), cols=(1, 2), gap=0.08, jitter=0.25, roles=('g_rock', 'g_rock2', 'g_rock3'), bevel=0.05, hi_h=0.07)
    WK.marble_veins(random.Random(seed + 7), 'g_vein', n_per_tile=1)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
