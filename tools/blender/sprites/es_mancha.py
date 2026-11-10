# Spain (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) N `es_mancha`: "Molinos de La Mancha" (6-7, SWITCH).
# Not wired into the game yet: the overhaul's engine work will add the theme; its key matches this atlas's name.
# Original art: the windmill plain of central Spain at golden afternoon.
#   L0  (base 300, f 0.04): rolling wheat-gold plains in bands, a far blue ridge, tiny windmill silhouettes on a crest
#   L1  (base 350, f 0.2):  a ridge of white windmills with conical dark caps and lattice sails, a ruined castle
#       keep at one end, round olive trees and stone walls along the slope
#   ground: grass style in dry colours: an ochre stubble cap over red-brown La Mancha earth with pale stones
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import es_tomatina as K
from es_tomatina import Builder, P, TAU, OVER

MODULE = 'es_mancha'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 350}
SKY = ['#3a7ad8', '#a8d4ff', '#fff2d8']
PALETTE = {
    'ridge': '#8a9ac8', 'plain1': '#e8c070', 'plain2': '#d8a85a', 'plain3': '#c8964a', 'far_mill': '#f4ecdc',
    'hill': '#c8905a', 'hill2': '#b8804a', 'mill': '#fbf8f0', 'mill2': '#e8e2d4', 'cap': '#3a3a44', 'sail': '#8a6a4a', 'sail2': '#c8b090',
    'door': '#5a4a3a', 'castle': '#d8b88a', 'castle2': '#c4a476', 'olive': '#6a8a4a', 'olive2': '#5a7a40', 'trunk': '#6a5a42',
    'wall': '#c8b090', 'fill': '#c8905a',
    'g_turf': '#d8b060', 'g_turf_hi': '#f0d088', 'g_soil': '#b0683a', 'g_soil_dark': '#8a4e2a', 'g_rock': '#e0cfb0',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)


def windmill(B, x, y, z, s, rng, sail_a=None):
    """A La Mancha windmill: a white tapered tower, a dark conical cap, four lattice sails on a hub."""
    B.lathe('mill', [(0.95 * s, 0.0), (0.82 * s, 3.2 * s)], 12, at=(x, y, z), cap_top=True, cap_bottom=True)
    B.lathe('cap', [(0.95 * s, 3.15 * s), (0.0, 4.2 * s)], 12, at=(x, y, z), cap_bottom=True)
    B.arch('door', (x, y - 0.92 * s, z), 0.5 * s, 0.9 * s, 0.05)
    B.box('door', (x - 0.2 * s, y - 0.86 * s, z + 2.1 * s), (0.22 * s, 0.05, 0.3 * s), bevel=0.0)
    hub = (x, y - 1.2 * s, z + 3.3 * s)
    a0 = rng.uniform(0, math.pi / 2) if sail_a is None else sail_a
    for k in range(4):
        a = a0 + k * math.pi / 2
        ca, sa = math.cos(a), math.sin(a)
        L = 2.6 * s
        B.rod('sail', hub, (hub[0] + ca * L, hub[1], hub[2] + sa * L), 0.05 * s, segs=4)
        # the lattice: a narrow panel beside the spar, with cross slats
        px, pz = -sa, ca
        for j in range(5):
            u0 = 0.35 + j * 0.13
            p0 = (hub[0] + ca * L * u0, hub[1] - 0.02, hub[2] + sa * L * u0)
            p1 = (p0[0] + px * 0.42 * s, p0[1], p0[2] + pz * 0.42 * s)
            B.rod('sail2', p0, p1, 0.025 * s, segs=4)
        q0 = (hub[0] + ca * L * 0.33 + px * 0.42 * s, hub[1] - 0.02, hub[2] + sa * L * 0.33 + pz * 0.42 * s)
        q1 = (hub[0] + ca * L * 0.98 + px * 0.42 * s, hub[1] - 0.02, hub[2] + sa * L * 0.98 + pz * 0.42 * s)
        B.rod('sail', q0, q1, 0.03 * s, segs=4)
    B.sphere('cap', hub, 0.14 * s, subdiv=1)


def build_L0(rng):
    L = 'L0'
    K.ridge_slab(TH, L, 'L0_ridge', K.periodic_fn(rng, 2.6, 4.0, 3), 'ridge', y=5.0, depth=1.0, zb=-2.5)
    K.ridge_slab(TH, L, 'L0_plain1', K.periodic_fn(rng, 1.6, 2.6, 3), 'plain1', y=4.0, depth=0.8, zb=-2.5)
    z2 = K.periodic_fn(rng, 0.7, 1.6, 4)
    K.ridge_slab(TH, L, 'L0_plain2', z2, 'plain2', y=3.0, depth=0.8, zb=-2.5)
    K.ridge_slab(TH, L, 'L0_plain3', K.periodic_fn(rng, 0.1, 0.6, 5), 'plain3', y=2.0, depth=0.8, zb=-2.5)
    B = Builder('L0_mills', L, TH)
    for k in range(6):
        x = 12.0 + k * 1.3
        windmill(B, x, 2.6, z2(x) - 0.1, 0.22, rng)
    B.done()


def build_L1(rng):
    L = 'L1'
    zh = K.periodic_fn(rng, 0.6, 1.8, 3)
    K.ridge_slab(TH, L, 'L1_hill', zh, 'hill', y=2.5, depth=1.0, zb=-2.5)
    K.fill_below(TH, L, 'fill', top=0.2, depth=3.0, y=3.0)
    B = Builder('L1_mills', L, TH)
    for k, x in enumerate((5.0, 9.5, 14.0, 18.5)):
        x += rng.uniform(-0.4, 0.4)
        windmill(B, x, 1.4, zh(x) - 0.3, rng.uniform(0.8, 0.95), rng)
    # a ruined castle keep with crenellations at the other end of the ridge
    cx = 27.5
    z = zh(cx) - 0.3
    B.box('castle', (cx, 1.6, z + 1.8), (3.2, 2.0, 3.6), bevel=0.04)
    B.box('castle2', (cx + 2.2, 1.8, z + 1.1), (1.6, 1.8, 2.2), bevel=0.04)
    B.lathe('castle', [(0.9, 0.0), (0.9, 4.6)], 10, at=(cx - 1.6, 1.4, z), cap_top=True)
    for k in range(5):
        B.box('castle', (cx - 1.3 + k * 0.65, 1.0, z + 3.75), (0.36, 0.5, 0.36), bevel=0.0)
    for k in range(3):
        a = TAU * k / 6
        B.box('castle', (cx - 1.6 + 0.75 * math.cos(a), 1.0, z + 4.75), (0.3, 0.4, 0.34), bevel=0.0)
    B.arch('door', (cx, 0.58, z), 0.7, 1.2, 0.05)
    B.box('door', (cx - 1.6, 0.48, z + 3.3), (0.18, 0.05, 0.4), bevel=0.0)
    B.done()
    O = Builder('L1_olives', L, TH)
    for x in K.jittered(rng, 9, 0.35):
        if 23.5 < x < 31.5:
            continue
        for dx in K.wraps(x, 1.0):
            z = zh(x) - 0.2
            O.rod('trunk', (x + dx, -0.6, z), (x + dx + 0.1, -0.6, z + 0.6), 0.1, segs=5)
            O.sphere('olive', (x + dx, -0.7, z + 1.0), 0.65, scale=(1.3, 0.7, 0.85), subdiv=2)
            O.sphere('olive2', (x + dx + 0.45, -0.75, z + 0.85), 0.42, scale=(1.2, 0.7, 0.8), subdiv=1)
    O.done(period=None)
    W = Builder('L1_walls', L, TH)
    for x in K.jittered(rng, 5, 0.3):
        for dx in K.wraps(x, 1.6):
            z = zh(x) - 0.25
            for k in range(5):
                W.rbox('wall', (x + dx - 1.2 + k * 0.6, -1.0, z + 0.18), (0.55, 0.5, 0.36), bevel=0.1, segments=1)
    W.done(period=None)


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return K.grass_ground(TH, random.Random(seed), {'turf': 'g_turf', 'turf_hi': 'g_turf_hi', 'soil': 'g_soil', 'soil_dark': 'g_soil_dark', 'rock': 'g_rock'})


def clear():
    TH.clear()


if __name__ == '__main__':
    K.preview(TH, build, build_ground)
