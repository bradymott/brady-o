# World 22 22-3 "The Endless Corridor" (theme w22_corridor): original toon art for the corridor that loops forever.
#   L0  w22Hall (base 360, f 0.06, #4a3458): a full backdrop of the hall: plum wallpaper with a soft diamond pattern, a
#       dado rail over panelled wainscot, doors numbered 22 every few steps under small brass lamps (unlit glow
#       shades), clocks between them all stopped at 22:22, a picture frame or two; the floor line below the doors
#   ground wood: warm parquet planks under a polished cap
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU
import w22_kit as WK

MODULE = 'w22_corridor'
LAYERS = ['L0']
BASES = {'L0': 360}
SKY = ['#1a1024', '#2a1a3a', '#3a2848']
PX = 28.1
PALETTE = {
    'paper': '#4a3458', 'paper_dot': '#56406a', 'rail': '#6a4a5a', 'wains': '#3a2840', 'wains_panel': '#44304e',
    'skirt': '#2a1c30', 'floor': '#2e1e2a',
    'door1': '#7a5a8a', 'door2': '#8a6070', 'door3': '#5a6a8a', 'door_frame': '#2e2036', 'door_plaque': '#f4ecd8',
    'door_num': '#3a2a4a', 'door_knob': '#ffd8a0',
    'clock_face': '#f4ecd8', 'clock_rim': '#8a6a3a', 'clock_hand': '#3a2a4a',
    'lamp': '#6a5040', 'shade_glow': '#ffe0b0', 'frame': '#8a6a3a', 'pic': '#5a6a8a', 'pic2': '#c8a0b8',
    'g_cap': '#8a5a4a', 'g_cap_hi': '#b88a6a', 'g_dirt': '#4a3026', 'g_rock': '#7a4e3c', 'g_rock2': '#6a4232', 'g_rock3': '#845844',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_wall', 'paper', y=3.0, depth=1.0, top=14.0, bottom=-4.0)['outline'] = 0
    D = Builder('L0_pattern', L)
    for row in range(14):
        z = 2.4 + row * 0.8
        for k in range(int(P / 0.8)):
            x = k * 0.8 + (0.4 if row % 2 else 0.0)
            for dx in wraps(x, 0.15):
                D.slab('paper_dot', [(-0.12, 0.0), (0.0, -0.16), (0.12, 0.0), (0.0, 0.16)], 0.02, at=(x + dx, 2.45, z))
    D.done(period=None)['outline'] = 0
    W = Builder('L0_wains', L)
    W.box('wains', (P / 2, 2.4, 0.9), (P + 2.0, 0.1, 1.8), bevel=0.0)
    W.box('rail', (P / 2, 2.3, 1.85), (P + 2.0, 0.12, 0.14), bevel=0.02)
    W.box('skirt', (P / 2, 2.3, 0.12), (P + 2.0, 0.12, 0.24), bevel=0.0)
    W.box('floor', (P / 2, 2.3, -2.0), (P + 2.0, 0.12, 4.0), bevel=0.0)
    for k in range(int(P / 1.6)):
        x = k * 1.6 + 0.8
        for dx in wraps(x, 0.7):
            W.box('wains_panel', (x + dx, 2.32, 0.95), (1.2, 0.04, 1.2), bevel=0.04)
    W.done(period=None)['outline'] = 0.4
    B = Builder('L0_props', L)
    G = Builder('L0_glow', L)
    step = P / 4
    for k in range(4):
        x = k * step + step * 0.25
        WK.bg_door(B, x, 2.0, 0.0, 1.07, 1.92, ('door1', 'door2', 'door3', 'door1')[k])
        B.rod('lamp', (x - 0.85, 2.1, 2.6), (x - 0.85, 2.1, 2.9), 0.04, segs=5)
        G.lathe('shade_glow', [(0.18, 0.0), (0.1, 0.22), (0.0, 0.22)], 10, at=(x - 0.85, 2.0, 2.4), cap_bottom=True)
        G.lathe('shade_glow', [(0.18, 0.0), (0.1, 0.22), (0.0, 0.22)], 10, at=(x + 0.85, 2.0, 2.4), cap_bottom=True)
        B.rod('lamp', (x + 0.85, 2.1, 2.6), (x + 0.85, 2.1, 2.9), 0.04, segs=5)
        cx = x + step / 2
        WK.bg_clock(B, cx, 2.0, 3.2, 0.64, face='clock_face', rim='clock_rim', hand='clock_hand')
        if k % 2 == 0:
            B.box('frame', (cx, 2.1, 1.2 + 4.2), (1.3, 0.08, 0.9), bevel=0.04)
            B.box(('pic', 'pic2')[k // 2], (cx, 2.0, 1.2 + 4.2), (1.05, 0.06, 0.66), bevel=0.0)
    B.done(period=None)['outline'] = 0.6
    G.done(period=None)['outline'] = 0.3


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def plank_cap(B, rng, x0, x1):
    xc = rng.uniform(x0 + 0.3, x1 - 0.3)
    B.box('g_cap_hi', (xc, -0.4, -0.12), (0.12, 0.02, 0.03), bevel=0.0)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.24, rows=(2,), cols=(1, 2), gap=0.06, jitter=0.15, roles=('g_rock', 'g_rock2', 'g_rock3'), bevel=0.03, hi_h=0.06)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
