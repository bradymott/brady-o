# Indonesia 9-7 "Blue Fire Rails" (overhaul secret level, RAIL, dark blue): theme id_ijen, a sulfur mine in a
# volcano's crater at night where the gas burns with blue flames. Rendered ahead of the engine work (no THEMES entry
# exists yet; the atlas is not referenced). Suggested theme: sky ['#060c24', '#0e1e44', '#1c2c5a'], ground 'sulfur'
# (an earth-style floor), dark: true, layers in this order with these bases.
#   L0  crater walls (base 280, f 0.04): steep slate-blue cliffs streaked with sulfur yellow, the turquoise acid lake
#       far below them, small unlit blue flames flickering at vents along the cliff foot, drifting smoke (no ink)
#   L1  the mine (base 340, f 0.14): heaps of yellow sulfur blocks, the clay pipes that lead the gas out of the vents
#       with sulfur dripping from their mouths, plank props, wisps of smoke (no ink)
#   ground: a cracked sulfur crust (yellow cap) over grey volcanic rock
# Helpers: id_kit.py.
import math, random
import id_kit as K
from id_kit import P, Builder, plain, ridge_slab, periodic_profile

MODULE = 'id_ijen'
LAYERS = ['L0', 'L1']
BASES = {'L0': 280, 'L1': 340}
SKY = ['#060c24', '#0e1e44', '#1c2c5a']
PALETTE = {
    'cliff': '#2e3a5e', 'cliff_sh': '#26304e', 'cliff_far': '#38466c', 'streak': '#b8a84a', 'streak2': '#8a8a4a',
    'lake': '#2ab8b0', 'lake_hi': '#7ae8de', 'flame_glow': '#4ac8ff', 'flame2_glow': '#c0f4ff', 'smoke': '#5a6688', 'smoke2': '#4a5678',
    'sulfur': '#e8c83a', 'sulfur2': '#d4ae2a', 'sulfur_hi': '#fff08a', 'pipe': '#a8603a', 'pipe2': '#8a4a2a', 'plank': '#6a5038',
    'rock': '#3e4664', 'rock2': '#343a56',
    # ground: sulfur crust over grey rock
    'g_cap': '#e0c03a', 'g_cap_hi': '#fff08a', 'g_dirt': '#4a4e62', 'g_dirt2': '#3a3e52', 'g_rock': '#6a6e82',
}
K.use(MODULE, PALETTE, LAYERS)
TAU = math.tau


def build_L0(rng):
    L = 'L0'
    far = periodic_profile(rng, 6.5, 1.2, waves=((2, 1.0), (5, 0.4), (9, 0.2)), sharp=0.3)
    ridge_slab(L, 'L0_far', 'cliff_far', far, y=4.0, bottom=-3.0, outline=0.35)
    W = Builder('L0_lake', L)
    W.box('lake', (P / 2, 3.0, 0.9), (P + 2.0, 0.3, 1.9), bevel=0.0)
    W.box('lake_hi', (P / 2, 2.8, 1.82), (P + 2.0, 0.1, 0.05), bevel=0.0)
    W.done(period=None)['outline'] = 0
    near = periodic_profile(rng, 4.2, 1.6, waves=((3, 1.0), (4, 0.6), (11, 0.25)), sharp=0.4)
    def cliff(x):
        # the near walls rise from both ends of the strip, leaving the lake visible in a gap
        g = 0.5 + 0.5 * math.cos(TAU * x / P)
        return -0.5 + (near(x) + 0.5) * (0.15 + 0.85 * g)
    ridge_slab(L, 'L0_cliff', 'cliff', cliff, y=1.5, bottom=-3.0, shade='cliff_sh', shade_depth=0.8, outline=0.5)
    S = Builder('L0_streaks', L)
    for k in range(16):
        x = rng.uniform(0, P)
        top = cliff(x) - 0.2
        if top < 0.8:
            continue
        ln = rng.uniform(0.8, min(3.0, top))
        S.lathe(rng.choice(('streak', 'streak2')), [(0.16, 0.0), (0.0, -ln)], 5, at=(x, 1.2, top), yscale=0.3, cap_bottom=True)
    S.done()
    K.no_ink(L, 'L0_streaks')
    F = Builder('L0_flames', L)
    for k in range(7):
        x = (k + rng.uniform(0.2, 0.8)) * P / 7
        z = max(0.1, cliff(x) * 0.15)
        F.lathe('flame_glow', [(0.18, 0.0), (0.14, 0.25), (0.0, 0.7)], 8, at=(x, 0.8, z), cap_bottom=True)
        F.lathe('flame2_glow', [(0.08, 0.0), (0.0, 0.35)], 8, at=(x, 0.6, z), cap_bottom=True)
    F.done()
    K.no_ink(L, 'L0_flames')
    M = Builder('L0_smoke', L)
    for k in range(6):
        K.cloud(M, rng.uniform(0, P), 0.5, rng.uniform(2.0, 5.0), rng.uniform(2.0, 3.5), rng.choice(('smoke', 'smoke2')), rng)
    M.done()
    K.no_ink(L, 'L0_smoke')


def pipe(B, x, z, ln, rng):
    """A clay pipe coming out of a vent, angled down, a beard of solid sulfur dripping from its mouth."""
    a = rng.uniform(0.25, 0.45)
    x2, z2 = x + ln * math.cos(a), z + ln * math.sin(a)
    B.rod('pipe', (x2, 0.2, z2), (x, 0.2, z), 0.17, segs=8)
    for k in range(3):
        B.rod('pipe2', (x + (x2 - x) * (k + 1) / 4, 0.0, z + (z2 - z) * (k + 1) / 4 - 0.17), (x + (x2 - x) * (k + 1) / 4, 0.0, z + (z2 - z) * (k + 1) / 4 + 0.17), 0.04, segs=4)
    for k in range(4):
        B.lathe('sulfur', [(0.07, 0.0), (0.0, -rng.uniform(0.3, 0.7))], 6, at=(x - 0.1 + 0.07 * k, 0.1, z - 0.1), cap_bottom=True)


def heap(B, x, rng):
    """A heap of raw sulfur chunks: lumpy rounded rocks, not bricks."""
    for k in range(rng.randint(5, 8)):
        r = rng.uniform(0.22, 0.38)
        row = k // 3
        B.sphere(rng.choice(('sulfur', 'sulfur2', 'sulfur')), (x + (k % 3 - 1) * 0.42 + row * 0.2, 0.1 + 0.05 * k, r * 0.7 + row * 0.38), r,
                 scale=(1.2, 0.8, 0.85), rot=(0, rng.uniform(-0.5, 0.5), 0), subdiv=1, smooth=False)
    B.sphere('sulfur_hi', (x - 0.1, -0.2, 0.45), 0.07, subdiv=1)


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'rock2', y=3.0, depth=2.0, top=-0.3, bottom=-3.0)
    zf = periodic_profile(rng, 0.8, 0.6, waves=((3, 1.0), (7, 0.4)))
    ridge_slab(L, 'L1_rock', 'rock', zf, y=1.5, bottom=-3.0, shade='rock2', outline=0.6)
    B = Builder('L1_mine', L)
    x = 1.5
    while x < P - 1.0:
        r = rng.random()
        if r < 0.45:
            heap(B, x, rng)
        elif r < 0.8:
            pipe(B, x, zf(x) + 0.3, rng.uniform(1.6, 2.6), rng)
        else:
            for dx in (-0.5, 0.5):
                B.rod('plank', (x + dx, 0.3, 0.0), (x + dx * 0.6, 0.3, 1.8), 0.08, segs=5)
            B.box('plank', (x, 0.25, 1.7), (1.4, 0.2, 0.14), bevel=0.02)
        x += rng.uniform(3.0, 5.0)
    B.done()
    M = Builder('L1_smoke', L)
    for k in range(4):
        K.cloud(M, rng.uniform(0, P), -0.2, rng.uniform(2.0, 3.5), rng.uniform(1.5, 2.5), 'smoke', rng)
    M.done()
    K.no_ink(L, 'L1_smoke')


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_earth(seed, tufts='nubs', stone_p=0.45, patch_p=0.3)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
