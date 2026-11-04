# Brazil 3-4 "Pantanal Wetlands": the parallax background as a low-poly Fiesta Toon diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a flat sunset marsh with lone flat-topped
# trees, reeds, giant lily pads and a pair of storks.
#
#   L0  brMarsh   the marsh filling from z = 0 down (pale pool streaks in it), lone trees with wide flat crowns
#                 (painter: 6 px trunk, 88 x 32 px canopy) every 120-240 px, reed clumps with cattail heads,
#                 giant lily pads with a pink flower, two jabiru storks wading, a pair of blue macaws on a branch
#   L1  brPalms   the shared leaning palms (br_beach.palm_row) in dusty greens
#   ground        grass (br_falls.grass_ground) in the Pantanal's colours: yellow-green turf over brown mud
#
# Shares the kit of br_beach; same contract.
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/br_pantanal.py
import os, sys, math, random
import bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import br_beach as K
import br_falls
from br_beach import Builder, wraps, new_collection, palm_row, P, GP, GROUND_DEPTH, GROUND_COLL, T, PX, TAU

MODULE = 'br_pantanal'
LAYERS = ['L0', 'L1']                      # back to front: brMarsh, brPalms
BASES = {'L0': 360, 'L1': 370}
SKY = ['#ff9a5a', '#ffd08a', '#fff4d0']

PALETTE = {
    'pant_marsh': '#6a9a4a', 'pant_marsh_deep': '#5a8a40', 'pant_pool': '#88b4a4', 'pant_pool2': '#98c0b4',
    'pant_canopy': '#507434', 'pant_canopy2': '#5c8440', 'pant_tree_trunk': '#5a4030', 'pant_reed': '#5a8a3a', 'pant_reed2': '#6a9a44', 'pant_cattail': '#6a4a2a',
    'pant_pad': '#5a9a3a', 'pant_pad_rim': '#4a7a30', 'pant_lily': '#ff8ab8', 'pant_lily_heart': '#ffe070',
    'pant_stork': '#f6f6f2', 'pant_stork_dark': '#2a2a30', 'pant_stork_red': '#e04040', 'pant_macaw': '#2a4ad8', 'pant_macaw_face': '#ffe070',
    'pant_trunk': '#5a4a34', 'pant_trunk_ring': '#6a5a40', 'pant_frond': '#3a6a2a', 'pant_frond2': '#487c36', 'pant_coconut': '#8a9a3a',
    'pant_turf': '#6aa83a', 'pant_turf_hi': '#a8d86a', 'pant_soil': '#7a5a3a', 'pant_clod': '#4a3a24', 'pant_clod2': '#5e472e', 'pant_stone': '#8a6a4a',
}
K.register(PALETTE)
PALM_R = {'trunk': 'pant_trunk', 'ring': 'pant_trunk_ring', 'frond': 'pant_frond', 'frond2': 'pant_frond2', 'coconut': 'pant_coconut'}
GRASS_R = {'turf': 'pant_turf', 'turf_hi': 'pant_turf_hi', 'soil': 'pant_soil', 'clod': 'pant_clod', 'clod2': 'pant_clod2', 'stone': 'pant_stone'}

# ----------------------------------------------------------------------------------------------- L0 the marsh
def marsh_tree(B, x, y, rng):
    """A lone wetland tree: a short trunk and a wide, flat crown (painter: 60 px trunk, 88 x 32 px ellipse)."""
    h = 60 * PX * rng.uniform(0.9, 1.15)
    B.rod('pant_tree_trunk', (x, y, -0.2), (x + 0.05, y, h + 0.1), 0.11, segs=6, r2=0.08)
    for sx in (-0.5, 0.55):
        B.rod('pant_tree_trunk', (x, y, h * 0.6), (x + sx, y, h + 0.25), 0.05, segs=4, r2=0.03)
    B.sphere('pant_canopy', (x, y, h + 0.2), 1.0, scale=(44 * PX, 0.6, 16 * PX), subdiv=2)
    B.sphere('pant_canopy2', (x - 0.35, y - 0.15, h + 0.42), 1.0, scale=(24 * PX, 0.45, 10 * PX), subdiv=1)

def reeds(B, x, y, rng):
    for k in range(rng.randrange(5, 8)):
        rx = x + rng.uniform(-0.35, 0.35); rh = rng.uniform(0.9, 1.6); tilt = rng.uniform(-0.12, 0.12)
        role = rng.choice(['pant_reed', 'pant_reed2'])
        B.rod(role, (rx, y, -0.2), (rx + tilt, y, rh), 0.04, segs=4, r2=0.025)
        if rng.random() < 0.5:
            B.sphere('pant_cattail', (rx + tilt, y, rh - 0.12), 0.06, scale=(1, 1, 2.6), subdiv=1)

def lily(B, x, y, rng, flower=True):
    r = rng.uniform(0.45, 0.65)
    B.disc('pant_pad_rim', (x, y, -0.22), r + 0.04, 0.08, segs=12, scale_z=0.3)
    B.disc('pant_pad', (x, y - 0.03, -0.2), r, 0.08, segs=12, scale_z=0.3)
    if flower:
        B.sphere('pant_lily', (x + r * 0.3, y - 0.1, -0.02), 0.17, scale=(1.2, 0.8, 1.0), subdiv=1)
        B.sphere('pant_lily_heart', (x + r * 0.3, y - 0.2, 0.08), 0.06, subdiv=0)

def stork(B, x, y, rng, flip=1):
    """A jabiru: white body, black neck and head, a red collar, long legs, a heavy black bill."""
    B.rod('pant_stork_dark', (x - 0.08, y, -0.2), (x - 0.1, y, 0.6), 0.025, segs=4)
    B.rod('pant_stork_dark', (x + 0.1, y, -0.2), (x + 0.12, y, 0.6), 0.025, segs=4)
    B.sphere('pant_stork', (x, y, 0.78), 0.3, scale=(1.5, 0.8, 0.85), subdiv=1)
    B.sphere('pant_stork_dark', (x - 0.48 * flip, y, 0.74), 0.12, scale=(1.0, 0.7, 0.8), subdiv=1)     # tail
    nx, nz = x + 0.34 * flip, 0.9
    B.rod('pant_stork_dark', (nx, y, nz), (nx + 0.08 * flip, y, 1.4), 0.07, segs=5, r2=0.06)
    B.sphere('pant_stork_red', (nx + 0.01 * flip, y, 1.02), 0.1, scale=(1.1, 1.1, 0.5), subdiv=1)
    B.sphere('pant_stork_dark', (nx + 0.1 * flip, y, 1.45), 0.12, subdiv=1)
    B.rod('pant_stork_dark', (nx + 0.14 * flip, y, 1.42), (nx + 0.56 * flip, y, 1.28), 0.045, segs=4, r2=0.01)

def macaws(B, x, y, z, rng):
    for k, sx in enumerate((-0.16, 0.16)):
        B.sphere('pant_macaw', (x + sx, y, z + 0.16), 0.11, scale=(0.9, 0.8, 1.3), subdiv=1)
        B.sphere('pant_macaw', (x + sx, y, z + 0.36), 0.08, subdiv=1)
        B.sphere('pant_macaw_face', (x + sx + (0.05 if k else -0.05), y - 0.05, z + 0.36), 0.035, subdiv=0)
        B.rod('pant_macaw', (x + sx, y, z + 0.08), (x + sx + (0.1 if k else -0.1), y, z - 0.3), 0.035, segs=4, r2=0.015)

def build_L0(rng):
    L = 'L0'
    B = Builder('marsh', L)
    B.box('pant_marsh', (P / 2, 3.5, -0.6), (P, 5.0, 1.2), bevel=0.0)
    B.box('pant_marsh_deep', (P / 2, 3.5, -8.8), (P, 5.0, 15.2), bevel=0.0)
    for k in range(9):
        x, z, w = rng.uniform(0, P), -(10 + rng.uniform(0, 40)) * PX, rng.uniform(80, 160) * PX
        for dx in wraps(x, w / 2):
            B.rbox(rng.choice(['pant_pool', 'pant_pool2']), (x + dx, 0.9, z), (w, 0.1, 4 * PX), bevel=0.05, segments=1)
    B.done(period=None)
    # the lone trees
    x, i, tree_xs = rng.uniform(0.5, 2.0), 0, []
    while x < P:
        B = Builder(f'marsh_tree_{i}', L)
        y = rng.choice([1.6, 2.4, 3.2])
        marsh_tree(B, x, y, rng)
        tree_xs.append((x, y))
        B.done()
        x += rng.uniform(120, 240) * PX; i += 1
    # reeds and lily pads along the near edge, storks in two of the gaps, macaws on one tree
    B = Builder('marsh_life', L)
    for k in range(12):
        rx = rng.uniform(0, P)
        for dx in wraps(rx, 0.5):
            reeds(B, rx + dx, rng.uniform(0.3, 1.2), rng)
    for k in range(7):
        lx = rng.uniform(0, P)
        for dx in wraps(lx, 0.8):
            lily(B, lx + dx, rng.uniform(0.2, 0.8), rng, flower=(k % 2 == 0))
    gaps = sorted(tree_xs)
    for j, (sx, flip) in enumerate(((P * 0.22, 1), (P * 0.68, -1))):
        near = min(gaps, key=lambda t: abs(t[0] - sx))
        if abs(near[0] - sx) < 1.0:
            sx += 1.6
        stork(B, sx, 0.9 + 0.3 * j, rng, flip)
    tx, ty = tree_xs[len(tree_xs) // 2]
    macaws(B, tx + 0.3, ty - 0.7, 60 * PX + 0.5, rng)
    B.done()

def build_L1(rng):
    palm_row('L1', PALM_R, rng, h_range=(3.0, 4.6), pitch=(3.6, 7.0))

# ----------------------------------------------------------------------------------------------- scene api
def clear():
    K.clear_collections(LAYERS)

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: K.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    return br_falls.grass_ground(seed, GRASS_R)

if __name__ == '__main__':
    seed = 1
    for i, a in enumerate(sys.argv):
        if a == '--seed' and i + 1 < len(sys.argv):
            seed = int(sys.argv[i + 1])
    K.preview(sys.modules[__name__], seed)
