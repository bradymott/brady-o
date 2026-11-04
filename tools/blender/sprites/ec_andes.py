# Ecuador 2-2 "Cable Car Climb" (theme ec_andes): the parallax background as a Fiesta Toon diorama, one Collection
# per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a gondola ride up into the high Andes.
#
#   L0  mountains  (base 300, #9ab0d8, dyn:ecCables, blur)  far snowy peaks + the static cable-car pylons (lattice
#                                                            towers with a cross arm); the engine draws the cables and
#                                                            the gliding cabins on top
#   L1  ecCotopaxi (base 330, #7a8ab0)                       the perfect cone with its snow cap and a wisp of steam
#   L2  clouds     (base 360, #ffffff)                       a fluffy cloud bank sitting on its ground line
#   L3  ecAndes    (base 380, #5aa85a)                       green domed ridges quilted with patchwork fields
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
    'andes_hill': '#5aa85a', 'andes_hill2': '#4c924c',
    'andes_field_a': '#b0cc6a', 'andes_field_b': '#86c062', 'andes_field_c': '#c8c070', 'andes_field_d': '#6ab454',
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
    K.andean_ridges(TH, 'L3', rng, {'hill': 'andes_hill', 'hill2': 'andes_hill2', 'field_a': 'andes_field_a', 'field_b': 'andes_field_b',
                                    'field_c': 'andes_field_c', 'field_d': 'andes_field_d'}, hmax=2.4)

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
