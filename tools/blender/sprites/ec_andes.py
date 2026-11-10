# Ecuador 2-2 "Cable Car Climb" (theme ec_andes): the parallax background as a Fiesta Toon diorama, one Collection
# per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a gondola ride up into the high Andes.
#
#   L0  mountains  (base 300, #9ab0d8, dyn:ecCables, blur)  far snowy peaks + the static cable-car pylons (lattice
#                                                            towers with a cross arm); the engine draws the cables and
#                                                            the gliding cabins on top
#   L1  ecCotopaxi (base 330, #7a8ab0)                       the perfect cone with its snow cap and a wisp of steam
#   L2  clouds     (base 360, #ffffff)                       a fluffy cloud bank sitting on its ground line
#   L3  ecAndes    (base 380, #5aa85a)                       the hazy valley far below: low ridges with a painted
#                                                            patchwork of fields, farmsteads, valley mist
#   ground                                                   grass: turf cap over soil
#
# Contract, conventions and the shared toolkit: see ec_equator.py.
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/ec_andes.py [--seed N]
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import ec_equator as K
from ec_equator import Builder, P, TAU

MODULE = 'ec_andes'
LAYERS = ['L0', 'L1', 'L2', 'L3']
BASES = {'L0': 300, 'L1': 330, 'L2': 360, 'L3': 380}
SKY = ['#3a7ad8', '#a8d0ff', '#ffffff']
PALETTE = {
    # L0 far peaks (#9ab0d8) and the pylons
    'andes_peak': '#9ab0d8', 'andes_peak2': '#8ea4cf', 'andes_haze': '#b2c4e4', 'andes_snow': '#f6f9ff', 'andes_foot': '#8a9ec8',
    'andes_steel': '#4a5068', 'andes_steel_hi': '#6a7290', 'andes_wheel': '#2e3448',
    # L1 Cotopaxi (#7a8ab0)
    'andes_cone': '#7a8ab0', 'andes_cone_snow': '#ffffff', 'andes_steam': '#f4f8ff', 'andes_cone_foot': '#6c7ca2',
    # L2 clouds (#ffffff)
    'andes_cloud': '#ffffff', 'andes_cloud_fill': '#eef4ff',
    # L3 ridges (#5aa85a)
    # (pale and blue-shifted: the valley is far below the gondola, seen through the air)
    'andes_hill': '#7cb486', 'andes_hill2': '#8fbaa6',
    'andes_field_a': '#9cc48a', 'andes_field_b': '#8abc80', 'andes_field_c': '#b4c896', 'andes_field_d': '#a6c48c',
    'andes_field_e': '#9cc2aa', 'andes_field_f': '#a8c6a8', 'andes_field_g': '#94bca6',
    'andes_wall': '#f4f0e6', 'andes_roof': '#d07a5a', 'andes_tree': '#5e9a72', 'andes_mist': '#eef6f8',
    # ground (grass)
    'andes_g_turf': '#5ab84a', 'andes_g_turf_hi': '#a8e86a', 'andes_g_soil': '#7e5236', 'andes_g_soil_dark': '#5a3a24', 'andes_g_rock': '#a87a5a',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)

def pylon(L, name, x, y, z0, top, rng):
    """A cable-car pylon: two legs converging on a cap, three X-braces, a cross arm with a sheave wheel at each end."""
    B = Builder(name, L, TH)
    hw0, hw1 = 0.95, 0.32
    for sx in (-1, 1):
        B.rod('andes_steel', (x + sx * hw0, y, z0), (x + sx * hw1, y, top), 0.12, segs=5, r2=0.1)
    for k in range(4):
        t0, t1 = k / 4, (k + 1) / 4
        za, zb = z0 + (top - z0) * t0, z0 + (top - z0) * t1
        ha, hb = hw0 + (hw1 - hw0) * t0, hw0 + (hw1 - hw0) * t1
        B.rod('andes_steel_hi', (x - ha, y - 0.05, za), (x + hb, y - 0.05, zb), 0.05, segs=4)
        B.rod('andes_steel_hi', (x + ha, y - 0.05, za), (x - hb, y - 0.05, zb), 0.05, segs=4)
        B.rod('andes_steel_hi', (x - ha, y + 0.05, za), (x + ha, y + 0.05, za), 0.05, segs=4)
    B.box('andes_steel', (x, y, top + 0.1), (1.0, 0.5, 0.22), bevel=0.03)
    B.box('andes_steel', (x, y, top + 0.28), (2.9, 0.3, 0.16), bevel=0.02)
    for sx in (-1, 1):
        B.lathe('andes_wheel', [(0.22, -0.06), (0.22, 0.06)], 10, at=(x + sx * 1.3, y, top + 0.28), rot=(math.pi / 2, 0, 0), cap_top=True, cap_bottom=True)
    B.done()

def build_L0(rng):
    L = 'L0'
    K.far_mountains(TH, L, rng, {'rock': 'andes_peak', 'rock2': 'andes_peak2', 'snow': 'andes_snow', 'haze': 'andes_haze', 'foot': 'andes_foot'}, amp=6.0, n=(6, 7))
    # three pylons on the lower slopes, their arms up at the cable height (rows ~90-150 of the strip)
    for i, x in enumerate(K.jittered(rng, 3, 0.2)):
        pylon(L, f'L0_pylon_{i}', x, -1.5, rng.uniform(1.4, 2.2), rng.uniform(6.6, 7.3), rng)

def build_L1(rng):
    K.volcano_cone(TH, 'L1', rng, {'rock': 'andes_cone', 'snow': 'andes_cone_snow', 'steam': 'andes_steam', 'foot': 'andes_cone_foot'}, h=8.6, R=11.2)

def build_L2(rng):
    """A cloud bank: big soft puffs sitting on the ground line over a pale fill, smaller bright puffs riding on top."""
    L = 'L2'
    K.fill_below(TH, L, 'andes_cloud_fill', top=-0.5, depth=3.0, y=2.5)
    B = Builder('L2_puffs', L, TH)
    n = 24
    for i in range(n):
        x = (i / n) * P + rng.uniform(0, 1.0)
        r = rng.uniform(1.3, 2.4)
        for dx in K.wraps(x, r):
            B.sphere('andes_cloud', (x + dx, rng.uniform(0.0, 2.5), rng.uniform(-0.3, 0.4)), r, scale=(1.15, 0.8, 0.9), subdiv=2)
    for i in range(14):
        x = rng.uniform(0, P); r = rng.uniform(0.5, 0.9)
        for dx in K.wraps(x, r):
            B.sphere('andes_cloud', (x + dx, rng.uniform(-0.8, 0.4), rng.uniform(1.4, 2.2)), r, scale=(1.2, 0.8, 0.85), subdiv=2)
    B.done(period=None)

def build_L3(rng):
    """The valley far below the gondola: low, hazy green ridges with a patchwork of fields painted on their faces
    (flat colour patches that follow the contours, no ink of their own, so nothing reads as a platform), a few tiny
    farmsteads and trees, and drifting valley mist along the foot. Everything stays low (under ~1.3 m = 36 px above
    the ground line) and pale, so it sits clearly behind and below the ride."""
    L = 'L3'
    rows = [  # (y, z offset, skyline min/max, hill role, field roles)
        (4.0, -0.55, (0.35, 1.0), 'andes_hill2', ['andes_field_e', 'andes_field_f', 'andes_field_g', 'andes_hill2']),
        (1.6, -0.15, (0.0, 0.85), 'andes_hill', ['andes_field_a', 'andes_field_b', 'andes_field_c', 'andes_field_d', 'andes_hill']),
    ]
    for r, (y, zo, (z0, z1), hill, fields) in enumerate(rows):
        zf = K.periodic_fn(rng, z0 + zo, z1 + zo, 3)
        K.ridge_slab(TH, L, f'L3_ridge{r}', zf, hill, y=y, depth=1.0, zb=-3.2)
        # the quilt: columns of irregular width, each split into contour-following bands
        B = Builder(f'L3_fields{r}', L, TH)
        x, k = 0.0, 0
        edges = []
        while x < P - 0.8:
            edges.append(x); x += rng.uniform(1.6, 3.2)
        edges.append(P)
        for i, (xa, xb) in enumerate(zip(edges, edges[1:])):
            depths = [0.12, rng.uniform(0.45, 0.7), rng.uniform(1.0, 1.4), 2.2]
            for j, (da, db) in enumerate(zip(depths, depths[1:])):
                role = fields[(i * 3 + j * 2 + rng.randint(0, 1)) % len(fields)]
                n = 6
                xs = [xa + 0.04 + (xb - xa - 0.08) * q / n for q in range(n + 1)]
                bot = [(xx, zf(xx) - db) for xx in xs]                  # left to right along the bottom,
                top = [(xx, zf(xx) - da) for xx in reversed(xs)]        # then back along the top (CCW from -Y)
                B.slab(role, bot + top, 0.03, at=(0, y - 0.05, 0))
                k += 1
        ob = B.done(period=None); ob['outline'] = 0.0
        # tiny farmsteads (white walls, red roofs) and round trees along the front row's slopes
        if r == 1:
            T = Builder('L3_farms', L, TH)
            for xh in K.jittered(rng, 5, 0.3):
                zh = zf(xh) - rng.uniform(0.25, 0.5)
                T.box('andes_wall', (xh, y - 0.15, zh + 0.1), (0.36, 0.2, 0.22), bevel=0.02)
                T.slab('andes_roof', [(xh - 0.24, zh + 0.2), (xh + 0.24, zh + 0.2), (xh, zh + 0.38)], 0.24, at=(0, y - 0.27, 0))
            for xt in K.jittered(rng, 14, 0.4):
                zt = zf(xt) - rng.uniform(0.1, 0.9)
                T.sphere('andes_tree', (xt, y - 0.2, zt + 0.16), 0.17, scale=(1.0, 0.6, 1.15), subdiv=1)
            ob = T.done(period=None); ob['outline'] = 0.35
    # valley mist drifting along the foot of the near ridges
    Mz = Builder('L3_mist', L, TH)
    for i in range(18):
        xm = (i / 18) * P + rng.uniform(0, 1.2)
        rm = rng.uniform(0.7, 1.3)
        for dx in K.wraps(xm, rm * 1.6):
            Mz.sphere('andes_mist', (xm + dx, 0.6, rng.uniform(-1.2, -0.8)), rm, scale=(1.6, 0.5, 0.45), subdiv=2)
    ob = Mz.done(period=None); ob['outline'] = 0.0

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    build_L2(random.Random(rng.random()))
    build_L3(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    """Grass floor (turf cap over soil), tile-aligned, period GP; its own collection 'ground'."""
    return K.grass_ground(TH, random.Random(seed), {'turf': 'andes_g_turf', 'turf_hi': 'andes_g_turf_hi', 'soil': 'andes_g_soil',
                                                    'soil_dark': 'andes_g_soil_dark', 'rock': 'andes_g_rock'})

def clear():
    TH.clear()

if __name__ == '__main__':
    K.preview(TH, build, build_ground)
