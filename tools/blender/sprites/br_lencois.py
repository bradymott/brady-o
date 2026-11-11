# Brazil 3-4 "Lençóis Lagoons" (theme br_lencois): the white dunes of Lençóis Maranhenses and their blue rain
# lagoons, as a Fiesta Toon diorama.
#   L0  brLencoisFar  (base 320, #e8e0cc)  far rolling dune ridges, pale and hazy, with flat blue lagoons in the troughs
#   L1  brLencoisNear (base 360, #f4ecd8)  big near dunes: sunlit white faces, shaded lee sides, wind ripples, a few
#                                          lagoons between them and tufts of dune grass; sand below
#   ground: white sand (grass style): a bright cap with wind ripples over pale sand, pebbles and shells
# Helpers: ma_kit.py.
import math, random
import ma_kit as K
from ma_kit import P, Builder, ridge_slab, periodic_profile

MODULE = 'br_lencois'
LAYERS = ['L0', 'L1']
BASES = {'L0': 320, 'L1': 360}
SKY = ['#3a9ae8', '#8ad4ff', '#f0fbff']
PALETTE = {
    'far': '#e6e0d0', 'far_shade': '#d4cfc4', 'far_lagoon': '#7ac8e8', 'far_lagoon2': '#5aaedc',
    'dune': '#fbf6ea', 'dune_shade': '#e4d8be', 'dune2': '#f4ecd8', 'ripple': '#e8dcc0', 'fill': '#efe4cc',
    'lagoon': '#3ab0e8', 'lagoon_dk': '#1a86c8', 'lagoon_hi': '#bff0ff', 'grass': '#7aa84a', 'grass2': '#5a8a3a',
    'g_cap': '#fbf4e2', 'g_cap_hi': '#ffffff', 'g_dirt': '#eadcb8', 'g_dirt2': '#dccb9e', 'g_rock': '#cdb88c',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau
UP0, UP1 = 2.4, 2.8     # the dunes stand this far above the painter's ground lines, so they show over 3-4's floor


def lagoon(B, x, w, z, y, hi=True, roles=('lagoon', 'lagoon_dk', 'lagoon_hi')):
    n = 16
    pts = [(x + w / 2 * math.cos(math.pi + math.pi * k / n), z - 0.22 * math.sin(math.pi * k / n)) for k in range(n + 1)]
    pts += [(x + w / 2, z + 0.02), (x - w / 2, z + 0.02)]
    B.slab(roles[0], pts[::-1], 0.1, at=(0, y, 0))
    B.box(roles[1], (x, y - 0.02, z - 0.03), (w * 0.9, 0.05, 0.05), bevel=0.0)
    if hi:
        for k in range(2):
            B.box(roles[2], (x - w * 0.15 + k * w * 0.25, y - 0.05, z - 0.09 - 0.05 * k), (w * 0.18, 0.04, 0.035), bevel=0.0)


def build_L0(rng):
    L = 'L0'
    zf = periodic_profile(rng, 0.9 + UP0, 0.55, waves=((3, 1.0), (7, 0.35)))
    ridge_slab(L, 'L0_ridge', 'far', zf, 3.0, bottom=-3.0, shade='far_shade', shade_depth=0.6, outline=0.35)
    B = Builder('L0_lagoons', L)
    for k in range(6):
        x = (k + 0.3) * P / 6 + rng.uniform(-0.5, 0.5)
        lagoon(B, x, rng.uniform(3.0, 4.6), UP0 + rng.uniform(-0.1, 0.25), 2.0, hi=False, roles=('far_lagoon', 'far_lagoon2', 'far_lagoon'))
    B.done(period=None)['outline'] = 0.0


def build_L1(rng):
    L = 'L1'
    K.plain(L, 'L1_fill', 'fill', y=3.5, depth=1.0, top=UP1 - 0.9, bottom=-4.0)
    # big dunes: a smooth windward face rising left to a sharp crest, a steep shaded lee side to the right
    x, i = rng.uniform(-1, 1), 0
    D = Builder('L1_dunes', L)
    S = Builder('L1_lee', L)
    R = Builder('L1_ripples', L)
    while x < P - 2.0:
        w, h = rng.uniform(8.0, 12.0), rng.uniform(1.9, 3.1)
        crest = x + w * rng.uniform(0.58, 0.66)
        n = 24
        pts = []
        for k in range(n + 1):
            xx = x + w * k / n
            if xx <= crest:
                u = (xx - x) / (crest - x); z = h * (math.sin(u * math.pi / 2) ** 1.6)
            else:
                u = (xx - crest) / (x + w - crest); z = h * (1 - u) ** 1.3
            pts.append((xx, z - 0.9 + UP1))
        poly = [(x, -1.2), (x + w, -1.2)] + pts[::-1]
        y = 2.4 - 0.2 * (i % 2)
        D.slab('dune' if i % 2 else 'dune2', poly, 1.0, at=(0, y, 0))
        lee = [(crest, h - 0.92 + UP1)] + [(xx, z - 0.02) for xx, z in pts if xx > crest] + [(x + w - 0.3, UP1 - 1.1), (crest + 0.6, UP1 - 1.1)]
        S.slab('dune_shade', lee[::-1], 0.03, at=(0, y - 0.04, 0))
        for k in range(3):
            u0 = 0.25 + 0.22 * k
            a = x + (crest - x) * u0
            pts_r = [(a + 0.5 * j, None) for j in range(4)]
            for j in range(3):
                xa, xb = a + 0.55 * j, a + 0.55 * (j + 1)
                za = h * (math.sin(((xa - x) / (crest - x)) * math.pi / 2) ** 1.6) - 0.9 - 0.25 - 0.22 * k + UP1
                zb = h * (math.sin(((xb - x) / (crest - x)) * math.pi / 2) ** 1.6) - 0.9 - 0.25 - 0.22 * k + UP1
                if xb < crest - 0.2:
                    R.rod('ripple', (xa, y - 0.05, za), (xb, y - 0.05, zb), 0.03, segs=4)
        x += w * rng.uniform(0.7, 0.9)
        i += 1
    for ob in (D.done(period=None), ):
        ob['outline'] = 0.7
    S.done(period=None)['outline'] = 0.0
    R.done(period=None)['outline'] = 0.0
    # rain lagoons along the foot of the dunes, dune grass tufts
    B = Builder('L1_lagoons', L)
    for x in (P * 0.15, P * 0.48, P * 0.8):
        lagoon(B, x + rng.uniform(-1, 1), rng.uniform(3.2, 5.0), UP1 - 0.75, 1.4)
    B.done(period=None)['outline'] = 0.5
    G = Builder('L1_grass', L)
    for k in range(9):
        x = rng.uniform(0, P)
        for j in range(4):
            G.lathe('grass' if j % 2 else 'grass2', [(0.06, 0.0), (0.0, rng.uniform(0.35, 0.6))], 4, at=(x + (j - 1.5) * 0.09, 1.2, UP1 - 0.85), rot=(0, (j - 1.5) * 0.3, 0), cap_bottom=True)
    G.done()['outline'] = 0.5


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='ripples', stone_p=0.25, patch_p=0.3, cap_h=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
