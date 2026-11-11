# France overhaul theme fr_perigord (7-4 "Truffle Hunt", a DIG level; level overhaul §8: N fr_perigord): original toon
# art for an oak wood over the earth, with a cave whose walls carry prehistoric-STYLE animal paintings (our own simple
# ochre shapes, not copies of any real cave).
# Suggested theme entry: sky ['#6a9ad0', '#c4dcec', '#f4ecd8'], ground 'grass', layers
#   [{kind:'frOaks', color:'#4a7a3a', base:300, f:0.04}, {kind:'frEarth', color:'#6a4a32', base:0, f:0.1}].
#   L0  frOaks  (base 300, f 0.04): a calm oak wood: broad round canopies in three greens over grey-brown trunks,
#               ferns at their feet, a dry-stone wall (low, round-topped)
#   L1  frEarth (base 0, f 0.1): a backdrop hanging from the ground line down ~16 m for the dig: soil strata with
#               dangling oak roots at the top, buried stones, a smooth cave wall band with ochre and charcoal animal
#               paintings (a horse, a deer, an aurochs-like bull, hand prints), a dark underground stream at the bottom
#   ground grass: a turf cap over dark Périgord soil with stones
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_kit as K
from fr_kit import Builder, P, TAU, OVER, PPM, wraps, ridge_slab, periodic_fn, fill_below
import fr_morning as FM

MODULE = 'fr_perigord'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 0}
SKY = ['#6a9ad0', '#c4dcec', '#f4ecd8']
PALETTE = {
    'canopy': '#5a8a42', 'canopy2': '#4a7a3a', 'canopy3': '#6a9a4e', 'trunk': '#7a6a5a', 'trunk2': '#6a5a4c', 'fern': '#5a9a42',
    'wall': '#c8bca0', 'wall2': '#b4a888', 'bank': '#5a7a3a',
    'soil': '#6a4a32', 'soil2': '#5a3e2a', 'soil3': '#7a583c', 'root': '#8a6a4a', 'stone': '#8a8070', 'stone2': '#9a9080',
    'cave': '#b8946a', 'cave2': '#a8845c', 'ochre': '#c8542a', 'ochre2': '#d8883a', 'charcoal': '#2a1e1a',
    'stream': '#1e3a4a', 'stream_hi': '#5a8aa0',
    'turf': '#5a9a3a', 'turf_hi': '#8ac85a', 'g_soil': '#5a3e2a', 'g_soil_dark': '#4a3222', 'g_rock': '#8a8070',
}
TH = FM.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)


def oak(B, x, s, y, rng):
    B.rod('trunk', (x, y, -0.3), (x + 0.1 * s, y, 2.0 * s), 0.22 * s, segs=6, r2=0.16 * s)
    B.rod('trunk2', (x + 0.05 * s, y, 1.4 * s), (x + 0.8 * s, y, 2.4 * s), 0.1 * s, segs=5)
    B.rod('trunk2', (x + 0.05 * s, y, 1.6 * s), (x - 0.7 * s, y, 2.5 * s), 0.09 * s, segs=5)
    for k in range(10):
        a = rng.uniform(0, TAU)
        r = rng.uniform(0.0, 1.0) ** 0.6
        B.sphere(('canopy', 'canopy2', 'canopy3')[k % 3], (x + math.cos(a) * 1.5 * s * r, y - 0.3 - 0.1 * (k % 2), 3.0 * s + math.sin(a) * 0.8 * s * r), rng.uniform(0.7, 1.0) * s, scale=(1.2, 0.7, 0.8), subdiv=2)


def build_L0(rng):
    L = 'L0'
    fill_below(TH, L, 'bank', top=0.2, depth=3.0, y=5.5)['outline'] = 0
    B = Builder('L0_wood', L, TH)
    x = rng.uniform(0.5, 1.5)
    while x < P - 1.0:
        s = rng.uniform(0.8, 1.2)
        for dx in wraps(x, 2.0 * s):
            oak(B, x + dx, s, 1.6 + rng.uniform(0, 0.8), random.Random(int(x * 10)))
        x += rng.uniform(3.0, 4.6)
    for k in range(18):
        fx = rng.uniform(0, P)
        for dx in wraps(fx, 0.5):
            for j in range(4):
                B.slab('fern', [(0.0, 0.0), (0.06, 0.0), (0.28 * math.cos(0.5 + j * 0.6), 0.5 * math.sin(0.5 + j * 0.6) + 0.1), (0.2 * math.cos(0.5 + j * 0.6), 0.5 * math.sin(0.5 + j * 0.6) + 0.12)], 0.04, at=(fx + dx, 0.6, 0.0), rot=(0, 0.0, 0))
    B.done(period=None)
    W = Builder('L0_drystone', L, TH)
    x = 0.0
    while x < P:
        w = rng.uniform(0.35, 0.6)
        for dx in wraps(x, w):
            W.rbox(('wall', 'wall2')[int(x * 7) % 2], (x + dx, 0.3, 0.25 + 0.05 * math.sin(x * 3)), (w, 0.4, 0.3), bevel=0.1, segments=2)
        x += w + 0.04
    W.done(period=None)['outline'] = 0.6


def painting(B, kind, x, z, s, role):
    """Simple ochre / charcoal animal shapes of our own (flat slabs on the cave wall)."""
    y = 0.95
    if kind == 'horse':
        B.slab(role, [(-0.9, 0.0), (0.6, 0.05), (0.9, 0.5), (1.3, 0.75), (1.15, 0.9), (0.7, 0.65), (-0.6, 0.6), (-1.1, 0.35)], 0.02, at=(x, y, z))
        for lx in (-0.7, -0.4, 0.3, 0.5):
            B.slab(role, [(lx, 0.05), (lx + 0.1, 0.05), (lx + 0.05, -0.55), (lx - 0.04, -0.55)], 0.02, at=(x, y, z))
        B.slab('charcoal', [(0.6, 0.7), (1.0, 0.95), (0.8, 1.05), (0.4, 0.75)], 0.02, at=(x, y - 0.01, z))
    elif kind == 'deer':
        B.slab(role, [(-0.7, 0.0), (0.5, 0.0), (0.8, 0.45), (0.65, 0.55), (0.3, 0.4), (-0.6, 0.45)], 0.02, at=(x, y, z))
        for lx in (-0.5, -0.3, 0.25, 0.4):
            B.slab(role, [(lx, 0.02), (lx + 0.07, 0.02), (lx + 0.03, -0.6), (lx - 0.03, -0.6)], 0.02, at=(x, y, z))
        for k in range(3):
            B.slab('charcoal', [(0.7, 0.5), (0.74, 0.5), (0.6 + 0.12 * k, 1.2), (0.56 + 0.12 * k, 1.2)], 0.02, at=(x, y - 0.01, z))
    elif kind == 'bull':
        B.slab(role, [(-1.2, 0.0), (0.7, 0.0), (1.1, 0.35), (1.0, 0.75), (0.3, 1.0), (-0.6, 0.85), (-1.3, 0.4)], 0.02, at=(x, y, z))
        for lx in (-0.9, -0.6, 0.4, 0.65):
            B.slab(role, [(lx, 0.02), (lx + 0.14, 0.02), (lx + 0.08, -0.5), (lx - 0.02, -0.5)], 0.02, at=(x, y, z))
        B.slab('charcoal', [(0.95, 0.7), (1.05, 0.72), (1.25, 1.1), (1.15, 1.12)], 0.02, at=(x, y - 0.01, z))
    else:
        for k in range(3):
            hx = x + k * 0.5
            B.sphere(role, (hx, y - 0.01, z), 0.14, scale=(1.0, 0.1, 1.2), subdiv=1)
            for j in range(5):
                a = math.radians(150 - 30 * j)
                B.slab(role, [(0.0, 0.0), (0.04, 0.0), (0.24 * math.cos(a), 0.26 * math.sin(a)), (0.2 * math.cos(a), 0.26 * math.sin(a))], 0.02, at=(hx, y - 0.01, z + 0.05))


def build_L1(rng):
    L = 'L1'
    fill_below(TH, L, 'soil', top=0.0, depth=17.0, y=4.5)['outline'] = 0
    B = Builder('L1_strata', L, TH)
    for k, (z, role) in enumerate(((-2.8, 'soil2'), (-5.2, 'soil3'), (-12.4, 'soil2'))):
        zf = periodic_fn(rng, z - 0.4, z + 0.4, 3)
        n = 60
        pts = [(-OVER + (P + 2 * OVER) * i / n, zf(-OVER + (P + 2 * OVER) * i / n)) for i in range(n + 1)]
        poly = [(x, zz - 0.9) for x, zz in pts] + [(x, zz) for x, zz in reversed(pts)]
        B.slab(role, poly[::-1] if False else poly, 0.02, at=(0, 1.05, 0))
    for k in range(26):
        x = rng.uniform(0, P)
        z = rng.uniform(-15.0, -0.8)
        if -11.8 < z < -6.0:
            continue
        w = rng.uniform(0.3, 0.7)
        for dx in wraps(x, w):
            B.rbox(('stone', 'stone2')[k % 2], (x + dx, 1.0, z), (w, 0.3, w * 0.7), bevel=0.12, segments=2)
    # oak roots dangling from the top
    for k in range(10):
        x = (k + rng.uniform(0.2, 0.8)) * P / 10
        for dx in wraps(x, 1.0):
            pts = [(x + dx, 0.95, 0.0)]
            for j in range(4):
                px, _, pz = pts[-1]
                pts.append((px + rng.uniform(-0.4, 0.4), 0.95, pz - rng.uniform(0.5, 0.9)))
            B.chain('root', pts, 0.09, segs=5, taper=0.3)
    B.done(period=None)['outline'] = 0.4
    # the painted cave band, from -6 to -11.8 m: a smooth pale wall with the paintings, a dark stream below
    C = Builder('L1_cave', L, TH)
    zf = periodic_fn(rng, -6.3, -5.7, 2)
    zg = periodic_fn(rng, -11.9, -11.4, 2)
    n = 60
    top = [(-OVER + (P + 2 * OVER) * i / n, zf(-OVER + (P + 2 * OVER) * i / n)) for i in range(n + 1)]
    bot = [(-OVER + (P + 2 * OVER) * i / n, zg(-OVER + (P + 2 * OVER) * i / n)) for i in range(n + 1)]
    C.slab('cave', bot + list(reversed(top)), 0.02, at=(0, 1.0, 0))
    for k in range(6):
        x = rng.uniform(0, P)
        for dx in wraps(x, 1.2):
            C.sphere('cave2', (x + dx, 0.99, rng.uniform(-11.0, -6.8)), 0.9, scale=(1.6, 0.05, 0.8), subdiv=2)
    C.box('stream', (P / 2, 0.97, -12.6), (P + 2 * OVER, 0.04, 1.0), bevel=0.0)
    for k in range(10):
        x = rng.uniform(0, P)
        for dx in wraps(x, 0.6):
            C.box('stream_hi', (x + dx, 0.95, -12.4 + rng.uniform(-0.3, 0.3)), (rng.uniform(0.5, 1.1), 0.02, 0.05), bevel=0.0)
    seq = [('horse', 'ochre'), ('hands', 'ochre2'), ('bull', 'ochre'), ('deer', 'charcoal'), ('horse', 'ochre2'), ('bull', 'charcoal')]
    for k, (kind, role) in enumerate(seq):
        x = (k + 0.5) * P / len(seq)
        painting(C, kind, x, -8.6 + 0.5 * math.sin(k * 1.7), 1.0, role)
    C.done(period=None)['outline'] = 0


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return K.grass_ground(TH, random.Random(seed), {'turf': 'turf', 'turf_hi': 'turf_hi', 'soil': 'g_soil', 'soil_dark': 'g_soil_dark', 'rock': 'g_rock'})


def clear():
    TH.clear()
