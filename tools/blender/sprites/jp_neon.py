# Japan 11-4 "Neon Batting Cages" (theme jp_neon): original toon art for the night city behind the batting cages.
#   L0  jpNeonCity (base 300, f 0.04, #1a1430, blur): far towers as deep violet silhouettes, a scatter of warm and cool
#       lit windows (unlit 'glow' materials), aerials and roof boxes
#   L1  jpNeonCity (base 330, f 0.1, #241a3e, dyn jpNeonBlink): nearer, lighter blocks with rows of windows, rooftop water
#       tanks and tall vertical neon sign boxes drawn as glowing tubes (rings and bars: pictures, never words); the
#       engine blinks more signs on top
#   L2  jpNets (base 352, f 0.2, #5aff9a): the batting-cage net (an unlined diamond mesh) on tall poles with floodlights
#   ground jpAsphalt: dark asphalt slabs under a kerb with a cyan neon edge and white dashes
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU

MODULE = 'jp_neon'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 300, 'L1': 330, 'L2': 352}
SKY = ['#0a0620', '#1e0e3a', '#3a1450']
PX = 28.1
NEON = ('n_pink_glow', 'n_cyan_glow', 'n_yellow_glow', 'n_green_glow', 'n_violet_glow', 'n_orange_glow')
PALETTE = {
    'far': '#1e1636', 'far2': '#241a40', 'farwin_glow': '#8a6a7a', 'farwin2_glow': '#5a6a8a',
    'near': '#2c2048', 'near2': '#34264f', 'near3': '#3a2a56', 'roof': '#1e1634', 'tank': '#4a3a64',
    'win_glow': '#ffd896', 'win2_glow': '#9adcff', 'signbox': '#120c22',
    'n_pink_glow': '#ff3a8a', 'n_cyan_glow': '#3af0ff', 'n_yellow_glow': '#ffe03a', 'n_green_glow': '#7aff5a',
    'n_violet_glow': '#b85aff', 'n_orange_glow': '#ff8a2a',
    'net_glow': '#2a8a6a', 'pole': '#3a3a48', 'lamp': '#5a5a68', 'lamp_glow': '#fffbe0', 'rail': '#2e2e3c',
    'g_cap': '#4a4a5a', 'g_cap_hi': '#3af0ff', 'g_dirt': '#26262e', 'g_rock': '#34343e', 'g_rock2': '#2e2e38', 'g_dash': '#e8e8e0',
}
K.use(MODULE, PALETTE, LAYERS)


def skyline(L, rng, base_role, roles, hmin, hmax, wmin, wmax, win, win_p, signs, y=0.0, tanks=False):
    B = Builder(L + '_blocks', L)
    W = Builder(L + '_windows', L)
    S = Builder(L + '_signs', L)
    x = 0.0
    while x < P:
        w = rng.uniform(wmin, wmax)
        h = rng.uniform(hmin, hmax)
        xc = x + w / 2
        role = rng.choice(roles)
        for dx in wraps(xc, w / 2 + 0.6):
            B.box(role, (xc + dx, y, (h - 4.0) / 2), (w - 0.06, 1.0, h + 4.0), bevel=0.0)
        r2 = random.Random(int(x * 100))
        cols = max(2, int((w - 0.5) / 0.32))
        for j in range(int((h - 0.3) / 0.42)):
            for i in range(cols):
                if r2.random() < win_p:
                    wx = xc - w / 2 + 0.3 + i * (w - 0.6) / max(1, cols - 1)
                    wz = h - 0.4 - j * 0.42
                    for dx in wraps(wx, 0.1):
                        W.box(win[0] if r2.random() < 0.8 else win[1], (wx + dx, y - 0.52, wz), (0.14, 0.04, 0.18), bevel=0.0)
        if r2.random() < 0.45:
            for dx in wraps(xc, 0.6):
                B.box('roof', (xc + dx, y, h + 0.22), (0.56, 0.6, 0.44), bevel=0.0)
                B.rod('roof', (xc + dx + 0.1, y, h + 0.4), (xc + dx + 0.1, y, h + 1.1), 0.035, segs=4)
        if tanks and r2.random() < 0.5:
            tx = xc - w / 4
            for dx in wraps(tx, 0.4):
                B.lathe('tank', [(0.3, 0.0), (0.3, 0.6), (0.22, 0.72), (0.0, 0.74)], 10, at=(tx + dx, y, h + 0.25))
                for sx in (-0.2, 0.2):
                    B.rod('roof', (tx + dx + sx, y, h), (tx + dx + sx, y, h + 0.26), 0.03, segs=4)
        if signs and r2.random() < signs:
            sx = xc - w / 2 + 0.3 if r2.random() < 0.5 else xc + w / 2 - 0.3
            sz = h - 0.4
            col = r2.choice(NEON)
            sh_ = 2.6
            for dx in wraps(sx, 0.3):
                S.box('signbox', (sx + dx, y - 0.62, sz - sh_ / 2), (0.56, 0.12, sh_), bevel=0.03)
                # the glowing tube: a rounded frame and four rings down the box
                for (ax, az, bx, bz) in ((-0.22, 0.0, 0.22, 0.0), (-0.22, -sh_ + 0.08, 0.22, -sh_ + 0.08), (-0.22, 0.0, -0.22, -sh_ + 0.08), (0.22, 0.0, 0.22, -sh_ + 0.08)):
                    S.rod(col, (sx + dx + ax, y - 0.7, sz - 0.04 + az), (sx + dx + bx, y - 0.7, sz - 0.04 + bz), 0.022, segs=4)
                for k in range(4):
                    cz = sz - 0.42 - k * 0.58
                    ring = [(0.15 * math.cos(TAU * i / 12), 0.15 * math.sin(TAU * i / 12)) for i in range(13)]
                    for (ax, az), (bx, bz) in zip(ring, ring[1:]):
                        S.rod(col, (sx + dx + ax, y - 0.72, cz + az), (sx + dx + bx, y - 0.72, cz + bz), 0.02, segs=4)
        x += w + rng.uniform(0.0, 0.35)
    B.done(period=None)
    ow = W.done(period=None)
    ow['outline'] = 0
    os_ = S.done(period=None)
    os_['outline'] = 0


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'far', y=2.0, depth=3.0, top=0.0, bottom=-3.0)
    skyline(L, rng, 'far', ('far', 'far2'), 2.5, 8.2, 1.4, 3.2, ('farwin_glow', 'farwin2_glow'), 0.16, 0.0, y=0.5)
    for ob in K.COLL[L].objects:
        if ob.name.startswith('L0_blocks'):
            ob['outline'] = 0.6


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'near', y=2.0, depth=3.0, top=0.0, bottom=-3.0)
    skyline(L, rng, 'near', ('near', 'near2', 'near3'), 2.5, 6.4, 1.6, 3.4, ('win_glow', 'win2_glow'), 0.26, 0.5, y=0.0, tanks=True)


def build_L2(rng):
    L = 'L2'
    top = 190 / PX
    N = Builder('L2_net', L)
    step = 12 / PX * 2.4
    run = 180 / PX
    x = -run
    while x < P + run:
        N.rod('net_glow', (x, 0.4, top), (x + run, 0.4, 0.0), 0.016, segs=3)
        N.rod('net_glow', (x + run, 0.4, top), (x, 0.4, 0.0), 0.016, segs=3)
        x += step
    N.rod('rail', (-1.0, 0.3, top), (P + 1.0, 0.3, top), 0.05, segs=4)
    N.rod('rail', (-1.0, 0.3, 0.05), (P + 1.0, 0.3, 0.05), 0.05, segs=4)
    on = N.done(period=None)
    on['outline'] = 0
    B = Builder('L2_poles', L)
    n = int(round(P / (180 / PX)))
    for k in range(n):
        x = (k + 0.5) * P / n
        B.box('pole', (x, 0.0, (top + 1.0) / 2), (0.2, 0.2, top + 1.0), bevel=0.02)
        B.box('lamp', (x + 0.1, -0.1, top + 1.12), (1.2, 0.3, 0.32), bevel=0.03)
        for j in range(3):
            B.box('lamp_glow', (x + 0.1 - 0.38 + j * 0.38, -0.27, top + 1.12), (0.28, 0.04, 0.18), bevel=0.0)
    B.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def dashes(B, rng, x0, x1):
    B.box('g_dash', ((x0 + x1) / 2, -0.02, -0.15), ((x1 - x0) * 0.42, 0.9, 0.06), bevel=0.0)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.24, rows=(1, 2), cols=(1, 2), gap=0.08, jitter=0.25, roles=('g_rock', 'g_rock2'), bevel=0.02, cap_deco=dashes, hi_h=0.05)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
