# World 22 22-2 "Mirror Lake" (theme w22_lake): original toon art for the still lake of the dream, in teal and lilac.
#   L0  w22Clocks (base 300, f 0.04, #e8fff8, dyn w22Cards): pale mint clock faces hanging on threads, all at 22:22
#   L1  w22Doors  (base 345, f 0.1, #3a6a7a): pastel doors numbered 22 floating on little clouds over the lake; the
#       still water fills the bottom and mirrors each door upside down, faintly
#   ground marble: pale teal marble blocks with white veins under a mint cap
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU
import w22_kit as WK
import w22_dusk as D

MODULE = 'w22_lake'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 345}
SKY = ['#1a3a4a', '#6ab8b8', '#e8d8ff']
PX = 28.1
PALETTE = {
    'clock_face': '#e6f8f2', 'clock_rim': '#8acac4', 'clock_hand': '#2a5a6a', 'thread': '#a8dcd6',
    'dream1': '#c8b8ff', 'dream2': '#ffc8d8', 'dream3': '#a8f0e8', 'dream4': '#ffe8b0', 'dream5': '#b8d8ff',
    'door_frame': '#5a8a9a', 'door_plaque': '#f4ecd8', 'door_num': '#2a4a5a', 'door_knob': '#ffd8a0',
    'wisp': '#bfe4e4', 'wisp2': '#d4eeee',
    'lake': '#3a6a7a', 'lake_hi': '#9ad8d4', 'lake_line': '#5a8e9c', 'reflect': '#5a8a9c',
    'g_cap': '#d8fff8', 'g_cap_hi': '#ffffff', 'g_dirt': '#6a9aaa', 'g_rock': '#a8d0d8', 'g_rock2': '#9cc6d0', 'g_rock3': '#b4dae0',
    'g_vein': '#e4f6f8',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    D.clocks('L0', rng)


def build_L1(rng):
    plain('L1', 'L1_lake', 'lake', y=2.4, depth=1.0, top=0.0, bottom=-4.5)['outline'] = 0
    B = Builder('L1_lake_lines', 'L1')
    B.box('lake_hi', (P / 2, 1.85, -0.05), (P + 2.0, 0.06, 0.1), bevel=0.0)
    for k in range(16):
        x = (k + rng.uniform(0.1, 0.9)) * P / 16
        w = rng.uniform(0.8, 2.0)
        for dx in wraps(x, w):
            B.box('lake_line', (x + dx, 1.82, -rng.uniform(0.4, 3.0)), (w, 0.04, 0.05), bevel=0.0)
    B.done(period=None)['outline'] = 0
    D.doors('L1', rng, reflect='reflect')


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
