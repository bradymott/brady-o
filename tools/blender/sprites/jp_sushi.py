# Japan 11-3 "Sushi Carousel" (theme jp_sushi): original toon art for the giant conveyor-belt sushi bar.
#   L0  jpSushiBar (base 336, f 0.08, #c89a62, dyn jpBelt): the back wall as a backdrop: warm vertical wood slats, a
#       dark beam, indigo noren curtains with white wave arcs, white paper lanterns with a red band (no writing), a row
#       of picture menu boards (nigiri, maki, tea: pictures, never words), a shelf of tea cups, the back counter low
#       down (kept soft and unlined so it never reads as a ledge; the engine runs the plate belt over it)
#   ground jpCounter: pale hinoki counter planks with a light lip
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU

MODULE = 'jp_sushi'
LAYERS = ['L0']
BASES = {'L0': 336}
SKY = ['#5a3a24', '#7a5236', '#9a6a44']
PX = 28.1
PALETTE = {
    'slat': '#c89a62', 'slat2': '#bc8e58', 'slat3': '#d4a66c', 'beam': '#7a5232', 'beam2': '#6a4428',
    'noren': '#26408a', 'noren_w': '#eef2ff', 'rod': '#5a3a22',
    'paper': '#fff4e0', 'band': '#c8322a', 'cap': '#2a1a10',
    'board': '#f2e6c8', 'board_rim': '#6a4a2a', 'pin': '#c8322a',
    'rice': '#ffffff', 'salmon': '#ff7a4a', 'salmon2': '#ffb08a', 'egg': '#ffd23a', 'nori': '#1a2a1a', 'tuna': '#e8384f',
    'tea': '#7aa04a', 'tea2': '#c8e08a', 'steam': '#ffffff',
    'shelf': '#8a5a34', 'cup1': '#e8e0d0', 'cup2': '#5a7a9a', 'cup3': '#c8a07a', 'cup4': '#4a4a54',
    'ctop': '#d8b07a', 'cbody': '#b08454', 'cbody2': '#a47a4a',
    'g_cap': '#f2d8a8', 'g_cap_hi': '#fff6e0', 'g_dirt': '#b8905c', 'g_rock': '#d8b07a', 'g_rock2': '#cca470',
}
K.use(MODULE, PALETTE, LAYERS)
Z = lambda row: (336 - row) / PX          # a painter row (px from the top) -> z (m) on this layer


def menu_board(B, x, rng, k):
    zt, zb = Z(76), Z(134)
    w = 44 / PX
    B.box('board_rim', (x, 0.3, (zt + zb) / 2), (w + 0.12, 0.12, zt - zb + 0.12), bevel=0.03)
    B.box('board', (x, 0.22, (zt + zb) / 2), (w, 0.1, zt - zb), bevel=0.0)
    B.sphere('pin', (x + w * 0.36, 0.14, zt - 0.16), 0.07, subdiv=1)
    cz = Z(108)
    y = 0.14
    if k == 0:          # salmon nigiri
        B.box('rice', (x, y, cz - 0.1), (0.85, 0.06, 0.32), bevel=0.06)
        B.box('salmon', (x, y - 0.02, cz + 0.12), (0.95, 0.06, 0.24), bevel=0.06)
        for j in range(-2, 3):
            B.box('salmon2', (x + j * 0.16, y - 0.05, cz + 0.12), (0.04, 0.02, 0.2), bevel=0.0)
    elif k == 1:        # two maki rolls
        for dx in (-0.3, 0.3):
            B.lathe('nori', [(0.28, 0.0), (0.28, 0.06), (0.0, 0.06)], 12, at=(x + dx, y + 0.02, cz), rot=(math.pi / 2, 0, 0))
            B.lathe('rice', [(0.21, 0.0), (0.21, 0.08), (0.0, 0.08)], 12, at=(x + dx, y + 0.0, cz), rot=(math.pi / 2, 0, 0))
            B.lathe('tuna', [(0.09, 0.0), (0.09, 0.1), (0.0, 0.1)], 8, at=(x + dx, y - 0.02, cz), rot=(math.pi / 2, 0, 0))
    elif k == 2:        # a cup of green tea with steam
        B.box('tea', (x, y, cz - 0.08), (0.5, 0.06, 0.66), bevel=0.08)
        B.box('tea2', (x, y - 0.02, cz + 0.27), (0.5, 0.06, 0.08), bevel=0.0)
        for j in (-1, 1):
            B.sphere('steam', (x + j * 0.1, y - 0.02, cz + 0.55 + 0.06 * j), 0.07, scale=(0.8, 0.3, 1.3), subdiv=1)
    else:               # egg nigiri with a nori belt
        B.box('rice', (x, y, cz - 0.1), (0.85, 0.06, 0.32), bevel=0.06)
        B.box('egg', (x, y - 0.02, cz + 0.12), (0.9, 0.06, 0.3), bevel=0.04)
        B.box('nori', (x, y - 0.05, cz + 0.02), (0.2, 0.04, 0.62), bevel=0.0)


def build_L0(rng):
    L = 'L0'
    # the wall: vertical slats from below the floor to above the top of the view
    W = Builder('L0_wall', L)
    n = int(P / (22 / PX))
    sw = P / n
    for k in range(n + 2):
        x = (k - 1 + 0.5) * sw
        W.box(('slat', 'slat2', 'slat3')[k % 3], (x, 1.0, 4.5), (sw - 0.03, 0.6, 17.0), bevel=0.0)
    ow = W.done(period=None)
    ow['outline'] = 0
    B = Builder('L0_beams', L)
    B.box('beam', (P / 2, 0.5, Z(64)), (P + 2.0, 0.6, 8 / PX * 1.6), bevel=0.0)
    B.box('beam2', (P / 2, 0.5, Z(336 - 70)), (P + 2.0, 0.6, 0.18), bevel=0.0)
    ob = B.done(period=None)
    ob['outline'] = 0.6
    # noren curtains and paper lanterns, alternating along the wall
    N = Builder('L0_noren', L)
    A = Builder('L0_waves', L)
    for g in range(4):
        x0 = g * P / 4 + 40 / PX
        N.rod('rod', (x0 - 0.2, 0.0, Z(4)), (x0 + 116 / PX + 0.2, 0.0, Z(4)), 0.06, segs=6)
        for k in range(4):
            px = x0 + (k * 26 + 12) / PX
            N.box('noren', (px, -0.05, (Z(6) + Z(56)) / 2), (24 / PX, 0.06, Z(6) - Z(56)), bevel=0.0)
            for j in range(3):
                r = (8 - j * 2) / PX
                cz = Z(40 + j * 5)
                arc = [(r * math.cos(math.pi * i / 8), r * math.sin(math.pi * i / 8)) for i in range(9)]
                for (ax, az), (bx, bz) in zip(arc, arc[1:]):
                    A.rod('noren_w', (px + ax, -0.1, cz + az), (px + bx, -0.1, cz + bz), 0.035, segs=4)
        lx = x0 + 160 / PX
        for dx in (0.0, 34 / PX):
            x = lx + dx
            N.rod('cap', (x, 0.0, Z(0) + 0.3), (x, 0.0, Z(18)), 0.02, segs=4)
            N.lathe('paper', [(0.0, -0.58), (0.26, -0.5), (0.42, -0.28), (0.44, 0.0), (0.42, 0.28), (0.26, 0.5), (0.0, 0.58)], 12, at=(x, -0.2, Z(34)))
            N.lathe('band', [(0.445, -0.1), (0.445, 0.1), (0.0, 0.1)], 12, at=(x, -0.2, Z(34)), cap_top=False)
            N.box('cap', (x, -0.2, Z(34) + 0.6), (0.4, 0.4, 0.1), bevel=0.02)
            N.box('cap', (x, -0.2, Z(34) - 0.6), (0.4, 0.4, 0.1), bevel=0.02)
    N.done()
    oa = A.done()
    oa['outline'] = 0
    M = Builder('L0_menu', L)
    for k in range(16):
        x = (30 + 22 + k * 64) / PX
        menu_board(M, x, rng, (k * 3 + k // 4) % 4)
    M.done()
    # the cup shelf, dark and thin, with cups standing on it
    S = Builder('L0_shelf', L)
    S.box('shelf', (P / 2, 0.3, Z(336 - 110)), (P + 2.0, 0.5, 0.12), bevel=0.0)
    x = 0.4
    while x < P - 0.4:
        c = rng.choice(('cup1', 'cup2', 'cup3', 'cup4'))
        S.lathe(c, [(0.0, 0.0), (0.24, 0.0), (0.3, 0.72), (0.0, 0.72)], 10, at=(x, 0.2, Z(336 - 110) + 0.06))
        x += rng.uniform(1.0, 1.5)
    os_ = S.done(period=None)
    os_['outline'] = 0.6
    # the back counter: a soft band low on the wall (unlined: the engine's plate belt runs over it)
    C = Builder('L0_counter', L)
    C.box('ctop', (P / 2, -0.2, Z(336 - 36) - 0.2), (P + 2.0, 0.8, 0.42), bevel=0.0)
    C.box('cbody', (P / 2, -0.1, (Z(336 - 24) - 4.0) / 2 - 0.4), (P + 2.0, 0.8, Z(336 - 24) + 4.0), bevel=0.0)
    for k in range(int(P / 2.3) + 1):
        C.box('cbody2', (k * 2.3, -0.55, -1.5), (0.1, 0.05, 3.4), bevel=0.0)
    oc = C.done(period=None)
    oc['outline'] = 0


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.22, rows=(2, 3), cols=(1,), gap=0.07, jitter=0.15, roles=('g_rock', 'g_rock2'), bevel=0.03, hi_h=0.06)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
