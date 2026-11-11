# Antarctica 13-3 "Aurora Station" (theme aq_station): original toon art for a research station at night.
#   L0  mountains (base 300, f 0.03, #1a2a40): dark night peaks, their snow a dim moonlit blue (calm, unlined far row)
#   L1  aqStation (base 345, f 0.12, #c8d0d8): the station on a far snow rise (2.3 m up, so it clears the floor): long modules on stilts in muted red and
#       grey with warm lit windows, dome huts, fuel tanks, a lattice radio mast with a red beacon, a wind turbine;
#       values kept low so the bright red foreground modules and Brady stay on top
#   ground snow at night: a pale-blue snow cap over slate-blue packed-ice blocks
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU
import aq_kit as AK

MODULE = 'aq_station'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 345}
SKY = ['#040a1a', '#0a1a34', '#1a2a48']
PX = 28.1
RISE = 2.3
PALETTE = {
    'base_far': '#16243a', 'rock_far': '#1c2c44', 'snow_far': '#3a4e6e', 'rock': '#1a2a40', 'rock2': '#18263a', 'snow': '#4a6082',
    'field': '#2a3a54', 'field_sh': '#243450', 'mod': '#7a3a3a', 'mod2': '#5a6476', 'roof': '#8a94a6', 'leg': '#3a4252',
    'dome': '#6a7486', 'dome2': '#58627a', 'tank': '#7a8494', 'mast': '#4a5264', 'door': '#1e2430',
    'win_glow': '#ffd890', 'beacon_glow': '#ff5a4a', 'lamp_glow': '#fff0c8', 'snowroof': '#9aaac4',
    'g_cap': '#c4d4ea', 'g_cap_hi': '#dce8f6', 'g_lip': '#c8d8ee', 'g_icicle': '#9ab8dc', 'g_dirt': '#3a5478',
    'g_rock': '#5a7aa2', 'g_rock2': '#52709a', 'g_rock3': '#6284aa',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    AK.far_peaks('L0', rng, near_outline=0.0)


def module(B, G, x, z, w, h, rng):
    for dx in wraps(x, w / 2 + 0.3):
        cx = x + dx
        for lx in (-w / 2 + 0.3, w / 2 - 0.3):
            B.box('leg', (cx + lx, 0.6, z + 0.25), (0.12, 0.12, 0.5), bevel=0.0)
        B.box('mod', (cx, 0.5, z + 0.5 + h / 2), (w, 0.9, h), bevel=0.12)
        B.box('roof', (cx, 0.45, z + 0.5 + h + 0.06), (w + 0.1, 0.92, 0.14), bevel=0.04)
        B.box('snowroof', (cx, 0.42, z + 0.5 + h + 0.16), (w - 0.2, 0.9, 0.08), bevel=0.04)
        n = int(w / 0.75)
        for k in range(n):
            if rng.random() < 0.75:
                G.box('win_glow', (cx - w / 2 + 0.45 + k * (w - 0.9) / max(1, n - 1), 0.02, z + 0.5 + h * 0.58), (0.32, 0.04, 0.26), bevel=0.0)
        B.box('door', (cx + w / 2 - 0.4, 0.02, z + 0.5 + h * 0.36), (0.3, 0.04, h * 0.62), bevel=0.0)


def build_L1(rng):
    L = 'L1'
    # the station stands on a broad snow rise (RISE m up) so it clears the floor at the level's camera height
    plain(L, 'L1_field', 'field_sh', y=3.0, depth=2.0, top=0.0, bottom=-4.0)['outline'] = 0
    zf = AK.periodic_profile(rng, RISE + 0.05, 0.12, waves=((2, 1.0), (5, 0.4)))
    AK.ridge_slab(L, 'L1_rise', 'field', zf, y=2.4, depth=0.5, bottom=-4.0, outline=0.5)
    B = Builder('L1_station', L)
    G = Builder('L1_glow', L)
    x = 1.5
    k = 0
    while x < P - 2.0:
        kind = ('module', 'dome', 'module', 'tanks', 'mast', 'module', 'dome', 'turbine')[k % 8]
        if kind == 'module':
            w, h = rng.uniform(3.2, 5.0), rng.uniform(1.0, 1.4)
            module(B, G, x + w / 2, 0.0, w, h, rng)
            x += w + rng.uniform(1.0, 2.2)
        elif kind == 'dome':
            r = rng.uniform(0.9, 1.3)
            for dx in wraps(x + r, r):
                B.lathe('dome', [(r, 0.0), (r * 0.92, r * 0.42), (r * 0.7, r * 0.75), (r * 0.38, r * 0.95), (0.0, r)], 16, at=(x + r + dx, 1.0, 0.0), yscale=0.5, smooth=True)
                B.box('door', (x + r + dx + r * 0.3, 0.45, 0.32), (0.3, 0.04, 0.6), bevel=0.0)
                G.box('win_glow', (x + r + dx - r * 0.35, 0.42, r * 0.55), (0.26, 0.04, 0.2), bevel=0.0)
            x += 2 * r + rng.uniform(1.0, 2.0)
        elif kind == 'tanks':
            for j in range(2):
                for dx in wraps(x + 0.5 + j * 1.0, 0.6):
                    B.lathe('tank', [(0.45, 0.0), (0.45, 1.0), (0.3, 1.2), (0.0, 1.25)], 14, at=(x + 0.5 + j * 1.0 + dx, 1.2, 0.0), yscale=0.6, smooth=True)
            x += 2.6
        elif kind == 'mast':
            hgt = rng.uniform(5.0, 6.2)
            for dx in wraps(x, 0.5):
                cx = x + dx
                for sx in (-0.3, 0.3):
                    B.rod('mast', (cx + sx, 1.3, 0.0), (cx + sx * 0.25, 1.3, hgt), 0.04, segs=4)
                for j in range(int(hgt / 0.6)):
                    z0 = j * 0.6
                    a = 0.3 - 0.22 * z0 / hgt
                    B.rod('mast', (cx - a, 1.3, z0), (cx + a * 0.95, 1.3, z0 + 0.6), 0.02, segs=3)
                G.sphere('beacon_glow', (cx, 1.2, hgt + 0.12), 0.14, subdiv=2)
            x += rng.uniform(1.6, 2.4)
        else:
            hgt = rng.uniform(3.4, 4.2)
            for dx in wraps(x, 1.2):
                cx = x + dx
                B.rod('mast', (cx, 1.4, 0.0), (cx, 1.4, hgt), 0.07, segs=6, r2=0.04)
                B.sphere('roof', (cx + 0.08, 1.3, hgt), 0.14, scale=(1.4, 0.8, 0.8), subdiv=2)
                for j in range(3):
                    a = TAU * j / 3 + 0.4
                    B.slab('roof', [(0.0, -0.05), (1.1, -0.04), (1.15, 0.04), (0.0, 0.05)], 0.04, at=(cx + 0.24, 1.2, hgt), rot=(0, a, 0))
            x += rng.uniform(1.8, 2.6)
        k += 1
    ob = B.done(period=None)
    ob['outline'] = 0.7
    og = G.done(period=None)
    og['outline'] = 0
    for o in (ob, og):
        o.location.z += RISE

BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return AK.snow_ground(seed)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
