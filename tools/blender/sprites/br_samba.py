# Brazil 3-2 "Sambadrome Night": the parallax background as a low-poly Fiesta Toon diorama, one Collection per
# parallax layer, for the pre-rendered 2D sprite pipeline. Original art: a night skyline strung with carnival
# lights behind the tiered grandstands of a samba parade avenue.
#
#   L0  brSkyline  a wall-to-wall row of night buildings (2-6.4 m) with lit windows (warm / cool glow), water tanks
#                  and aerials on the roofs, a string of carnival bulbs bobbing across the sky at 6.8 m
#   L1  brStands   eight stepped tiers of grandstand full of a carnival crowd (pill bodies in the six carnival
#                  colours, round heads, arms and little flags up), bunting along the top, floodlight masts,
#                  a dark wall filling below the ground line
#   ground         the parade avenue (ground style brWalk, night colours): dark cap with white lane dashes over
#                  dark paving stones
#
# The grandstand builder is shared with br_barracao (mode 'props' swaps the crowd for racks of float parts).
# Shares the kit (Builder, tiling, floor cells, materials, previews) of br_beach. Same contract as br_beach.
#
# Run headless:   /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/sprites/br_samba.py
import os, sys, math, random
import bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import br_beach as K
from br_beach import Builder, wraps, cell_rects, new_collection, leaf_pts, P, GP, GROUND_DEPTH, GROUND_COLL, T, PX, TAU

MODULE = 'br_samba'
LAYERS = ['L0', 'L1']                      # back to front: brSkyline, brStands
BASES = {'L0': 360, 'L1': 350}
SKY = ['#140a2e', '#3a1a5a', '#8a2a6a']

def shade(hexcol, f):
    """The engine's shade(): mix toward white (f > 0) or black (f < 0)."""
    h = hexcol.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    t = (255, 255, 255) if f > 0 else (0, 0, 0); f = abs(f)
    return '#%02x%02x%02x' % tuple(int(round(c + (tc - c) * f)) for c, tc in zip((r, g, b), t))

PALETTE = {
    'samba_bldg_a': '#2a1a40', 'samba_bldg_b': '#32204a', 'samba_bldg_c': '#402c5c', 'samba_roof': '#221434',
    'samba_win_warm_glow': '#ffd890', 'samba_win_cool_glow': '#8ad8ff', 'samba_wire': '#3a2a4a',
    'samba_skin_a': '#f0c8a0', 'samba_skin_b': '#c08a5a', 'samba_skin_c': '#6a4030',
    'samba_wall': '#2e1a40', 'samba_rail': '#8a7aa8', 'samba_mast': '#4a3a5a', 'samba_lamp_glow': '#fff4d0', 'samba_tread': '#5a3a74',
    'samba_cap': '#4a4a58', 'samba_dash': '#ffffff', 'samba_mortar': '#4a4a56', 'samba_pave_a': '#3e3e4c', 'samba_pave_b': '#34343f', 'samba_pave_c': '#55556a',
}
for r in range(8):
    PALETTE[f'samba_tier{r}'] = shade('#3a2050', r * 0.03)
K.register(PALETTE)
CARN = K.carn_roles('samba')
CARN_GLOW = K.carn_roles('samba', glow=True)

# ----------------------------------------------------------------------------------------------- L0 skyline
def build_L0(rng):
    L = 'L0'
    B = Builder('skyline', L)
    W = Builder('skyline_windows', L)
    x, i = 0.0, 0
    roles = ['samba_bldg_a', 'samba_bldg_b', 'samba_bldg_c']
    DOWN = 16.4
    while x < P - 0.5:
        w = rng.uniform(40, 90) * PX; h = rng.uniform(90, 240) * PX if rng.random() < 0.8 else rng.uniform(240, 300) * PX
        w = min(w, P - x)
        bw = w - 4 * PX
        role = roles[i % 3] if rng.random() < 0.6 else rng.choice(roles)
        B.box(role, (x + bw / 2, 3.0, (h - DOWN) / 2), (bw, 1.2, h + DOWN), bevel=0.0)
        B.box('samba_roof', (x + bw / 2, 2.95, h + 0.05), (bw + 0.06, 1.3, 0.1), bevel=0.0)
        # windows: a 9 x 12 px grid, 40% lit, warm or cool
        wz = h - 8 * PX
        while wz > 0.45:
            wx = x + 5 * PX
            while wx < x + w - 10 * PX:
                if rng.random() < 0.4:
                    W.box('samba_win_warm_glow' if rng.random() < 0.5 else 'samba_win_cool_glow', (wx + 2.5 * PX, 2.38, wz - 3 * PX), (5 * PX, 0.04, 6 * PX), bevel=0.0)
                wx += 10 * PX
            wz -= 13 * PX
        # roof furniture: a water tank, an aerial or a little penthouse box
        k = rng.random()
        if k < 0.3 and bw > 1.2:
            B.lathe(role, [(0.26, 0.0), (0.26, 0.5), (0.0, 0.62)], 8, at=(x + bw * rng.uniform(0.3, 0.7), 3.0, h + 0.1), cap_bottom=True)
            B.box('samba_roof', (x + bw * 0.5, 3.0, h + 0.1), (0.1, 0.1, 0.2), bevel=0.0)
        elif k < 0.55:
            ax = x + bw * rng.uniform(0.25, 0.75)
            ah = rng.uniform(0.7, 1.1)
            B.rod('samba_wire', (ax, 3.0, h), (ax, 3.0, h + ah), 0.035, segs=4)
            for j, (cw, cz) in enumerate(((0.55, 0.55), (0.42, 0.75), (0.3, 0.92))):     # a TV aerial: three rungs
                B.box('samba_wire', (ax, 3.0, h + ah * cz), (cw, 0.03, 0.03), bevel=0.0)
        elif k < 0.8 and bw > 1.6:
            B.box(rng.choice(roles), (x + bw * rng.uniform(0.3, 0.7), 3.0, h + 0.22), (bw * 0.35, 1.0, 0.44), bevel=0.0)
        x += w; i += 1
    B.done(period=None)
    W.done(period=None)
    # the string of carnival bulbs across the sky: 60 bulbs on a bobbing wire at 190 px above the ground line
    B = Builder('skyline_lights', L)
    n = 60
    pts = [Vector((k * P / n, 1.5, (190 + 12 * math.sin(TAU * 5 * k / n)) * PX)) for k in range(n + 1)]
    for k in range(n):
        B.rod('samba_wire', pts[k], pts[k + 1], 0.03, segs=4)
        B.sphere(CARN_GLOW[k % 6], pts[k], 0.13, subdiv=1)
    B.done(period=None)

# ----------------------------------------------------------------------------------------------- stands (shared)
TIER_H = 15 * PX                           # 0.534 m per tier, 8 tiers from 120 px above the ground line
TIERS = 8

def stands(L, pfx, rng, mode='crowd', carn=None):
    """Eight stepped tiers (painter: 15-px bands from base-120 to base, each a shade lighter), the top tier farthest
    back, a tread highlight on each; `mode` 'crowd' fills them with a carnival crowd, 'props' with racks of float
    parts (br_barracao). A dark wall fills from z = 0 down."""
    carn = carn or CARN
    B = Builder('stands', L)
    for r in range(TIERS):
        zt = (120 - 15 * r) * PX
        y = 3.2 - 0.38 * r
        B.box(f'{pfx}_tier{r}', (P / 2, y, zt - TIER_H / 2), (P, 0.76, TIER_H), bevel=0.0)
        B.box(f'{pfx}_tread', (P / 2, y - 0.01, zt - 0.03), (P, 0.78, 0.06), bevel=0.0)
    B.box(f'{pfx}_wall', (P / 2, 0.3, -8.2), (P, 1.0, 16.4), bevel=0.0)
    B.done(period=None)
    B = Builder('stands_fill', L)
    for r in range(TIERS):
        zt = (120 - 15 * r) * PX
        y = 3.2 - 0.38 * r - 0.35
        x = rng.uniform(0.2, 1.0)
        while x < P:
            if mode == 'crowd':
                person(B, x, y, zt, pfx, rng, carn)
                x += rng.uniform(0.9, 2.2)
            else:
                prop(B, x, y, zt, pfx, rng, carn)
                x += rng.uniform(1.5, 2.8)
    B.done()
    if mode == 'crowd':
        # bunting along the top tier and three floodlight masts behind the stands
        B = Builder('stands_bunting', L)
        n = 44
        zt = 120 * PX
        pts = [Vector((k * P / n, 2.95, zt + 0.9 + 0.12 * math.sin(TAU * 8 * k / n))) for k in range(n + 1)]
        for k in range(n):
            B.rod(f'{pfx}_rail', pts[k], pts[k + 1], 0.025, segs=4)
            m = (pts[k] + pts[k + 1]) / 2
            B.slab(carn[k % 6], [(-0.16, 0.0), (0.16, 0.0), (0.0, -0.34)], 0.04, at=(m.x, m.y - 0.02, m.z - 0.01))
        for x in (P * 0.12, P * 0.5, P * 0.86):
            B.rod(f'{pfx}_mast', (x, 4.4, 0.0), (x, 4.4, 6.9), 0.09, segs=6)
            B.box(f'{pfx}_mast', (x, 4.4, 6.95), (1.3, 0.2, 0.42), bevel=0.03)
            for k in range(4):
                B.box(f'{pfx}_lamp_glow', (x - 0.48 + k * 0.32, 4.28, 6.95), (0.22, 0.04, 0.26), bevel=0.0)
        B.done()

def person(B, x, y, zt, pfx, rng, carn):
    """A spectator: a carnival-colour pill body, a round head, 30% with arms up, 15% waving a little flag."""
    body = rng.choice(carn)
    skin = rng.choice([f'{pfx}_skin_a', f'{pfx}_skin_b', f'{pfx}_skin_c'])
    hb = rng.uniform(0.36, 0.46)
    B.rbox(body, (x, y, zt + hb / 2), (0.28, 0.22, hb), bevel=0.09, segments=1)
    B.sphere(skin, (x, y, zt + hb + 0.13), 0.13, subdiv=1)
    k = rng.random()
    if k < 0.3:
        for sx in (-0.2, 0.2):
            B.rod(skin, (x + sx * 0.7, y, zt + hb * 0.8), (x + sx, y, zt + hb + 0.36), 0.035, segs=4)
    elif k < 0.45:
        sx = rng.choice((-0.2, 0.2))
        B.rod(f'{pfx}_rail', (x + sx * 0.7, y, zt + hb * 0.8), (x + sx, y, zt + hb + 0.5), 0.025, segs=4)
        B.slab(rng.choice(carn), [(0.0, 0.0), (0.3, -0.08), (0.0, -0.2)], 0.03, at=(x + sx, y - 0.02, zt + hb + 0.5))

def prop(B, x, y, zt, pfx, rng, carn):
    """A float part on a warehouse rack: a drum, a roll of fabric, a feather fan, a sun ornament, a crate or a mask."""
    k = rng.random()
    c = rng.choice(carn)
    if k < 0.2:                            # drum: a coloured cylinder with a cream skin
        r, h = rng.uniform(0.2, 0.3), rng.uniform(0.28, 0.42)
        B.lathe(c, [(r, 0.0), (r, h)], 8, at=(x, y, zt), cap_bottom=True)
        B.lathe(f'{pfx}_skin', [(r + 0.02, h - 0.04), (r + 0.02, h + 0.03)], 8, at=(x, y, zt), cap_bottom=True)
    elif k < 0.36:                         # a roll of fabric lying on the shelf
        r = rng.uniform(0.14, 0.2)
        B.rod(c, (x - 0.45, y, zt + r), (x + 0.45, y, zt + r), r, segs=8)
        B.rod(f'{pfx}_skin', (x - 0.47, y, zt + r), (x + 0.47, y, zt + r), r * 0.4, segs=6)
    elif k < 0.5:                          # a feather fan: seven feathers radiating from a hub
        for j in range(7):
            a = math.pi * (0.1 + 0.8 * j / 6)
            B.slab(carn[(j + rng.randrange(6)) % 6] if j % 2 else c, leaf_pts(rng.uniform(0.7, 0.95), 0.2, 0.05, teeth=4, tooth=0.03), 0.04, at=(x, y - 0.012 * j, zt + 0.1), rot=(0, -a, 0))
        B.sphere(f'{pfx}_skin', (x, y - 0.1, zt + 0.1), 0.1, subdiv=1)
    elif k < 0.7:                          # a sun ornament: a ball ringed with spikes
        r = rng.uniform(0.28, 0.38)
        B.sphere(c, (x, y, zt + r + 0.05), r, subdiv=1)
        c2 = rng.choice(carn)
        for j in range(8):
            a = TAU * j / 8
            p0 = Vector((x + r * 0.9 * math.cos(a), y, zt + r + 0.05 + r * 0.9 * math.sin(a)))
            p1 = Vector((x + (r + 0.3) * math.cos(a), y, zt + r + 0.05 + (r + 0.3) * math.sin(a)))
            B.rod(c2, p0, p1, 0.07, segs=4, r2=0.01)
    elif k < 0.87:                         # crates
        s = rng.uniform(0.35, 0.5)
        B.box(f'{pfx}_crate', (x, y, zt + s / 2), (s, s, s), bevel=0.02)
        if rng.random() < 0.5:
            B.box(f'{pfx}_crate', (x + 0.1, y, zt + s + s * 0.35), (s * 0.7, s * 0.7, s * 0.7), bevel=0.02)
    else:                                  # a mask on a stand with three feathers
        B.rod(f'{pfx}_post', (x, y, zt), (x, y, zt + 0.25), 0.03, segs=4)
        B.disc(c, (x, y - 0.05, zt + 0.45), 0.2, 0.06, segs=10, scale_z=1.25)
        for j, a in enumerate((1.2, 1.57, 1.95)):
            B.slab(rng.choice(carn), leaf_pts(0.45, 0.14, 0.03, teeth=3, tooth=0.02), 0.03, at=(x, y - 0.07 - 0.01 * j, zt + 0.66), rot=(0, -a, 0))

def build_L1(rng):
    stands('L1', 'samba', rng, mode='crowd')

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

# ----------------------------------------------------------------------------------------------- ground
def dash_cap(B, cap, dash, cap_h=8 * PX):
    """The avenue cap (night brWalk): a dark band with two white lane dashes per 32-px tile."""
    B.box(cap, (GP / 2, 0.25, -cap_h / 2), (GP, 0.9, cap_h), bevel=0.0)
    for col in range(8):
        for k in range(2):
            x0 = col * T + (4 + 16 * k) * PX
            B.box(dash, (x0 + 4 * PX, -0.2, -4 * PX), (8 * PX, 0.1, 2 * PX), bevel=0.0)

def build_ground(seed=1):
    """The parade avenue: a dark cap with white lane dashes along the walking surface (z = 0) over dark paving stones,
    3 tiles deep, tile-aligned (see cell_rects). Periodic in x with period GP (not P), collection 'ground'."""
    L = GROUND_COLL
    c = new_collection(L)
    rng = random.Random(seed)
    D = GROUND_DEPTH
    B = Builder('ground_backing', L)
    B.box('samba_mortar', (GP / 2, 0.5, -D / 2), (GP, 1.0, D), bevel=0.0)
    B.done(period=None)
    B = Builder('ground_cap', L)
    dash_cap(B, 'samba_cap', 'samba_dash')
    B.done(period=None)
    B = Builder('ground_paving', L)
    K.paving(B, ['samba_pave_a', 'samba_pave_a', 'samba_pave_b', 'samba_pave_c'], rng, top=9.5 * PX)
    B.done(period=None)
    return c

if __name__ == '__main__':
    seed = 1
    for i, a in enumerate(sys.argv):
        if a == '--seed' and i + 1 < len(sys.argv):
            seed = int(sys.argv[i + 1])
    K.preview(sys.modules[__name__], seed)
