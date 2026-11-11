# Indonesia 9-4 "Manta Point Night Dive": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  idDeep (base 0, f 0.04, dyn idMantasBg): the deep water: faint slanting moonlight shafts from the surface
#       (no ink) and a far, dark reef ridge low across the bottom; the code-drawn mantas glide over it
#   L1  idReefBg (base 320, f 0.14, dyn idGlowDots): the night reef: staghorn thickets, sea fans and brain corals in
#       deep teal and plum with pale tips, a few unlit bioluminescent specks
#   ground: the engine's 'coral' style: dark reef rock under a knobbly pink coral crust
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, ridge_slab, periodic_profile

MODULE = 'id_dive'
LAYERS = ['L0', 'L1']
BASES = {'L0': 0, 'L1': 320}
SKY = ['#062a48', '#041a30', '#020a16']
PALETTE = {
    'shaft': '#0c3a5e', 'shaft2': '#0a3254', 'deep_reef': '#0a2440', 'deep_reef_sh': '#081e36', 'deep_far': '#0c2c4a',
    'reef': '#14445e', 'reef_sh': '#103a52', 'stag': '#1e5a6e', 'stag_tip': '#4a9aa8', 'fan': '#3a3a6e', 'fan_rib': '#5a5a92',
    'brain': '#2a5468', 'brain_line': '#1a3e52', 'sponge': '#5a3a6a', 'sponge_in': '#3a2448', 'speck_glow': '#7af0ff', 'speck2_glow': '#b0ffb0',
    # ground (engine 'coral' style)
    'g_cap': '#e86a8a', 'g_cap_hi': '#ffa8c0', 'g_dirt': '#2a3650', 'g_dirt2': '#1c2640', 'g_rock': '#3a4a64',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def build_L0(rng):
    L = 'L0'
    S = Builder('L0_shafts', L)
    for k in range(5):
        x = (k + 0.3) * P / 5 + rng.uniform(-1.5, 1.5)
        w0, w1, slant = rng.uniform(0.6, 1.1), rng.uniform(2.0, 3.2), rng.uniform(2.5, 4.0)
        S.slab('shaft' if k % 2 else 'shaft2', [(x, 0.5), (x - w0, 0.5), (x - w0 + slant - w1 * 0.3, -12.0), (x + slant + w1 * 0.7, -12.0)][::-1], 0.1, at=(0, 4.0, 0))
    S.done()
    K.no_ink(L, 'L0_shafts')
    zf = periodic_profile(rng, -12.6, 0.9, waves=((3, 1.0), (5, 0.5), (9, 0.2)))
    ridge_slab(L, 'L0_far', 'deep_far', lambda x: zf(x) + 1.0, y=3.0, bottom=-17.0, outline=0.3)
    ridge_slab(L, 'L0_reef', 'deep_reef', zf, y=2.0, bottom=-17.0, shade='deep_reef_sh', outline=0.4)


def staghorn(B, x, z, s, rng):
    def branch(p, d, ln, depth):
        q = (p[0] + d[0] * ln, p[1], p[2] + d[1] * ln)
        B.rod('stag', p, q, 0.07 * s * (0.7 ** (3 - depth)) + 0.02, segs=5)
        if depth == 0:
            B.sphere('stag_tip', q, 0.07 * s, subdiv=1)
            return
        for da in (-0.45, 0.4):
            a = math.atan2(d[1], d[0]) + da + rng.uniform(-0.1, 0.1)
            branch(q, (math.cos(a), math.sin(a)), ln * 0.72, depth - 1)
    for a in (1.2, 1.57, 1.95):
        branch((x, 0.0, z), (math.cos(a), math.sin(a)), 0.55 * s, 3)


def sea_fan(B, x, z, s, rng):
    pts = [(x - 0.06, z), (x + 0.06, z)]
    for k in range(13, -1, -1):
        a = math.pi * k / 13
        pts.append((x + math.cos(a) * 0.8 * s, z + 0.15 + math.sin(a) * 1.1 * s))
    B.slab('fan', pts, 0.05, at=(0, 0.2, 0))
    for k in range(7):
        a = math.pi * (k + 0.5) / 7
        B.rod('fan_rib', (x, 0.15, z + 0.1), (x + math.cos(a) * 0.75 * s, 0.15, z + 0.15 + math.sin(a) * 1.0 * s), 0.025, segs=4)


def brain(B, x, z, s):
    B.sphere('brain', (x, 0.3, z), 0.6 * s, scale=(1.0, 0.6, 0.65), subdiv=2)
    for k in range(3):
        a0 = 0.5 + k * 0.7
        B.rod('brain_line', (x - 0.4 * s, -0.08, z + 0.12 * k * s), (x + 0.4 * s, -0.08, z + 0.12 * k * s + 0.04), 0.03, segs=4)


def sponge(B, x, z, s):
    B.lathe('sponge', [(0.25 * s, 0.0), (0.3 * s, 0.4 * s), (0.36 * s, 0.85 * s), (0.3 * s, 0.9 * s)], 8, at=(x, 0.1, z), cap_bottom=True)
    B.sphere('sponge_in', (x, -0.05, z + 0.86 * s), 0.27 * s, scale=(1.0, 0.4, 0.25), subdiv=1)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'reef', y=3.0, depth=2.0, top=-0.2, bottom=-4.0)
    zf = periodic_profile(rng, 0.5, 0.45, waves=((3, 1.0), (7, 0.4), (13, 0.15)))
    ridge_slab(L, 'L1_reef', 'reef', zf, y=1.5, bottom=-4.0, shade='reef_sh', shade_depth=1.0, outline=0.6)
    C = Builder('L1_corals', L)
    x = 0.8
    k = 0
    while x < P:
        r = rng.random()
        z = zf(x) - 0.1
        if r < 0.35:
            staghorn(C, x, z, rng.uniform(0.9, 1.4), rng)
        elif r < 0.6:
            sea_fan(C, x, z, rng.uniform(0.9, 1.4), rng)
        elif r < 0.82:
            brain(C, x, z, rng.uniform(0.8, 1.2))
        else:
            sponge(C, x, z, rng.uniform(0.9, 1.3))
        x += rng.uniform(1.3, 2.6)
        k += 1
    C.done()
    G = Builder('L1_specks', L)
    for k in range(26):
        x = rng.uniform(0, P)
        G.sphere('speck_glow' if k % 3 else 'speck2_glow', (x, -0.3, zf(x) + rng.uniform(0.2, 2.6)), rng.uniform(0.04, 0.07), subdiv=1)
    G.done()
    K.no_ink(L, 'L1_specks')


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='nubs', stone_p=0.45, patch_p=0.3, cap_h=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
