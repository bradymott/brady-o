# Indonesia 9-6 "Orangutan Canopy" (overhaul secret level, SWING): theme id_rimba, the Borneo rainforest canopy.
# Rendered ahead of the engine work (no THEMES entry exists yet; the atlas is not referenced). Suggested theme:
#   sky ['#3a8a6a', '#a8dcc0', '#f0fff0'], ground 'grass', layers in this order with these bases.
#   L0  far rainforest (base 260, f 0.04, blur): misty rolling canopy with tall emergent trees poking above it, pale
#       with distance (no ink on the mist)
#   L1  giant trunks (base 330, f 0.12): straight pale dipterocarp trunks with buttress roots, bird's-nest ferns
#       clinging to them, lianas looping between (the trunks are vertical, nothing reads as a ledge)
#   L2  canopy edge (base 0, f 0.22): leaf clusters along the top of the screen and hanging vines
#   ground: forest floor: a mossy cap with leaf litter over dark loam and roots
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, ridge_slab, periodic_profile

MODULE = 'id_rimba'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 260, 'L1': 330, 'L2': 0}
SKY = ['#3a8a6a', '#a8dcc0', '#f0fff0']
PALETTE = {
    'far3': '#9cc8b0', 'far2': '#84b89c', 'far1': '#6ea888', 'emerg': '#8abca0', 'emerg_tr': '#a8c4b4', 'mist': '#a8d0bc',
    'trunk': '#b8ac94', 'trunk2': '#a49880', 'bark': '#8c806a', 'nest': '#5a9a3a', 'nest2': '#4a8a30', 'liana': '#6a6040',
    'moss': '#7aac58', 'under': '#4e8a52', 'under2': '#427a46',
    'canopy': '#2e6a36', 'canopy2': '#26602e', 'vine': '#4a6a2e', 'leaf': '#3e8a3a', 'leaf2': '#347a32',
    # ground (forest floor)
    'g_cap': '#4e8a32', 'g_cap_hi': '#86c45a', 'g_blade': '#5a9a3a', 'g_dirt': '#4a3424', 'g_dirt2': '#3a2818', 'g_rock': '#7a6a52',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def build_L0(rng):
    L = 'L0'
    for r, (role, base, amp, y) in enumerate((('far3', 3.0, 0.8, 5.0), ('far2', 1.9, 0.7, 3.5), ('far1', 0.8, 0.6, 2.0))):
        zf = periodic_profile(rng, base, amp, waves=((3, 1.0), (7, 0.5), (13, 0.3)))
        ridge_slab(L, 'L0_row%d' % r, role, zf, y=y, bottom=-3.0, outline=0.35)
        if r < 2:
            E = Builder('L0_emerg%d' % r, L)
            for k in range(4):
                x = (k + rng.uniform(0.2, 0.8)) * P / 4
                h = rng.uniform(1.6, 2.6)
                z0 = zf(x)
                E.rod('emerg_tr', (x, y - 0.3, z0 - 0.3), (x, y - 0.3, z0 + h), 0.1, segs=5)
                K.crown(E, x, y - 0.35, z0 + h, 0.9, ('emerg', role), rng, n=5)
            E.done()['outline'] = 0.35
        M = Builder('L0_mist%d' % r, L)
        M.box('mist', (P / 2, y - 0.8, base - amp - 0.5), (P + 2.0, 0.1, 0.9), bevel=0.0)
        M.done(period=None)['outline'] = 0


def giant_trunk(B, x, rng):
    w = rng.uniform(0.7, 1.0)
    B.rod('trunk', (x, 0.5, -0.5), (x, 0.5, 14.0), w / 2, segs=8, r2=w / 2 * 0.85)
    for k in range(5):
        z = rng.uniform(1.5, 12.0)
        B.rod('bark', (x - w * 0.42, 0.1, z), (x - w * 0.42, 0.1, z + rng.uniform(0.6, 1.4)), 0.04, segs=4)
    for sgn in (-1, 1):                                   # buttress roots: flat fins flaring at the foot
        B.slab('trunk2', [(x + sgn * w * 0.3, 2.2), (x + sgn * w * 0.3, -0.4), (x + sgn * (w * 0.3 + 1.1), -0.4)][::sgn], 0.2, at=(0, 0.25, 0))
    for k in range(rng.randint(1, 2)):                     # a bird's-nest fern clinging to the trunk
        z = rng.uniform(3.0, 8.0)
        for j in range(7):
            a = math.pi * (0.1 + 0.8 * j / 6)
            B.sphere('nest' if j % 2 else 'nest2', (x + math.cos(a) * 0.55, 0.0, z + math.sin(a) * 0.4), 0.42, scale=(1.0, 0.25, 0.28), rot=(0, -a + math.pi / 2, 0), subdiv=1)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'under2', y=3.0, depth=2.0, top=-0.3, bottom=-3.0)
    U = Builder('L1_under', L)
    x = 0.0
    while x < P:
        r = rng.uniform(0.6, 1.0)
        U.sphere(rng.choice(('under', 'under2')), (x, 1.5, 0.2), r, scale=(1.0, 0.5, 0.7), subdiv=1)
        x += r * 1.2
    U.done()['outline'] = 0.5
    T = Builder('L1_trunks', L)
    xs = [(k + rng.uniform(0.25, 0.75)) * P / 5 for k in range(5)]
    for x in xs:
        giant_trunk(T, x, rng)
    T.done()['outline'] = 0.7
    V = Builder('L1_lianas', L)
    for a, b in zip(xs, xs[1:] + [xs[0] + P]):
        z = rng.uniform(6.0, 9.0)
        sag = rng.uniform(2.5, 3.5)
        pts = [(a + (b - a) * j / 10, z - sag * math.sin(math.pi * j / 10)) for j in range(11)]
        for (xa, za), (xb, zb) in zip(pts, pts[1:]):
            V.rod('liana', (xa, -0.2, za), (xb, -0.2, zb), 0.05, segs=4)
    V.done()['outline'] = 0.5


def build_L2(rng):
    L = 'L2'
    C = Builder('L2_canopy', L)
    C.box('canopy2', (P / 2, 1.0, 0.6), (P + 2.0, 1.0, 1.2), bevel=0.0)
    x = 0.0
    while x < P:
        r = rng.uniform(0.8, 1.3)
        C.sphere(rng.choice(('canopy', 'canopy2')), (x, 0.6, -0.2 - rng.uniform(0, 0.3)), r, scale=(1.0, 0.4, 0.6), subdiv=2)
        x += r * rng.uniform(1.0, 1.4)
    C.done()
    V = Builder('L2_vines', L)
    x = 0.6
    while x < P:
        ln = rng.uniform(1.5, 4.5)
        pts = [(x + 0.12 * math.sin(j * 1.1 + x), -0.5 - ln * j / 6) for j in range(7)]
        for (xa, za), (xb, zb) in zip(pts, pts[1:]):
            V.rod('vine', (xa, 0.0, za), (xb, 0.0, zb), 0.045, segs=5)
        for j in range(1, 7, 2):
            s = 1 if j % 4 == 1 else -1
            V.sphere(rng.choice(('leaf', 'leaf2')), (pts[j][0] + s * 0.2, -0.05, pts[j][1]), 0.24, scale=(1.0, 0.3, 0.45), rot=(0, s * 0.6, 0), subdiv=1)
        x += rng.uniform(1.4, 3.0)
    V.done()['outline'] = 0.6


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='grass', stone_p=0.3, patch_p=0.4)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
