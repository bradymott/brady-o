# Vietnam 10-4 "Phong Nha Cave": the parallax background as a toon diorama (Fiesta Toon pipeline).
#   L0  vnCaveWall (base 0, f 0.05, dyn vnSkylight): the whole cave wall behind the climb, hanging from the top of
#       the screen: dark green-grey limestone in layers, flowstone curtains and stalactites from above, stalagmites
#       and rimstone pools below, a pale far gallery glowing faintly through a gap, mineral glints (the sunbeams of
#       the skylight are code-drawn on top). Calm and dark so the climbing ledges stay the brightest stone.
#   ground: the engine's 'mineral' style: banded cave rock with a pale flowstone crust
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, ridge_slab, periodic_profile

MODULE = 'vn_cave'
LAYERS = ['L0']
BASES = {'L0': 0}
SKY = ['#0a1410', '#06100c', '#020604']
PALETTE = {
    'wall': '#1e2c28', 'wall2': '#24342f', 'wall3': '#2a3c36', 'far': '#3a5248', 'far_glow': '#5a8a74',
    'curtain': '#30443c', 'curtain2': '#3a5046', 'mite': '#2e4038', 'mite2': '#384c44', 'pool': '#2a4a4a',
    'glint_glow': '#7affc8',
    # ground (cave rock)
    'g_cap': '#7a8a7a', 'g_cap_hi': '#a8c0a8', 'g_dirt': '#4a4e4a', 'g_dirt2': '#2e3236', 'g_rock': '#6a706a',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def build_L0(rng):
    L = 'L0'
    B = Builder('L0_wall', L)
    B.box('wall', (P / 2, 3.0, -8.5), (P + 2.0, 1.0, 18.0), bevel=0.0)
    B.done(period=None)['outline'] = 0
    # a far gallery glowing through a gap (no ink), framed by a lighter rock band
    F = Builder('L0_far', L)
    for k in range(2):
        cx = (k + 0.3) * P / 2 + rng.uniform(-2, 2)
        F.sphere('far', (cx, 2.6, -7.5), 3.2, scale=(1.0, 0.1, 1.3), subdiv=2)
        F.sphere('far_glow', (cx + 0.3, 2.5, -7.0), 1.6, scale=(1.0, 0.1, 1.4), subdiv=2)
    F.done()
    K.no_ink(L, 'L0_far')
    # layered strata bands
    S = Builder('L0_strata', L)
    for k in range(5):
        z = -2.0 - k * 2.8 + rng.uniform(-0.4, 0.4)
        zf = periodic_profile(rng, 0.0, 0.25, waves=((3, 1.0), (7, 0.5)))
        for i in range(36):
            x0, x1 = i * P / 36, (i + 1) * P / 36
            S.rod(rng.choice(('wall2', 'wall3')), (x0, 2.0, z + zf(x0)), (x1, 2.0, z + zf(x1)), 0.12, segs=4)
    S.done(period=None)['outline'] = 0
    # flowstone curtains and stalactites from the roof
    C = Builder('L0_curtains', L)
    x = 0.5
    while x < P:
        w = rng.uniform(0.8, 2.0)
        ln = rng.uniform(1.5, 5.0)
        pts = [(x - w / 2, 0.5), (x + w / 2, 0.5)]
        for j in range(9, -1, -1):
            u = j / 9
            pts.append((x - w / 2 + u * w, -ln * (0.35 + 0.65 * math.sin(math.pi * u)) + 0.2 * math.sin(j * 2.3)))
        C.slab(rng.choice(('curtain', 'curtain2')), pts, 0.3, at=(0, 1.2, 0))
        for k in range(rng.randint(1, 3)):
            sx = x + rng.uniform(-w / 2, w / 2)
            sl = rng.uniform(0.6, 1.4)
            C.lathe('curtain2', [(0.14, 0.0), (0.0, -sl)], 6, at=(sx, 1.0, -ln * 0.6), cap_bottom=True)
        x += w + rng.uniform(0.6, 2.4)
    C.done()['outline'] = 0.35
    # stalagmites and rimstone pools along the bottom
    M = Builder('L0_mites', L)
    x = 0.8
    while x < P:
        h = rng.uniform(0.8, 2.6)
        M.lathe(rng.choice(('mite', 'mite2')), [(0.5 * h / 2, 0.0), (0.3 * h / 2, h * 0.5), (0.0, h)], 8, at=(x, 1.0, -15.8), cap_bottom=True)
        if rng.random() < 0.5:
            M.sphere('pool', (x + 1.0, 0.9, -15.6), 0.7, scale=(1.4, 0.4, 0.2), subdiv=1)
        x += rng.uniform(1.6, 3.4)
    M.done()['outline'] = 0.35
    G = Builder('L0_glints', L)
    for k in range(30):
        G.sphere('glint_glow', (rng.uniform(0, P), 0.5, rng.uniform(-15.0, -1.0)), rng.uniform(0.03, 0.06), subdiv=1)
    G.done()
    K.no_ink(L, 'L0_glints')


BUILDERS = {'L0': build_L0}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='nubs', stone_p=0.5, patch_p=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
