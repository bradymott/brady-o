# France overhaul theme fr_provence (7-2 "Lavender Magpie", level overhaul §8: N fr_provence): original toon art for
# the lavender fields of Provence under a hot blue sky, built with the France toolkit (fr_kit, fr_morning).
# Suggested theme entry: sky ['#3a8ae8', '#9ad0ff', '#fff4e0'], ground 'grass', layers
#   [{kind:'frLuberon', color:'#9a8ac8', base:300, f:0.03, blur:true}, {kind:'frLavender', color:'#8a6ac8', base:340, f:0.1},
#    {kind:'frSunflowers', color:'#e8b830', base:375, f:0.25}].
#   L0  frLuberon    (base 300, f 0.03, blur): soft blue-violet hills with a far hill village of ochre cubes and
#                    terracotta roofs (a plain silhouette cluster), unlined
#   L1  frLavender   (base 340, f 0.1): rows of round lavender bushes in two purples striping the slope, a stone
#                    farmhouse (mas) with a terracotta roof and blue shutters, dark cypress spires, an olive tree
#   L2  frSunflowers (base 375, f 0.25): clumps of tall sunflowers turned to the sun and white bee hives on the field
#                    edge (their round flower heads never read as ledges)
#   ground grass: a dry-grass cap over ochre Provence earth with pale limestone pebbles
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import fr_kit as K
from fr_kit import Builder, P, TAU, OVER, PPM, wraps, ridge_slab, periodic_fn, fill_below, jittered
import fr_morning as FM

MODULE = 'fr_provence'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 300, 'L1': 340, 'L2': 375}
SKY = ['#3a8ae8', '#9ad0ff', '#fff4e0']
PALETTE = {
    'hill': '#a898d0', 'hill2': '#9a8ac8', 'hill_far': '#b8acd8', 'village': '#e8c8a0', 'village2': '#dcb890', 'vroof': '#c88a6a',
    'slope': '#8a9a4a', 'slope2': '#7a8a40', 'lav': '#8a5ac8', 'lav2': '#a87ad8', 'lav_dark': '#6a4aa8', 'path': '#d8c08a',
    'mas': '#f0dcb8', 'mas2': '#e4cca4', 'tile': '#c8643a', 'tile2': '#b0522e', 'shutter': '#4a8ac8', 'door': '#7a5a3a',
    'cypress': '#2e5a3a', 'cypress2': '#3a6a44', 'olive': '#8aa070', 'olive2': '#a0b488', 'olive_trunk': '#7a6a5a',
    'stalk': '#5a8a3a', 'leaf': '#4a7a32', 'petal': '#ffc828', 'petal2': '#f0a818', 'seed': '#6a3a1a',
    'hive': '#f4f0e4', 'hive2': '#d8d0bc', 'hive_roof': '#c8643a',
    'turf': '#b8b850', 'turf_hi': '#dcd878', 'soil': '#c89a5a', 'soil_dark': '#b0844a', 'rock': '#efe6d0',
}
TH = FM.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)


def build_L0(rng):
    L = 'L0'
    ridge_slab(TH, L, 'L0_far', periodic_fn(rng, 1.6, 3.2, 3), 'hill_far', y=4.5, depth=1.0, zb=-2.0)['outline'] = 0
    zf = periodic_fn(rng, 0.8, 2.4, 3)
    ridge_slab(TH, L, 'L0_hills', zf, 'hill', y=3.5, depth=1.0, zb=-2.0)['outline'] = 0
    # a hill village: a stack of ochre cubes with terracotta roofs, a plain cluster
    B = Builder('L0_village', L, TH)
    for v in range(2):
        cx = P * (0.3 + 0.45 * v)
        z0 = zf(cx)
        for dx in wraps(cx, 2.6):
            B.lathe('hill2', [(2.6, -1.0), (2.0, z0 - 0.2), (1.2, z0 + 0.25), (0.0, z0 + 0.4)], 12, at=(cx + dx, 3.1, 0.0), yscale=0.3, smooth=True)
        for k in range(9):
            w = rng.uniform(0.5, 0.9)
            x = cx + rng.uniform(-1.4, 1.4) * (1 - k / 12)
            z = z0 - 0.3 + 0.25 * (k % 4) + (0.4 if abs(x - cx) < 0.6 else 0.0)
            role = 'village' if k % 2 else 'village2'
            for dx in wraps(x, w):
                B.box(role, (x + dx, 3.0 - 0.05 * k, z + 0.3), (w, 0.6, 0.6), bevel=0.0)
                B.slab('vroof', [(-w / 2 - 0.04, 0.0), (w / 2 + 0.04, 0.0), (0.0, 0.18)], 0.62, at=(x + dx, 2.99 - 0.05 * k, z + 0.6))
    B.done(period=None)['outline'] = 0


def lav_row(B, z, y, n, rng, role, r=0.32):
    x = rng.uniform(0, 0.6)
    while x < P + 0.3:
        rr = r * rng.uniform(0.85, 1.1)
        for dx in wraps(x, rr):
            B.sphere(role, (x + dx, y, z + rr * 0.55), rr, scale=(1.25, 0.8, 0.85), subdiv=2)
        x += rr * 2.2


def cypress(B, x, h, y):
    B.lathe('cypress', [(0.0, 0.0), (0.32, 0.3), (0.38, h * 0.35), (0.28, h * 0.7), (0.0, h)], 8, at=(x, y, 0.0), smooth=True)
    B.lathe('cypress2', [(0.0, h * 0.2), (0.18, h * 0.4), (0.12, h * 0.75), (0.0, h * 0.9)], 6, at=(x - 0.08, y - 0.2, 0.0), smooth=True)


def mas(B, x, y, rng):
    w, h = 4.2, 2.1
    B.box('mas', (x, y, h / 2), (w, 1.4, h), bevel=0.04)
    B.box('mas2', (x + w / 2 + 0.9, y + 0.2, 0.8), (1.8, 1.2, 1.6), bevel=0.04)
    B.slab('tile', [(-w / 2 - 0.2, 0.0), (w / 2 + 0.2, 0.0), (w / 2 - 0.4, 0.55), (-w / 2 + 0.4, 0.55)], 1.5, at=(x, y - 0.05, h))
    B.slab('tile2', [(-0.15, 0.0), (2.0, 0.0), (1.8, 0.4), (-0.1, 0.4)], 1.3, at=(x + w / 2, y + 0.15, 1.6))
    for k in range(3):
        wx = x - 1.3 + 1.3 * k
        B.box('shutter', (wx - 0.3, y - 0.72, 1.35), (0.2, 0.04, 0.55), bevel=0.0)
        B.box('shutter', (wx + 0.3, y - 0.72, 1.35), (0.2, 0.04, 0.55), bevel=0.0)
        B.box('door', (wx, y - 0.71, 1.35), (0.38, 0.03, 0.5), bevel=0.0)
    B.box('door', (x + 0.65, y - 0.72, 0.5), (0.55, 0.03, 1.0), bevel=0.0)


def olive(B, x, y, rng):
    B.rod('olive_trunk', (x, y, 0.0), (x + 0.2, y, 0.9), 0.12, segs=5, r2=0.08)
    B.rod('olive_trunk', (x + 0.2, y, 0.9), (x - 0.25, y, 1.4), 0.07, segs=5)
    for k in range(6):
        B.sphere(('olive', 'olive2')[k % 2], (x + rng.uniform(-0.8, 0.8), y - 0.1, 1.5 + rng.uniform(-0.25, 0.35)), rng.uniform(0.4, 0.55), scale=(1.3, 0.7, 0.7), subdiv=2)


def build_L1(rng):
    L = 'L1'
    zf = periodic_fn(rng, 0.9, 1.6, 2)
    ridge_slab(TH, L, 'L1_slope', zf, 'slope', y=2.6, depth=1.0, zb=-3.0)
    B = Builder('L1_lavender', L, TH)
    for k, (z, y, role) in enumerate(((1.3, 2.2, 'lav_dark'), (0.85, 1.8, 'lav'), (0.42, 1.4, 'lav2'), (0.0, 1.0, 'lav'))):
        lav_row(B, z, y, 0, rng, role, r=0.3 + 0.03 * k)
    B.done(period=None)
    C = Builder('L1_farm', L, TH)
    mas(C, P * 0.3, 1.6, rng)
    for x in (P * 0.3 - 3.2, P * 0.3 + 4.6, P * 0.72, P * 0.72 + 0.9, P * 0.92):
        cypress(C, x % P, rng.uniform(3.2, 4.4), 1.2)
    olive(C, P * 0.55, 1.2, rng)
    C.done()


def sunflower(B, x, h, y, rng, face=0.0):
    B.rod('stalk', (x, y, 0.0), (x + 0.1, y, h), 0.05, segs=5)
    for k in range(2):
        B.slab('leaf', [(0.0, 0.0), (0.4, 0.12), (0.5, 0.3), (0.12, 0.18)], 0.04, at=(x + 0.05, y - 0.05, h * (0.35 + 0.25 * k)), rot=(0, 0.3 - 0.8 * k, 0))
    c = (x + 0.12, y - 0.1, h + 0.1)
    for k in range(12):
        a = TAU * k / 12
        B.slab('petal' if k % 2 else 'petal2', [(0.0, -0.08), (0.36, 0.0), (0.0, 0.08)], 0.03, at=c, rot=(0, -a, 0))
    B.sphere('seed', (c[0], c[1] - 0.06, c[2]), 0.2, scale=(1, 0.4, 1), subdiv=2)


def hive(B, x, y):
    B.box('hive', (x, y, 0.35), (0.7, 0.6, 0.7), bevel=0.03)
    B.box('hive2', (x, y - 0.31, 0.25), (0.5, 0.02, 0.06), bevel=0.0)
    B.slab('hive_roof', [(-0.45, 0.0), (0.45, 0.0), (0.0, 0.3)], 0.7, at=(x, y - 0.35, 0.7))


def build_L2(rng):
    L = 'L2'
    B = Builder('L2_flowers', L, TH)
    x = 0.8
    k = 0
    while x < P - 1.0:
        if k % 4 == 3:
            for dx in wraps(x + 0.5, 0.6):
                hive(B, x + 0.5 + dx, 0.2)
                hive(B, x + 1.4 + dx, 0.4)
            x += 3.0
        else:
            n = rng.randrange(3, 6)
            for j in range(n):
                xx = x + j * 0.45
                for dx in wraps(xx, 0.5):
                    sunflower(B, xx + dx, rng.uniform(1.6, 2.4), -0.2 + 0.25 * (j % 2), rng)
            x += n * 0.45 + rng.uniform(1.6, 3.2)
        k += 1
    B.done(period=None)


def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    build_L2(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}


def build_ground(seed=1):
    return K.grass_ground(TH, random.Random(seed), {'turf': 'turf', 'turf_hi': 'turf_hi', 'soil': 'soil', 'soil_dark': 'soil_dark', 'rock': 'rock'})


def clear():
    TH.clear()
