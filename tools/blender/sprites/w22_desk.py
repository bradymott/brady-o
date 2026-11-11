# World 22 overhaul theme w22_desk (22-5 "The Writer's Desk", level overhaul §2/§8: N w22_desk): a tiny Brady crosses
# a giant writer's desk at night. Original toon art, a nod to Brady's novel "22" (nothing from it retold).
# Suggested theme entry: sky ['#1e1830', '#3a2c48', '#5a4258'], ground 'wood', darkness 0.15, liquid 'dream',
# layers [{kind:'w22Study', color:'#5a4060', base:300, f:0.04}, {kind:'w22DeskTop', color:'#6a4a3a', base:350, f:0.12}].
#   L0  w22Study   (base 300, f 0.04): the study wall: plum striped wallpaper, a tall window on the night (a moon, a
#       few stars), a bookcase of coloured spines, a small framed "22"
#   L1  w22DeskTop (base 350, f 0.12): the far edge of the giant desk: an angled desk lamp with a glowing shade, a
#       steaming coffee mug, a pencil cup, books leaning on each other (tilted, so nothing reads as a ledge), an ink
#       bottle with a quill, crumpled pages; the desk's dark top fills the bottom
#   ground wood: the desk top, long honey boards with grain lines
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU
import w22_kit as WK

MODULE = 'w22_desk'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 350}
SKY = ['#1e1830', '#3a2c48', '#5a4258']
PX = 28.1
BOOKS = ('book1', 'book2', 'book3', 'book4', 'book5')
PALETTE = {
    'paper': '#4e3858', 'stripe': '#584262', 'win_frame': '#6a4a3a', 'win_night': '#1c2448', 'moon_glow': '#fff2d0',
    'star_glow': '#fff8e0', 'shelf': '#4a3028', 'shelf2': '#3a241e', 'frame': '#a8803a', 'frame_in': '#f4ecd8', 'num': '#4e3858',
    'book1': '#8a3a4a', 'book2': '#3a5a8a', 'book3': '#4a7a5a', 'book4': '#b08a3a', 'book5': '#6a4a8a', 'band': '#e8c870',
    'desk': '#5a3e30', 'desk_edge': '#6e4c3a',
    'lamp': '#3a4a6a', 'lamp2': '#2a3650', 'shade_glow': '#ffe6a8', 'mug': '#e8e0f0', 'mug2': '#c8b8e0', 'coffee': '#4a2a1a',
    'steam': '#e8dcf0', 'cup': '#c8504a', 'pencil': '#ffc840', 'pencil_tip': '#3a2a2a', 'wood_tip': '#f0c890', 'eraser': '#ff9aa8',
    'ink': '#2a2a4a', 'ink_label': '#f4ecd8', 'quill': '#f4f0e8', 'quill2': '#c8b8d8', 'page': '#f4ecd8', 'page2': '#e0d4bc',
    'g_cap': '#c8925a', 'g_cap_hi': '#e8b47a', 'g_dirt': '#7a5032', 'g_rock': '#b07a48', 'g_rock2': '#a8723e', 'g_rock3': '#b88250',
    'g_vein': '#94603a',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_wall', 'paper', y=3.0, depth=1.0, top=11.0, bottom=-4.0)['outline'] = 0
    S = Builder('L0_stripes', L)
    for k in range(int(P / 0.9)):
        x = k * 0.9
        S.box('stripe', (x + 0.2, 2.45, 3.5), (0.32, 0.02, 15.0), bevel=0.0)
    S.done(period=None)['outline'] = 0
    B = Builder('L0_props', L)
    G = Builder('L0_glow', L)
    for k in range(2):
        x0 = k * P / 2
        # a tall window on the night
        wx = x0 + 4.0
        B.box('win_frame', (wx, 2.2, 5.2), (4.0, 0.12, 5.6), bevel=0.06)
        B.box('win_night', (wx, 2.1, 5.2), (3.5, 0.06, 5.1), bevel=0.0)
        B.box('win_frame', (wx, 2.0, 5.2), (0.14, 0.06, 5.1), bevel=0.0)
        B.box('win_frame', (wx, 2.0, 5.6), (3.5, 0.06, 0.14), bevel=0.0)
        G.sphere('moon_glow', (wx + 0.9 - 1.8 * k, 1.95, 6.8), 0.5, scale=(1, 0.3, 1), subdiv=2)
        for j in range(6):
            G.sphere('star_glow', (wx + rng.uniform(-1.5, 1.5), 1.95, rng.uniform(3.2, 7.4)), 0.05, subdiv=1)
        # a bookcase of coloured spines
        bx = x0 + 11.5
        B.box('shelf2', (bx, 2.25, 3.4), (4.4, 0.1, 7.0), bevel=0.04)
        for r in range(4):
            z0 = 0.2 + r * 1.7
            B.box('shelf', (bx, 2.1, z0), (4.4, 0.3, 0.14), bevel=0.02)
            x = bx - 2.0
            while x < bx + 1.9:
                w = rng.uniform(0.18, 0.32)
                h = rng.uniform(1.0, 1.45)
                tilt = rng.uniform(-0.06, 0.06) if rng.random() < 0.8 else 0.3
                role = rng.choice(BOOKS)
                B.box(role, (x + w / 2, 2.0, z0 + 0.07 + h / 2), (w, 0.3, h), bevel=0.02, rot=(0, tilt, 0))
                B.box('band', (x + w / 2, 1.84, z0 + 0.07 + h * 0.75), (w, 0.02, 0.06), bevel=0.0, rot=(0, tilt, 0))
                x += w + 0.02
        # a little framed "22"
        fx = x0 + 15.6
        B.box('frame', (fx, 2.2, 4.4), (1.1, 0.08, 1.3), bevel=0.04)
        B.box('frame_in', (fx, 2.12, 4.4), (0.86, 0.04, 1.06), bevel=0.0)
        WK.bg_text(B, 'num', '22', fx, 2.06, 4.4, 0.55, extrude=0.02)
    B.done(period=None)['outline'] = 0.5
    G.done(period=None)['outline'] = 0


def lamp(B, G, x, s=1.0):
    B.lathe('lamp', [(0.7 * s, 0.0), (0.7 * s, 0.12 * s), (0.2 * s, 0.22 * s), (0.0, 0.22 * s)], 16, at=(x, 1.2, 0.0), yscale=0.5, smooth=True)
    j1 = (x + 0.2 * s, 1.1, 2.4 * s)
    j2 = (x + 1.6 * s, 1.1, 3.3 * s)
    B.rod('lamp2', (x, 1.1, 0.2 * s), j1, 0.09 * s, segs=6)
    B.rod('lamp2', j1, j2, 0.08 * s, segs=6)
    B.sphere('lamp', j1, 0.16 * s, subdiv=1)
    B.lathe('lamp', [(0.7 * s, 0.0), (0.4 * s, 0.5 * s), (0.12 * s, 0.7 * s), (0.0, 0.72 * s)], 16, at=(j2[0] + 0.3 * s, 1.0, j2[2] - 0.45 * s), rot=(0, 0.5, 0), smooth=True)
    G.lathe('shade_glow', [(0.62 * s, 0.0), (0.0, 0.0)], 16, at=(j2[0] + 0.3 * s, 0.95, j2[2] - 0.46 * s), rot=(0, 0.5, 0), cap_bottom=True)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_desk', 'desk', y=2.4, depth=1.0, top=0.0, bottom=-4.5)['outline'] = 0
    E = Builder('L1_edge', L)
    E.box('desk_edge', (P / 2, 1.88, -0.1), (P + 2.0, 0.04, 0.2), bevel=0.0)
    E.done(period=None)['outline'] = 0
    B = Builder('L1_clutter', L)
    G = Builder('L1_glow', L)
    W = Builder('L1_steam', L)
    seq = ['lamp', 'books', 'mug', 'pages', 'cup', 'ink', 'books', 'pages']
    x = 1.5
    for k, kind in enumerate(seq):
        if kind == 'lamp':
            for dx in wraps(x, 2.6):
                lamp(B, G, x + dx, 1.25)
            x += 6.0
        elif kind == 'books':
            n = rng.randrange(3, 5)
            for j in range(n):
                w, h = rng.uniform(0.35, 0.55), rng.uniform(2.0, 2.9)
                lean = 0.0 if j == 0 else rng.uniform(0.18, 0.35)
                for dx in wraps(x, 1.0):
                    B.box(rng.choice(BOOKS), (x + dx + math.sin(lean) * h / 2, 1.3 + 0.1 * j, h / 2 * math.cos(lean)), (w, 0.9, h), bevel=0.04, rot=(0, lean, 0))
                x += w * 0.9 + 0.05
            x += 2.4
        elif kind == 'mug':
            for dx in wraps(x + 0.9, 1.4):
                cx = x + 0.9 + dx
                B.lathe('mug', [(0.8, 0.0), (0.85, 1.6), (0.8, 1.62)], 20, at=(cx, 1.3, 0.0), yscale=0.6, smooth=True, cap_bottom=True)
                B.box('mug2', (cx, 0.75, 0.8), (1.7, 0.04, 0.3), bevel=0.0)
                B.lathe('coffee', [(0.74, 0.0), (0.0, 0.0)], 20, at=(cx, 1.3, 1.55), yscale=0.6, cap_bottom=True)
                B.slab('mug', [(0.0, -0.3), (0.45, -0.25), (0.55, 0.25), (0.05, 0.35), (0.0, 0.2), (0.38, 0.12), (0.32, -0.12), (0.0, -0.12)], 0.2, at=(cx + 0.82, 1.1, 0.85))
                for j in range(3):
                    W.sphere('steam', (cx - 0.3 + 0.3 * j, 1.0, 2.0 + 0.5 * j + 0.2 * (j % 2)), 0.25 + 0.06 * j, scale=(0.9, 0.4, 1.2), subdiv=2)
            x += 3.4
        elif kind == 'cup':
            for dx in wraps(x + 0.6, 1.0):
                cx = x + 0.6 + dx
                B.lathe('cup', [(0.5, 0.0), (0.55, 1.4), (0.5, 1.42)], 16, at=(cx, 1.3, 0.0), yscale=0.6, smooth=True, cap_bottom=True)
                for j, (ox, h, a) in enumerate(((-0.25, 2.4, 0.12), (0.0, 2.8, -0.05), (0.22, 2.2, -0.2))):
                    base = (cx + ox, 1.1, 1.0)
                    top = (cx + ox + math.sin(a) * h, 1.1, 1.0 + math.cos(a) * h)
                    B.rod('pencil', base, top, 0.1, segs=6)
                    B.rod('eraser', top, (top[0] + math.sin(a) * 0.25, 1.1, top[2] + math.cos(a) * 0.25), 0.1, segs=6)
            x += 2.6
        elif kind == 'ink':
            for dx in wraps(x + 0.6, 1.0):
                cx = x + 0.6 + dx
                B.lathe('ink', [(0.6, 0.0), (0.62, 0.7), (0.3, 0.9), (0.25, 1.15), (0.3, 1.2), (0.0, 1.2)], 16, at=(cx, 1.3, 0.0), yscale=0.6, smooth=True, cap_bottom=True)
                B.box('ink_label', (cx, 0.9, 0.38), (0.9, 0.04, 0.4), bevel=0.0)
                B.slab('quill', [(0.0, 0.0), (0.25, 1.0), (0.2, 2.6), (0.0, 2.9), (-0.1, 2.3), (-0.05, 0.9)], 0.06, at=(cx + 0.1, 1.0, 1.0), rot=(0, 0.35, 0))
                B.rod('quill2', (cx + 0.1, 0.95, 1.0), (cx + 0.1 + 0.9, 0.95, 3.6), 0.025, segs=4)
            x += 2.4
        else:
            for j in range(rng.randrange(2, 4)):
                for dx in wraps(x + 0.4, 0.8):
                    B.sphere(('page', 'page2')[j % 2], (x + dx + 0.4, 1.0 + 0.1 * j, 0.36), 0.42, scale=(1.0, 0.9, 0.85), subdiv=1)
                x += rng.uniform(0.7, 1.1)
            x += 1.6
        if x > P - 2.0:
            break
    B.done(period=None)['outline'] = 0.6
    G.done(period=None)['outline'] = 0
    W.done(period=None)['outline'] = 0


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    c = K.ground_blocks(seed, cap_h=0.24, rows=(1,), cols=(1,), gap=0.06, jitter=0.1, roles=('g_rock', 'g_rock2', 'g_rock3'), bevel=0.03, hi_h=0.06)
    WK.marble_veins(random.Random(seed + 3), 'g_vein', n_per_tile=1)
    return c


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
