# Amsterdam 8-5 "The Weigh House" (theme nl_waag): the old weigh house's hall as one Fiesta Toon backdrop. Original art:
# a dark timber-framed hall: brick bays between oak posts with knee braces, a beam ceiling, cheese racks stacked with
# waxed wheels seen edge-on (flat, faceless, so they never read as the rolling cheese enemies), tall leaded windows
# with warm light, a great brass balance hanging in one bay, sacks and crates along the foot of the wall.
#
#   L0  nlHall (base 360, #5a4030)   a backdrop covering the whole strip: from the beams (z = +12.8 m) down below the
#                                     floor line (z = -3 m)
#   ground        wood: weigh-house boards (nl_canals.wood_ground)
import os, sys, math, random
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import nl_canals as NC
from nl_canals import Builder, P, OVER, PPM, TAU, jittered, wraps

MODULE = 'nl_waag'
LAYERS = ['L0']
BASES = {'L0': 360}
SKY = ['#3a2a1e', '#5a4030', '#7a5a40']
PALETTE = {
    'waag_wall': '#5a4030', 'waag_brick': '#6a4634', 'waag_brick_dark': '#4e3426', 'waag_post': '#3a2a1e', 'waag_post_light': '#4e3a28',
    'waag_beam': '#2e2218', 'waag_ceiling': '#3a2c20',
    'waag_rack': '#7a5a3a', 'waag_rack_dark': '#5a4028', 'waag_cheese': '#c89a40', 'waag_cheese_rind': '#a8322a', 'waag_cheese_side': '#c89838',
    'waag_window': '#e8c890', 'waag_window_glow': '#f0d4a0', 'waag_lead': '#3a2e24', 'waag_sill': '#8a6a4a',
    'waag_brass': '#c8a048', 'waag_brass_dark': '#9a7430', 'waag_chain': '#6a5a40',
    'waag_sack': '#c8b490', 'waag_sack_tie': '#8a6a4a', 'waag_crate': '#8a6a44', 'waag_crate_dark': '#6a4e30',
    # ground (wood)
    'waag_g_cap': '#a87a4a', 'waag_g_cap_hi': '#d8a870', 'waag_g_gap': '#3a2614', 'waag_g_plank_a': '#8a6a44',
    'waag_g_plank_b': '#7a5a38', 'waag_g_plank_c': '#946e46', 'waag_g_nail': '#2a2a30',
}
TH = NC.Theme(MODULE, LAYERS, BASES, PALETTE, SKY)
M = 1 / PPM
ZT, ZB = 360 * M + 0.6, -84 * M - 0.6       # the strip's top and bottom (z) with a margin
BAY = 100 * M                                # one bay between posts (100 px, like the painter)

def cheese_rack(B, x0, w, z0, levels, rng):
    """Shelves of waxed wheels seen edge-on: each wheel a flat rounded drum (cream-gold side, red wax edge)."""
    for r in range(levels):
        z = z0 + r * 1.25
        B.box('waag_rack', (x0 + w / 2, -0.25, z), (w, 0.7, 0.1), bevel=0.02)
        B.box('waag_rack_dark', (x0 + w / 2, -0.62, z - 0.08), (w, 0.04, 0.06), bevel=0.0)
        n = int(w / 0.62)
        for k in range(n):
            cx = x0 + (k + 0.5) * w / n
            stack = 1 + (rng.random() < 0.35)
            for s in range(stack):
                zc = z + 0.05 + 0.22 + s * 0.44
                B.rbox('waag_cheese_side', (cx, -0.35, zc), (0.56, 0.5, 0.36), bevel=0.12, segments=2)
        for sx in (x0 + 0.05, x0 + w - 0.05):
            B.box('waag_rack_dark', (sx, -0.25, z0 + (levels - 1) * 0.625), (0.08, 0.6, (levels - 1) * 1.25 + 0.3), bevel=0.0)

def window(B, x, z0, w, h):
    B.arch('waag_sill', (x, 0.05, z0 - 0.1), w + 0.3, h + 0.3, 0.1, segs=10)
    B.arch('waag_window_glow', (x, -0.02, z0), w, h, 0.06, segs=10)
    for k in range(1, 4):
        B.box('waag_lead', (x, -0.06, z0 + k * (h - w / 2) / 4), (w, 0.03, 0.04), bevel=0.0)
    B.box('waag_lead', (x, -0.06, z0 + (h - w / 2) / 2 + 0.2), (0.04, 0.03, h - w / 2 + 0.4), bevel=0.0)
    B.box('waag_sill', (x, -0.25, z0 - 0.08), (w + 0.4, 0.4, 0.12), bevel=0.02)

def balance(B, x, z_top):
    """The great brass balance hanging from the ceiling beam: chain, beam, two pans on chains."""
    B.rod('waag_chain', (x, -0.5, z_top), (x, -0.5, z_top - 1.2), 0.03, segs=4)
    B.box('waag_brass_dark', (x, -0.5, z_top - 1.25), (0.2, 0.2, 0.24), bevel=0.03)
    B.box('waag_brass', (x, -0.5, z_top - 1.4), (3.2, 0.14, 0.12), bevel=0.03)
    for sx in (-1, 1):
        px = x + sx * 1.5
        for k in (-1, 1):
            B.rod('waag_chain', (px, -0.5, z_top - 1.4), (px + k * 0.45, -0.5, z_top - 2.8), 0.02, segs=4)
        B.lathe('waag_brass', [(0.0, 0.0), (0.4, 0.04), (0.55, 0.2)], 12, at=(px, -0.5, z_top - 3.0), cap_top=False, cap_bottom=False)
        B.lathe('waag_brass_dark', [(0.0, 0.02), (0.5, 0.18)], 12, at=(px, -0.5, z_top - 2.99), cap_top=False)
    B.sphere('waag_brass', (x, -0.55, z_top - 1.4), 0.14, subdiv=1)

def build_L0(rng):
    L = 'L0'
    B = Builder('L0_wall', L, TH)
    B.box('waag_wall', (P / 2, 1.5, (ZT + ZB) / 2), (P + 2 * OVER, 1.0, ZT - ZB), bevel=0.0)
    # the ceiling: a dark band with beam ends at the top of the strip
    B.box('waag_ceiling', (P / 2, 1.0, ZT - 0.7), (P + 2 * OVER, 1.0, 1.4), bevel=0.0)
    B.box('waag_beam', (P / 2, 0.6, ZT - 1.5), (P + 2 * OVER, 1.0, 0.4), bevel=0.0)
    # a plinth course of darker brick along the floor
    B.box('waag_brick_dark', (P / 2, 1.0, ZB / 2 + 0.3), (P + 2 * OVER, 1.0, -ZB + 0.6), bevel=0.0)
    B.done(period=None)
    # brick coursing lines on the wall (sparse, so the backdrop stays calm)
    B = Builder('L0_courses', L, TH)
    z = 0.8
    while z < ZT - 2.2:
        B.box('waag_brick', (P / 2, 0.95, z), (P + 2 * OVER, 0.2, 0.06), bevel=0.0)
        z += 0.9
    B.done(period=None)
    nb = int(round(P / BAY))
    bay = P / nb
    B = Builder('L0_frame', L, TH)
    for k in range(nb):
        x = k * bay
        for dx in wraps(x, 0.3):
            B.box('waag_post', (x + dx, 0.5, (ZT - 1.5 + ZB) / 2), (0.36, 0.6, ZT - 1.5 - ZB), bevel=0.03)
            B.box('waag_post_light', (x + dx - 0.1, 0.18, (ZT - 1.5 + ZB) / 2), (0.06, 0.04, ZT - 1.5 - ZB), bevel=0.0)
            for sx in (-1, 1):   # knee braces up to the beam
                B.rod('waag_post', (x + dx, 0.4, ZT - 3.2), (x + dx + sx * 1.0, 0.4, ZT - 1.7), 0.09, segs=4)
    B.done(period=None)
    # each bay: a tall window, or cheese racks, or the balance; sacks and crates at the foot
    B = Builder('L0_bays', L, TH)
    kinds = ['rack', 'window', 'rack', 'balance', 'rack', 'window', 'rack', 'window', 'rack', 'rack']
    for k in range(nb):
        x0 = k * bay + 0.3
        w = bay - 0.6
        kind = kinds[k % len(kinds)]
        if kind == 'rack':
            cheese_rack(B, x0, w, 0.9, 5, rng)
        elif kind == 'window':
            window(B, x0 + w / 2, 3.2, w * 0.55, 5.2)
            cheese_rack(B, x0, w, 0.9, 1, rng)
        else:
            balance(B, x0 + w / 2, ZT - 1.7)
        for j in range(2):
            sx = x0 + 0.4 + j * (w - 0.8)
            if rng.random() < 0.5:
                B.rbox('waag_sack', (sx, -0.7, 0.4), (0.62, 0.5, 0.8), bevel=0.22, segments=2)
                B.box('waag_sack_tie', (sx, -0.95, 0.72), (0.3, 0.04, 0.06), bevel=0.0)
            else:
                B.box('waag_crate', (sx, -0.7, 0.35), (0.7, 0.6, 0.7), bevel=0.03)
                B.box('waag_crate_dark', (sx, -1.01, 0.35), (0.04 + 0.66, 0.02, 0.08), bevel=0.0)
    B.done(period=None)

def build(seed=1):
    clear()
    for name in LAYERS:
        TH.new_collection(name)
    rng = random.Random(seed)
    build_L0(random.Random(rng.random()))
    return {name: TH.COLL[name] for name in LAYERS}

def build_ground(seed=1):
    return NC.wood_ground(TH, random.Random(seed), {'cap': 'waag_g_cap', 'cap_hi': 'waag_g_cap_hi', 'gap': 'waag_g_gap', 'plank_a': 'waag_g_plank_a',
                                                    'plank_b': 'waag_g_plank_b', 'plank_c': 'waag_g_plank_c', 'nail': 'waag_g_nail'})

def clear():
    TH.clear()

if __name__ == '__main__':
    NC.preview(TH, build, build_ground)
