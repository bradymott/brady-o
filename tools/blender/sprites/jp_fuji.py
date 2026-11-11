# Japan (level overhaul, docs/design/LEVEL_OVERHAUL.md §2/§8) N `jp_fuji`: "Fuji Thermals" (11-7 GLIDE, secret),
# the sky over the lake. Not wired into the game yet: the overhaul's engine work will add the theme; its key matches this
# atlas's name. Original toon art:
#   L0  (base 300, f 0.02): the great snow-capped volcano (one per period) over a pale far range, unlined cloud ribbons
#   L1  (base 340, f 0.08): the lake: calm blue water with the mountain's pale reflection, wooded islets with round pines,
#       little reed beds along the near shore
#   ground: the lakeshore: a grass cap over grey-brown pebbles
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU

MODULE = 'jp_fuji'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 340}
SKY = ['#5a9ae8', '#b8dcf8', '#fff4e8']
PX = 28.1
PALETTE = {
    'fuji': '#7e8cbc', 'snow': '#f8fbff', 'range': '#a8b8d8', 'range2': '#b8c6e0', 'cloud': '#ffffff',
    'lake': '#6ab0d8', 'lake2': '#82c0e2', 'refl': '#a8cce8', 'refl_snow': '#dceefa', 'isle': '#5a8a5a', 'isle2': '#4a7a50',
    'pine': '#3e6e4a', 'pine2': '#4a7e54', 'rock': '#8a8478', 'reed': '#8aa85a', 'reed2': '#a8c070',
    'g_cap': '#6aa84a', 'g_cap_hi': '#9ad06a', 'g_blade': '#7ab854', 'g_dirt': '#7a7066', 'g_dirt2': '#6a6058', 'g_rock': '#a8a296',
}
K.use(MODULE, PALETTE, LAYERS)
CX = 0.5


def cone_prof(R, H):
    return [(R, 0.0), (R * 0.62, H * 0.18), (R * 0.4, H * 0.42), (R * 0.24, H * 0.72), (R * 0.12, H * 0.98), (R * 0.1, H)]


def r_at(prof, z):
    for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
        if z0 <= z <= z1:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return prof[-1][0]


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'range', y=4.0, depth=3.0, top=0.0, bottom=-3.0)
    zr = periodic_profile(rng, 1.4, 0.6, waves=((3, 1.0), (5, 0.5), (8, 0.2)))
    ridge_slab(L, 'L0_range', 'range2', zr, y=3.5, outline=0.0)
    cx, R, H = CX * P, 13.0, 8.6
    prof = cone_prof(R, H)
    B = Builder('L0_fuji', L)
    B.lathe('fuji', prof + [(0.0, H)], 18, at=(cx, 3.0, 0.0), yscale=0.25, smooth=False, phase=0.1)
    z0 = H * 0.6
    sp = [(r_at(prof, z0) + 0.1, z0), (r_at(prof, H * 0.8) + 0.08, H * 0.8), (r_at(prof, H) + 0.06, H + 0.04), (0.0, H + 0.04)]
    B.lathe('snow', sp, 18, at=(cx, 2.98, 0.0), yscale=0.25, smooth=False, phase=0.1, jag=lambda k: (-0.7 if k % 2 else 0.0) - (0.4 if k % 3 == 0 else 0.0))
    B.done()
    C = Builder('L0_clouds', L)
    for k in range(7):
        x = rng.uniform(0, P)
        z = rng.uniform(H * 0.25, H * 0.55)
        for dx in wraps(x, 3.0):
            C.sphere('cloud', (x + dx, 1.5, z), rng.uniform(1.6, 2.4), scale=(1.7, 0.4, 0.24), subdiv=2)
    oc = C.done(period=None)
    oc['outline'] = 0


def build_L1(rng):
    L = 'L1'
    # the lake fills the layer below its shoreline; the volcano's reflection lies on it, pale and unlined
    W = Builder('L1_lake', L)
    W.box('lake', (P / 2, 1.0, -2.0), (P + 2.0, 1.0, 4.4), bevel=0.0)
    for k in range(6):
        W.box('lake2', (P / 2, 0.45, -0.5 - k * 0.6), (P + 2.0, 0.05, 0.05), bevel=0.0)
    ow = W.done(period=None)
    ow['outline'] = 0
    R = Builder('L1_reflection', L)
    cx = CX * P
    prof = [(r * 0.6, -z * 0.45) for r, z in cone_prof(13.0, 8.6)]
    pts = [(cx - r, z) for r, z in prof] + [(cx + r, z) for r, z in reversed(prof)]
    R.slab('refl', pts[::-1], 0.04, at=(0, 0.3, -0.02))
    sn = [(cx - r * 0.55, z) for r, z in prof[-3:]] + [(cx + r * 0.55, z) for r, z in reversed(prof[-3:])]
    R.slab('refl_snow', sn[::-1], 0.04, at=(0, 0.25, -0.02))
    orf = R.done()
    orf['outline'] = 0
    # wooded islets
    I = Builder('L1_isles', L)
    for k in range(3):
        x = (k + rng.uniform(0.15, 0.6)) * P / 3
        w = rng.uniform(2.4, 4.0)
        for dx in wraps(x, w / 2 + 1.0):
            I.sphere('isle', (x + dx, -0.2, 0.0), w / 2, scale=(1.0, 0.5, 0.22), subdiv=2)
            I.rbox('rock', (x + dx + w * 0.3, -0.5, 0.05), (0.4, 0.3, 0.25), bevel=0.1)
            for j in range(rng.choice((2, 3))):
                px = x + dx - w * 0.3 + j * w * 0.3
                I.rod('rock', (px, -0.1, 0.2), (px, -0.1, 0.7), 0.06, segs=5)
                for q in range(3):
                    I.sphere(rng.choice(('pine', 'pine2')), (px + (q - 1) * 0.22, -0.1, 0.7 + q * 0.2), 0.42 - q * 0.09, scale=(1.4, 0.6, 0.5), subdiv=1)
    I.done(period=None)
    D = Builder('L1_reeds', L)
    for k in range(18):
        x = rng.uniform(0, P)
        for j in range(4):
            D.rod(rng.choice(('reed', 'reed2')), (x + j * 0.08, -1.2, -0.9), (x + j * 0.1 + 0.05, -1.2, -0.3 + 0.1 * (j % 2)), 0.02, segs=4)
    od = D.done()
    od['outline'] = 0.5


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='grass', stone_p=0.7, patch_p=0.15, cap_h=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
