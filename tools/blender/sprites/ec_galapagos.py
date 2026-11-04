# Ecuador 2-4 "Galápagos Snorkel" (theme ec_galapagos): the parallax background as a Fiesta Toon diorama, one
# Collection per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a sunlit sea over black
# lava rock: mounds and boulders, two lava-rock arches, kelp swaying up toward the light, rising bubbles.
#
#   L0  rocks (base 330, #16607a)  a rolling lava-rock mound with rounded boulders along its crest, two rock
#                                  arches, a few sea stars
#   L1  kelp  (base 400, #0e6a5a)  tall wavy kelp stalks (4-8 m) with alternating blades, bubble trails
#   ground                         coral: a pink coral cap (nubs and a pale rim) over dark lava-rock plates
#
# Contract, conventions and the shared toolkit: see ec_equator.py.
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/ec_galapagos.py [--seed N]
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import ec_equator as K
from ec_equator import Builder, P, TAU, GP, GROUND_DEPTH, T, CELL_MARGIN, CAP_H

MODULE = 'ec_galapagos'
LAYERS = ['L0', 'L1']
BASES = {'L0': 330, 'L1': 400}
SKY = ['#5ae8ff', '#1a9ad8', '#0a4a8a']
PALETTE = {
    # L0 rocks (#16607a)
    'galap_rock': '#16607a', 'galap_rock_light': '#1e7290', 'galap_rock_dark': '#114e64', 'galap_rock_fill': '#124a60',
    'galap_star': '#d87a6a', 'galap_star2': '#e0a060',
    # L1 kelp (#0e6a5a)
    'galap_kelp': '#0e6a5a', 'galap_kelp_light': '#148070', 'galap_kelp_dark': '#0b564a', 'galap_kelp_fill': '#0c5a4c', 'galap_bubble': '#b8f4ff',
    # ground (coral)
    'galap_g_coral': '#ff8a6a', 'galap_g_coral2': '#ffb36a', 'galap_g_coral_hi': '#ffc8a0', 'galap_g_rock': '#3e4a5a', 'galap_g_rock_dark': '#2e3a48',
    'galap_g_rock_deep': '#18202a',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)

def sea_star(B, role, x, y, z, r, rot):
    pts = []
    for k in range(10):
        a = TAU * k / 10 + math.pi / 2
        rr = r if k % 2 == 0 else r * 0.45
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    B.slab(role, pts, 0.08, at=(x, y, z), rot=(0, rot, 0))

def build_L0(rng):
    """Lava rock: a periodic mound (amp ~2 m) with boulders along the crest, two rock arches, sea stars."""
    L = 'L0'
    zf = K.periodic_fn(rng, 0.4, 2.2, 3)
    K.ridge_slab(TH, L, 'L0_mound', zf, 'galap_rock', y=1.0, depth=2.5, zb=-2.5)
    K.fill_below(TH, L, 'galap_rock_fill', top=0.2, depth=2.5, y=3.0)
    B = Builder('L0_boulders', L, TH)
    roles = ['galap_rock_light', 'galap_rock', 'galap_rock_dark', 'galap_rock_light']
    for x in K.jittered(rng, 22, 0.4):
        w, h = rng.uniform(0.9, 2.2), rng.uniform(0.6, 1.3)
        z = zf(x) - h * 0.35
        for dx in K.wraps(x, w):
            B.rbox(rng.choice(roles), (x + dx, rng.uniform(-0.6, 0.8), z), (w, 0.9, h), bevel=0.3, segments=3, rot=(0, rng.uniform(-0.3, 0.3), 0))
    for x in K.jittered(rng, 8, 0.4):
        for dx in K.wraps(x, 0.6):
            B.sphere('galap_rock_light', (x + dx, -0.9, zf(x) - 0.3), rng.uniform(0.3, 0.5), scale=(1.3, 0.9, 0.8), subdiv=1)
    B.done(period=None)
    B = Builder('L0_arches', L, TH)
    for i, ax in enumerate(K.jittered(rng, 2, 0.15)):
        R, RZ, th = rng.uniform(2.0, 2.8), rng.uniform(1.8, 2.6), rng.uniform(0.6, 0.8)
        legs = rng.uniform(0.6, 1.2)
        B.band_arch('galap_rock_dark' if i else 'galap_rock', (ax, -1.2, zf(ax) - 0.8), R, RZ, th, 1.4, legs=legs, segs=7)
        B.rbox('galap_rock_light', (ax - R * 0.6, -1.4, zf(ax) + RZ + legs - 0.9), (1.1, 0.8, 0.7), bevel=0.25, segments=3)
        B.rbox('galap_rock_dark', (ax + R * 0.5, -1.4, zf(ax) + RZ + legs - 0.95), (0.9, 0.8, 0.6), bevel=0.25, segments=3)
    B.done()
    B = Builder('L0_stars', L, TH)
    for x in K.jittered(rng, 5, 0.4):
        for dx in K.wraps(x, 0.5):
            sea_star(B, rng.choice(['galap_star', 'galap_star2']), x + dx, -1.3, zf(x) + rng.uniform(-0.6, -0.2), rng.uniform(0.28, 0.4), rng.uniform(0, TAU))
    B.done(period=None)

def kelp(B, x, y, h, w, ph, rng):
    """One kelp stalk: a tapering wavy chain with alternating blades (flat ellipsoids) every other node."""
    n = 10
    pts = [(x + math.sin(ph + k * 0.7) * 0.36, y, -0.3 + (h + 0.3) * k / n) for k in range(n + 1)]
    B.chain('galap_kelp', pts, w / 2, segs=5, taper=0.5)
    for k in range(2, n, 1):
        sx = 1 if k % 2 == 0 else -1
        px, py, pz = pts[k]
        B.sphere('galap_kelp_light' if k % 4 == 0 else 'galap_kelp_dark', (px + sx * 0.3, py - 0.04, pz + 0.05), 0.33, scale=(1.0, 0.4, 0.42), subdiv=1, rot=(0, sx * 0.5, 0))
    B.sphere('galap_kelp_light', (pts[-1][0], y - 0.04, pts[-1][2] + 0.1), 0.3, scale=(0.5, 0.4, 1.0), subdiv=1)

def build_L1(rng):
    L = 'L1'
    K.fill_below(TH, L, 'galap_kelp_fill', top=0.2, depth=3.0, y=2.5)
    B = Builder('L1_kelp', L, TH)
    for x in K.jittered(rng, 24, 0.45):
        h = rng.uniform(4.0, 8.0)
        for dx in K.wraps(x, 0.9):
            kelp(B, x + dx, rng.uniform(-0.5, 2.0), h, rng.uniform(0.18, 0.34), rng.uniform(0, TAU), rng)
    B.done(period=None)
    B = Builder('L1_bubbles', L, TH)
    for x in K.jittered(rng, 5, 0.4):
        z = rng.uniform(1.0, 2.5)
        for k in range(4):
            r = 0.1 + k * 0.05
            bx = x + math.sin(k * 1.4) * 0.35
            for dx in K.wraps(bx, r):
                B.sphere('galap_bubble', (bx + dx, -1.0, z + k * rng.uniform(0.8, 1.2)), r, subdiv=1)
    B.done(period=None)

def build(seed=1):
    """Build every parallax layer (clears first; deterministic for a seed). Returns {layer: Collection}."""
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    build_L1(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    """Coral floor: a pink coral cap (a continuous band with round nubs and a pale rim) over dark lava-rock
    plates on a lighter rock mortar, tile-aligned (two rows of up to two plates per tile). Collection 'ground'."""
    L = TH.GROUND
    c = TH.new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    Builder('ground_backing', L, TH).box('galap_g_rock', (GP / 2, 0.5, -D / 2), (GP + 0.6, 1.0, D + 0.6), bevel=0.0).done(period=None)
    B = Builder('ground_plates', L, TH)
    for col in range(8):
        for row in range(3):
            for xc, zc, w, h in K.cell_rects(col, row, rng, rows=(1, 2), cols=(1, 2), gap=0.12, top=(CAP_H if row == 0 else 0.0), jitter=0.3):
                if w < 0.22 or h < 0.22:
                    continue
                role = 'galap_g_rock_deep' if rng.random() < 0.35 else 'galap_g_rock_dark'
                B.rbox(role, (xc, -0.1, zc), (w, 0.4, h), bevel=0.1, segments=2)
                if rng.random() < 0.5:                         # a coral polyp dot on the plate
                    B.sphere('galap_g_coral', (xc + rng.uniform(-w * 0.25, w * 0.25), -0.3, zc + rng.uniform(-h * 0.25, h * 0.25)), 0.06, subdiv=1)
    B.done(period=None)
    B = Builder('ground_cap', L, TH)
    B.box('galap_g_coral', (GP / 2, 0.1, -0.06 - CAP_H / 2), (GP + 0.6, 0.9, CAP_H), bevel=0.0)
    B.box('galap_g_coral_hi', (GP / 2, 0.08, -0.1), (GP + 0.6, 0.95, 0.06), bevel=0.0)
    for col in range(8):
        x0, x1 = K.tile_span(col, 0.12)
        for k in range(2):
            nx = rng.uniform(x0 + 0.1, x1 - 0.1)
            r = rng.uniform(0.09, 0.15)
            B.sphere('galap_g_coral' if rng.random() < 0.5 else 'galap_g_coral2', (nx, -0.05, -0.02 - r), r, subdiv=1)
            B.sphere('galap_g_coral_hi', (nx - r * 0.3, -0.05 - r * 0.5, -0.02 - r * 0.7), r * 0.3, subdiv=1)
        for k in range(2):
            lx = rng.uniform(x0 + 0.1, x1 - 0.1)
            B.sphere('galap_g_coral', (lx, 0.05, -0.06 - CAP_H), 0.14, scale=(1.3, 0.8, 0.7), subdiv=1)
    B.done(period=None)
    return c

def clear():
    TH.clear()

if __name__ == '__main__':
    K.preview(TH, build, build_ground)
