# Morocco 5-2 "Sahara Caravan": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  maSahara (base 300, f 0.04, dyn maSand): three rows of far dune ridges in the evening light, sun-side and
#       shadow-side tones, a little camel caravan walking the middle crest
#   L1  maSahara (base 350, f 0.2): the near dunes with crisp crests, sandstone outcrops and dry desert shrubs
#   ground: the engine's 'grass' style in sand colours: a rippled sand cap over packed sandstone with pebbles
# Contract and helpers: see ma_kit.py / ma_souk.py (period P, ground row = BASES[layer], y within +-6).
import math, random
import ma_kit as K
from ma_kit import P, Builder, ridge_slab, periodic_profile, plain

MODULE = 'ma_sahara'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 350}
SKY = ['#ff7a3a', '#ffb86a', '#ffe8b8']
PALETTE = {
    # L0: far dunes (paler and pinker with distance) and the caravan
    'far3': '#f2c08c', 'far3_sh': '#e2a274', 'far2': '#eab070', 'far2_sh': '#d8945a', 'far1': '#e2a460', 'far1_sh': '#cc8848',
    'camel': '#a8683a', 'camel_dk': '#7a4628', 'load_a': '#b8222a', 'load_b': '#2a4a9a', 'load_c': '#e8a02a',
    # L1: near dunes, rocks, shrubs
    'dune': '#f0b870', 'dune_sh': '#d89850', 'dune2': '#f4c482', 'dune2_sh': '#e0a862',
    'rock': '#c8784a', 'rock_hi': '#dc915e', 'rock_dk': '#a85e38', 'shrub': '#8a8a3a', 'shrub_dk': '#6a6a2a', 'twig': '#7a5a3a',
    # ground (engine 'grass' style in the Sahara's colours)
    'g_cap': '#f0c87a', 'g_cap_hi': '#ffe0a0', 'g_dirt': '#e8b060', 'g_dirt2': '#d49a4c', 'g_rock': '#c88a48',
}
K.use(MODULE, PALETTE, LAYERS)


def camel(B, x, z, s, rng, loads=('load_a', 'load_b', 'load_c')):
    """A small walking dromedary (faces +X) with a striped saddle load; feet at (x, z)."""
    y = 0.0
    B.sphere('camel', (x, y, z + 0.62 * s), 0.34 * s, scale=(1.25, 0.6, 0.62))
    B.sphere('camel', (x - 0.02 * s, y, z + 0.86 * s), 0.2 * s, scale=(1.1, 0.6, 1.0))           # the hump
    B.box(rng.choice(loads), (x - 0.02 * s, y - 0.06 * s, z + 0.88 * s), (0.34 * s, 0.24 * s, 0.12 * s), bevel=0.0)
    B.rod('camel', (x + 0.32 * s, y, z + 0.66 * s), (x + 0.52 * s, y, z + 1.02 * s), 0.07 * s, segs=6)
    B.sphere('camel', (x + 0.6 * s, y, z + 1.04 * s), 0.11 * s, scale=(1.5, 0.7, 0.8))
    for k, (lx, sw) in enumerate(((-0.26, 0.06), (-0.14, -0.06), (0.2, -0.06), (0.32, 0.06))):
        role = 'camel' if k % 2 else 'camel_dk'
        B.rod(role, (x + lx * s, y, z + 0.5 * s), (x + (lx + sw) * s, y, z), 0.045 * s, segs=5)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'far1', y=3.0, depth=4.0, top=-0.5, bottom=-3.0)
    # back to front: high pale ridges, the caravan crest, a low darker ridge
    z3 = periodic_profile(rng, 3.3, 1.2, waves=((2, 1.0), (3, 0.6), (7, 0.15)))
    ridge_slab(L, 'L0_far3', 'far3', z3, y=3.0, shade='far3_sh', shade_depth=0.6)
    z2 = periodic_profile(rng, 2.0, 0.9, waves=((3, 1.0), (4, 0.5), (9, 0.12)))
    ridge_slab(L, 'L0_far2', 'far2', z2, y=1.5, shade='far2_sh', shade_depth=0.8)
    z1 = periodic_profile(rng, 0.7, 0.45, waves=((4, 1.0), (5, 0.6), (11, 0.1)))
    ridge_slab(L, 'L0_far1', 'far1', z1, y=0.0, shade='far1_sh', shade_depth=1.0)
    # the caravan on the middle ridge (the painter puts it at 120..210 px); tiny, it is very far away
    C = Builder('L0_caravan', L)
    for k in range(5):
        x = 4.4 + k * 0.85
        camel(C, x, z2(x) - 0.06, 0.62, rng)
    C.done(period=None)
    for o in K.COLL[L].objects:
        if o.name.startswith('L0_caravan'):
            o['outline'] = 0.7


def rock_outcrop(B, x, z, s, rng):
    """A wind-worn sandstone outcrop: two or three stacked rounded slabs, the top one lighter."""
    w = 1.4 * s
    B.rbox('rock_dk', (x, 0.4, z + 0.3 * s), (w, 1.0, 0.7 * s), bevel=0.25 * s)
    B.rbox('rock', (x + rng.uniform(-0.2, 0.2) * s, 0.3, z + 0.85 * s), (w * 0.8, 0.9, 0.55 * s), bevel=0.22 * s)
    if rng.random() < 0.7:
        B.rbox('rock_hi', (x + rng.uniform(-0.25, 0.25) * s, 0.2, z + 1.28 * s), (w * 0.5, 0.8, 0.4 * s), bevel=0.16 * s)


def shrub(B, x, z, s, rng):
    """A dry desert shrub: a dark dome of twiggy tufts."""
    for k in range(3):
        B.sphere('shrub_dk' if k == 1 else 'shrub', (x + (k - 1) * 0.22 * s, -0.2 + k * 0.05, z + 0.18 * s + (0.08 * s if k == 1 else 0)), 0.24 * s, scale=(1.2, 0.7, 0.8), subdiv=1)
    for k in range(3):
        a = -0.6 + k * 0.6
        B.rod('twig', (x, -0.3, z + 0.25 * s), (x + math.sin(a) * 0.5 * s, -0.3, z + 0.25 * s + math.cos(a) * 0.4 * s), 0.025 * s, segs=4)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'dune', y=3.0, depth=4.0, top=-0.4, bottom=-3.0)
    zb = periodic_profile(rng, 2.4, 1.4, waves=((2, 1.0), (3, 0.7), (6, 0.2)))
    ridge_slab(L, 'L1_dune', 'dune', zb, y=2.5, shade='dune_sh', shade_depth=0.7)
    zf = periodic_profile(rng, 0.55, 0.35, waves=((3, 1.0), (5, 0.5), (8, 0.15)))
    ridge_slab(L, 'L1_dune2', 'dune2', zf, y=0.6, shade='dune2_sh', shade_depth=1.2)
    R = Builder('L1_rocks', L)
    for x in (6.0 + rng.uniform(-1, 1), 23.5 + rng.uniform(-1, 1)):
        rock_outcrop(R, x, zf(x) - 0.15, rng.uniform(0.9, 1.25), rng)
    R.done()
    S = Builder('L1_shrubs', L)
    xs = [1.5, 11.0, 15.5, 19.0, 29.5, 33.5]
    for x in xs:
        x += rng.uniform(-0.6, 0.6)
        shrub(S, x, zf(x) - 0.08, rng.uniform(0.7, 1.1), rng)
    S.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='ripples', stone_p=0.35, patch_p=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
