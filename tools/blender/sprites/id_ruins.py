# Indonesia 9-5 "Monkey Forest Ruins": the parallax background as a toon diorama (Fiesta Toon pipeline).
# A generic overgrown jungle ruin: old garden walls of plain mossy stone blocks, broken tops, dark arched openings,
# banyan roots spilling over them. No shrines, no carvings, no gates, no statues, no offerings.
#   L0  idJungle (base 250, f 0.04, blur): three misty rows of round canopy crowns, paler with distance (no ink on
#       the mist bands)
#   L1  idRuinsBg (base 340, f 0.12): the old walls: block courses, broken uneven tops with moss cushions and ferns,
#       arched openings, banyan roots and aerial roots draping down
#   L2  idVines (base 0, f 0.22): the near canopy edge along the top of the screen and lianas hanging from it, with
#       leaves (nothing horizontal low down, so nothing reads as a ledge)
#   ground: the engine's 'idMoss' style: mossy grey stone blocks set in dark earth under a cushion of moss
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, ridge_slab, periodic_profile

MODULE = 'id_ruins'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 250, 'L1': 340, 'L2': 0}
SKY = ['#2a6a52', '#8acaa8', '#eaf8e0']
PALETTE = {
    'j3': '#7aa88a', 'j2': '#5e9272', 'j1': '#4a7e5c', 'mist': '#a4ccb2', 'trunkj': '#5a6a52',
    'wall': '#a4a894', 'wall2': '#959a86', 'wall_dk': '#80866f', 'mortar': '#6e7462', 'arch': '#3e4a3c', 'arch2': '#4a5846',
    'moss': '#7aa860', 'moss2': '#6c9a54', 'root': '#7a6450', 'root2': '#68543e', 'fern': '#4a8a3e', 'fern2': '#3e7a34',
    'canopy': '#2a5a32', 'canopy2': '#224e2a', 'liana': '#3e5a2a', 'leaf': '#3e7a36', 'leaf2': '#336a2e',
    # ground (engine 'idMoss' style)
    'g_cap': '#5a9a3a', 'g_cap_hi': '#9ad86a', 'g_blade': '#6ab04a', 'g_dirt': '#4e4c40', 'g_dirt2': '#3a3a30', 'g_rock': '#8a8a78',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def build_L0(rng):
    L = 'L0'
    for r, (role, zb, y) in enumerate((('j3', 2.4, 4.0), ('j2', 1.3, 2.5), ('j1', 0.2, 1.0))):
        B = Builder('L0_row%d' % r, L)
        B.box(role, (P / 2, y + 0.3, zb - 2.5), (P + 2.0, 0.5, 5.0), bevel=0.0)
        x = rng.uniform(0, 1.0)
        while x < P:
            rad = rng.uniform(0.9, 1.5)
            B.sphere(role, (x, y, zb), rad, scale=(1.0, 0.4, 0.8), subdiv=2)
            x += rad * rng.uniform(1.1, 1.5)
        B.done()['outline'] = 0.4
        M = Builder('L0_mist%d' % r, L)
        M.box('mist', (P / 2, y - 0.6, zb - 0.75), (P + 2.0, 0.1, 0.5), bevel=0.0)
        M.done(period=None)['outline'] = 0


def wall_section(B, O, x0, x1, top, rng, arch=False):
    """A stretch of old garden wall from x0 to x1: block courses, a broken uneven top, maybe an arched opening."""
    w = x1 - x0
    B.box('wall', ((x0 + x1) / 2, 0.6, top / 2 - 0.5), (w, 0.6, top + 1.0), bevel=0.0)
    course = 0.42
    for i in range(int(top / course) + 1):
        z = i * course
        if z > top - 0.1:
            break
        off = (i % 2) * 0.35
        xx = x0 + off
        while xx < x1 - 0.1:
            bw = rng.uniform(0.55, 0.85)
            bx1 = min(x1 - 0.04, xx + bw)
            B.box(rng.choice(('wall', 'wall2', 'wall2')), ((xx + bx1) / 2, 0.28, z + course / 2), (bx1 - xx - 0.06, 0.1, course - 0.06), bevel=0.02)
            xx = bx1 + 0.02
    # the broken top: a few stepped blocks missing, moss cushions on the stones that remain
    xx = x0
    while xx < x1 - 0.2:
        bw = rng.uniform(0.5, 1.1)
        h = rng.choice((0.0, 0.0, course, course * 2))
        if h:
            B.box('wall_dk', (xx + bw / 2, 0.3, top + h / 2), (bw - 0.06, 0.45, h), bevel=0.04)
        B.sphere(rng.choice(('moss', 'moss2')), (xx + bw / 2, 0.15, top + h + 0.02), bw * 0.42, scale=(1.0, 0.6, 0.35), subdiv=1)
        xx += bw
    if arch:
        ac = (x0 + x1) / 2 + rng.uniform(-0.3, 0.3)
        aw, ah = 1.3, min(top - 0.6, 2.4)
        pts = [(ac - aw / 2, -0.3), (ac + aw / 2, -0.3)]
        for i in range(13):
            a = math.pi * i / 12
            pts.append((ac + aw / 2 * math.cos(a), ah - aw / 2 + aw / 2 * math.sin(a)))
        O.slab('arch', pts, 0.05, at=(0, 0.2, 0))
        O.slab('arch2', [(ac - aw / 2, -0.3), (ac + aw / 2, -0.3), (ac + aw / 2, 0.4), (ac - aw / 2, 0.4)], 0.04, at=(0, 0.17, 0))


def roots(B, x, top, rng):
    """A banyan root cascade over the wall top: a few thick roots, many thin aerial roots."""
    for k in range(rng.randint(3, 5)):
        x0 = x + rng.uniform(-0.6, 0.6)
        pts = [(x0, top + 0.3)]
        for j in range(5):
            pts.append((pts[-1][0] + rng.uniform(-0.25, 0.25), pts[-1][1] - rng.uniform(0.4, 0.8)))
        for (xa, za), (xb, zb) in zip(pts, pts[1:]):
            B.rod('root' if k % 2 else 'root2', (xa, -0.05, za), (xb, -0.05, zb), 0.06 if k < 2 else 0.035, segs=5)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'wall_dk', y=3.0, depth=2.0, top=-0.3, bottom=-3.0)
    B = Builder('L1_walls', L)
    O = Builder('L1_openings', L)
    R = Builder('L1_roots', L)
    F = Builder('L1_ferns', L)
    x = 0.0
    while x < P - 1.0:
        w = min(P - x, rng.uniform(3.5, 6.0))
        top = rng.uniform(2.2, 3.6)
        wall_section(B, O, x, x + w - 0.5, top, rng, arch=rng.random() < 0.55)
        if rng.random() < 0.7:
            roots(R, x + rng.uniform(0.8, w - 1.3), top, rng)
        for k in range(rng.randint(1, 3)):
            fx = x + rng.uniform(0.3, w - 0.8)
            for j in range(6):
                a = math.pi * (0.15 + 0.7 * j / 5)
                F.sphere('fern' if j % 2 else 'fern2', (fx + math.cos(a) * 0.35, -0.3, 0.05 + math.sin(a) * 0.3), 0.32, scale=(1.0, 0.25, 0.3), rot=(0, -a + math.pi / 2, 0), subdiv=1)
        x += w
    B.done()['outline'] = 0.5
    O.done()['outline'] = 0.3
    R.done()['outline'] = 0.6
    F.done()


def build_L2(rng):
    L = 'L2'
    C = Builder('L2_canopy', L)
    C.box('canopy2', (P / 2, 1.0, 0.6), (P + 2.0, 1.0, 1.2), bevel=0.0)
    x = 0.0
    while x < P:
        r = rng.uniform(0.7, 1.2)
        C.sphere(rng.choice(('canopy', 'canopy2')), (x, 0.6, -0.15 - rng.uniform(0, 0.25)), r, scale=(1.0, 0.4, 0.62), subdiv=2)
        x += r * rng.uniform(1.0, 1.4)
    C.done()
    V = Builder('L2_lianas', L)
    x = 0.4
    while x < P:
        ln = rng.uniform(2.0, 6.0)
        ph = rng.uniform(0, TAU)
        pts = [(x + 0.18 * math.sin(ph + j * 0.9), -0.4 - ln * j / 8) for j in range(9)]
        for (xa, za), (xb, zb) in zip(pts, pts[1:]):
            V.rod('liana', (xa, 0.0, za), (xb, 0.0, zb), 0.05, segs=5)
        for j in range(2, 9, 2):
            px, pz = pts[j]
            s = 1 if j % 4 else -1
            V.sphere(rng.choice(('leaf', 'leaf2')), (px + s * 0.17, -0.05, pz + 0.05), 0.2, scale=(1.0, 0.3, 0.45), rot=(0, s * 0.7, 0), subdiv=1)
        x += rng.uniform(1.0, 2.4)
    V.done()['outline'] = 0.6


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='grass', stone_p=0.75, patch_p=0.15)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
