# Valencia 6-2 "The Aquarium" (theme es_aquarium): the parallax background as a Fiesta Toon diorama, one
# Collection per parallax layer, for the pre-rendered 2D sprite pipeline. Original art: the view from inside a glass
# aquarium tunnel: steel ribs arching overhead, rocks and kelp beyond the glass, bubbles rising to the light.
#
#   L0  rocks (base 330, #1a5a8a)  the tunnel's pale steel rib arches with glass seams and glints, over a rolling
#                                  blue rock mound with rounded boulders, a sunken amphora, a chest and sea stars
#   L1  kelp  (base 360, #0e6a6a)  tall wavy kelp with alternating blades, pump pipes blowing bubble columns, a
#                                  school of small fish
#   ground                         coral: a coral cap (nubs and a pale rim) over dark rock plates
#
# Contract, conventions and the shared toolkit: see es_tomatina.py.
# Run headless:   [LOOK=toon] /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/es_aquarium.py [--seed N]
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import es_tomatina as K
from es_tomatina import Builder, P, TAU, GP, GROUND_DEPTH, T, CELL_MARGIN, CAP_H

MODULE = 'es_aquarium'
LAYERS = ['L0', 'L1']
BASES = {'L0': 330, 'L1': 360}
SKY = ['#6ae8ff', '#1a8ad8', '#0a3a7a']
PALETTE = {
    # L0 rocks (#1a5a8a) and the tunnel
    'rock': '#1a5a8a', 'rock_light': '#2470a0', 'rock_dark': '#154a74', 'rock_fill': '#164e7a', 'rock_deep': '#124068',
    'rib': '#c0d4e4', 'rib_dark': '#8aa6ba', 'glass': '#5a9ad0', 'glint': '#e8f8ff', 'lamp_glow': '#e0f8ff',
    'star': '#e88a6a', 'star2': '#f0b060', 'amphora': '#a07050', 'chest': '#8a5a34', 'chest_band': '#d8b040', 'gold_glow': '#ffe070',
    # L1 kelp (#0e6a6a)
    'kelp': '#0e6a6a', 'kelp_light': '#168478', 'kelp_dark': '#0a5450', 'kelp_fill': '#0c5c5a', 'bubble': '#c8f4ff',
    'pipe': '#3a7a84', 'pipe_dark': '#2a5a64', 'fish': '#2aa0a8', 'fish_light': '#5ac8c8', 'eye_white': '#f8ffff', 'pupil': '#102030',
    # ground (coral)
    'g_coral': '#ff9a7a', 'g_coral2': '#ffbe8a', 'g_coral_hi': '#ffd0b0', 'g_rock': '#3a5a7a', 'g_rock_dark': '#2a4460', 'g_rock_deep': '#1a3048',
}
TH = K.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)

def sea_star(B, role, x, y, z, r, rot):
    pts = []
    for k in range(10):
        a = TAU * k / 10 + math.pi / 2
        rr = r if k % 2 == 0 else r * 0.45
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    B.slab(role, pts, 0.08, at=(x, y, z), rot=(0, rot, 0))

def tunnel_rib(B, x, z, R, RZ, rng):
    """One rib of the glass tunnel: a pale steel band arch with a darker inner edge and bolt heads."""
    B.band_arch('rib', (x, -0.6, z), R, RZ, 0.2, 0.7, legs=0.9, segs=10)
    B.band_arch('rib_dark', (x, -0.62, z), R - 0.2, RZ - 0.2, 0.06, 0.74, legs=0.9, segs=10)
    for k in range(7):
        a = math.pi * (k + 0.5) / 7
        B.sphere('rib_dark', (x + R * math.cos(a), -0.98, z + 0.9 + RZ * math.sin(a)), 0.07, subdiv=0)

def build_L0(rng):
    """Beyond the glass: a periodic rock mound (amp ~1.8 m) with boulders along the crest; in front of it the
    tunnel ribs every quarter period, joined by glass seam lines with a few glints, lamps hanging at the crown."""
    L = 'L0'
    zf = K.periodic_fn(rng, 0.7, 2.2, 3)
    K.ridge_slab(TH, L, 'L0_mound', zf, 'rock', y=2.0, depth=2.5, zb=-2.5)
    K.fill_below(TH, L, 'rock_fill', top=0.2, depth=3.0, y=3.5)
    B = Builder('L0_boulders', L, TH)
    roles = ['rock_light', 'rock', 'rock_dark', 'rock_light']
    for x in K.jittered(rng, 20, 0.4):
        w, h = rng.uniform(1.0, 2.4), rng.uniform(0.6, 1.4)
        z = zf(x) - h * 0.35
        for dx in K.wraps(x, w):
            B.rbox(rng.choice(roles), (x + dx, rng.uniform(0.2, 1.6), z), (w, 0.9, h), bevel=0.3, segments=3, rot=(0, rng.uniform(-0.3, 0.3), 0))
    for x in K.jittered(rng, 9, 0.4):
        for dx in K.wraps(x, 0.6):
            B.sphere('rock_light', (x + dx, 0.0, zf(x) - 0.3), rng.uniform(0.3, 0.55), scale=(1.3, 0.9, 0.8), subdiv=1)
    B.done(period=None)
    # sunken things on the mound: an amphora, a half-buried chest with a gold glint, sea stars
    B = Builder('L0_treasure', L, TH)
    ax = rng.uniform(3.0, 8.0)
    B.lathe('amphora', [(0.18, 0.0), (0.42, 0.5), (0.4, 1.0), (0.22, 1.3), (0.26, 1.42)], 8, at=(ax, -0.2, zf(ax) - 0.4), rot=(0, 0.45, 0), cap_top=True, cap_bottom=True)
    for s in (-1, 1):
        B.rod('amphora', (ax + s * 0.3, -0.2, zf(ax) + 0.55), (ax + s * 0.42, -0.2, zf(ax) + 0.9), 0.05, segs=5)
    cx = rng.uniform(20.0, 30.0)
    B.box('chest', (cx, -0.3, zf(cx) - 0.15), (1.3, 0.8, 0.6), bevel=0.04)
    B.box('chest', (cx - 0.15, -0.3, zf(cx) + 0.3), (1.32, 0.82, 0.34), bevel=0.06, rot=(0, 0, 0))
    B.box('chest_band', (cx + 0.1, -0.72, zf(cx) - 0.1), (0.1, 0.04, 0.62), bevel=0.0)
    B.box('chest_band', (cx - 0.5, -0.72, zf(cx) - 0.1), (0.1, 0.04, 0.62), bevel=0.0)
    for k in range(4):
        B.sphere('gold_glow', (cx - 0.4 + k * 0.27, -0.55, zf(cx) + 0.12), 0.1, subdiv=0)
    for x in K.jittered(rng, 5, 0.4):
        for dx in K.wraps(x, 0.5):
            sea_star(B, rng.choice(['star', 'star2']), x + dx, -0.5, zf(x) + rng.uniform(-0.6, -0.1), rng.uniform(0.28, 0.4), rng.uniform(0, TAU))
    B.done(period=None)
    # the tunnel: four ribs per period, glass seams between them, lamps at the crown
    R, RZ = 4.3, 4.4
    B = Builder('L0_ribs', L, TH)
    for k in range(4):
        x = (k + 0.5) * P / 4
        tunnel_rib(B, x, -0.3, R, RZ, rng)
    B.done()
    B = Builder('L0_glints', L, TH)
    for x in K.jittered(rng, 7, 0.5):
        z = rng.uniform(4.0, 5.4)
        for dx in K.wraps(x, 0.5):
            B.box('glint', (x + dx, -1.0, z), (rng.uniform(0.4, 0.8), 0.03, 0.05), bevel=0.0, rot=(0, 0.6, 0))
    B.done(period=None)

def kelp(B, x, y, h, w, ph, rng):
    """One kelp stalk: a tapering wavy chain with alternating blades (flat ellipsoids) every node."""
    n = 10
    pts = [(x + math.sin(ph + k * 0.7) * 0.36, y, -0.3 + (h + 0.3) * k / n) for k in range(n + 1)]
    B.chain('kelp', pts, w / 2, segs=5, taper=0.5)
    for k in range(2, n, 1):
        sx = 1 if k % 2 == 0 else -1
        px, py, pz = pts[k]
        B.sphere('kelp_light' if k % 4 == 0 else 'kelp_dark', (px + sx * 0.3, py - 0.04, pz + 0.05), 0.33, scale=(1.0, 0.4, 0.42), subdiv=1, rot=(0, sx * 0.5, 0))
    B.sphere('kelp_light', (pts[-1][0], y - 0.04, pts[-1][2] + 0.1), 0.3, scale=(0.5, 0.4, 1.0), subdiv=1)

def fish(B, x, y, z, s, facing, rng):
    """A small round fish facing ±X: a body, a tail fin, a big eye."""
    f = facing
    B.sphere('fish', (x, y, z), s, scale=(1.3, 0.6, 0.8), subdiv=1)
    B.slab('fish_light', [(0.0, 0.0), (-0.7 * s, 0.55 * s), (-0.75 * s, -0.5 * s)], 0.08, at=(x - f * 1.2 * s, y, z), rot=None if f == 1 else (0, math.pi, 0))
    B.sphere('eye_white', (x + f * 0.7 * s, y - 0.45 * s, z + 0.15 * s), 0.3 * s, subdiv=1)
    B.sphere('pupil', (x + f * 0.85 * s, y - 0.6 * s, z + 0.15 * s), 0.15 * s, subdiv=0)

def build_L1(rng):
    L = 'L1'
    K.fill_below(TH, L, 'kelp_fill', top=0.2, depth=3.0, y=2.5)
    B = Builder('L1_kelp', L, TH)
    for x in K.jittered(rng, 12, 0.45):         # sparse enough that the tunnel and the rocks read behind it
        h = rng.uniform(2.6, 5.2)
        for dx in K.wraps(x, 0.9):
            kelp(B, x + dx, rng.uniform(-0.5, 2.0), h, rng.uniform(0.2, 0.36), rng.uniform(0, TAU), rng)
    B.done(period=None)
    # pump pipes: a bent pipe with a flared nozzle, blowing a column of bubbles
    B = Builder('L1_pumps', L, TH)
    for x in K.jittered(rng, 3, 0.3):
        for dx in K.wraps(x, 1.0):
            px = x + dx
            B.rod('pipe', (px, -0.8, -0.5), (px, -0.8, 0.8), 0.14, segs=7)
            B.lathe('pipe_dark', [(0.16, 0.0), (0.24, 0.3)], 8, at=(px, -0.8, 0.8), cap_top=True, cap_bottom=True)
            B.box('pipe_dark', (px, -0.8, 0.2), (0.4, 0.4, 0.12), bevel=0.02)
            for k in range(5):
                r = 0.08 + k * 0.045
                B.sphere('bubble', (px + math.sin(k * 1.7) * 0.3, -0.9, 1.4 + k * 0.75), r, subdiv=1)
    B.done(period=None)
    B = Builder('L1_fish', L, TH)
    sx = rng.uniform(4.0, 10.0)
    for k, (dx, dz, s) in enumerate(((0, 0, 0.32), (0.9, 0.5, 0.28), (1.8, 0.1, 0.3), (0.8, -0.6, 0.26), (2.6, 0.7, 0.24), (2.7, -0.3, 0.27))):
        fish(B, sx + dx, -1.2, 3.2 + dz, s, 1, rng)
    sx2 = sx + rng.uniform(14.0, 20.0)
    for dx, dz, s in ((0, 0, 0.3), (-1.0, 0.6, 0.26), (-1.1, -0.5, 0.28), (-2.1, 0.1, 0.24)):
        fish(B, sx2 + dx, -1.2, 4.3 + dz, s, -1, rng)
    B.done()
    B = Builder('L1_bubbles', L, TH)
    for x in K.jittered(rng, 5, 0.4):
        z = rng.uniform(1.0, 2.5)
        for k in range(4):
            r = 0.09 + k * 0.05
            bx = x + math.sin(k * 1.4) * 0.35
            for dx in K.wraps(bx, r):
                B.sphere('bubble', (bx + dx, -1.0, z + k * rng.uniform(0.8, 1.2)), r, subdiv=1)
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
    """Coral floor in the theme's colours: a salmon coral cap over dark blue rock plates."""
    return K.coral_ground(TH, random.Random(seed), {'coral': 'g_coral', 'coral2': 'g_coral2', 'coral_hi': 'g_coral_hi',
                                                   'rock': 'g_rock', 'rock_dark': 'g_rock_dark', 'rock_deep': 'g_rock_deep'})

def clear():
    TH.clear()

if __name__ == '__main__':
    K.preview(TH, build, build_ground)
