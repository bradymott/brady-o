# Nepal 12-2 "Yak Caravan Pass" (theme np_pass): original toon art for the high pass.
#   L0  npPeaks (base 260, f 0.015, #7a8ab8, blur): the high Himalaya, tall faceted peaks under heavy snow (far unlined)
#   L1  npGompa (base 310, f 0.05, #8a94a8): a long grey ridge; far away on it a small, plain monastery silhouette
#       (whitewashed block, a dark red band, a small gold roof) with one string of prayer flags: distant scenery only
#   L2  npPeaks (base 330, f 0.1, #6a7488): nearer rocky crags with thinner snow
#   ground npSnowRock: a snow cap with a wavy lip over grey slate blocks
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU
import np_hills as NH

MODULE = 'np_pass'
LAYERS = ['L0', 'L1', 'L2']
BASES = {'L0': 260, 'L1': 310, 'L2': 330}
SKY = ['#2a6ac8', '#8ac0f0', '#e8f4ff']
PX = 28.1
PALETTE = {
    'rock_far': '#9aa8d0', 'rock': '#7a8ab8', 'rock2': '#7080b0', 'snow': '#f4f8ff', 'snow_far': '#e6eefa', 'base_far': '#8a9ac4',
    'ridge': '#8a94a8', 'ridge_sh': '#7e889e', 'wall': '#f2ece0', 'band': '#8a2a1e', 'gold': '#c8962a', 'win': '#3a2a2a', 'string': '#6a5a48',
    'flag_b': '#2a6ad8', 'flag_w': '#f4f4f4', 'flag_r': '#d8322a', 'flag_g': '#2aa84a', 'flag_y': '#f2c81a',
    'crag': '#6a7488', 'crag2': '#5e687c', 'csnow': '#e8f0fa', 'crag_plain': '#5e687c',
    'g_cap': '#f4f8ff', 'g_cap_hi': '#ffffff', 'g_dirt': '#6a6e7a', 'g_rock': '#8a8e9a', 'g_rock2': '#7a7e8a', 'g_lip': '#e8f0fa',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'base_far', y=6.0, depth=3.0, top=0.0, bottom=-3.0)
    NH.peaks(L, rng, 0, 5.6, 8.2, 3.6, 5.4, 'rock_far', 'snow_far', 4.0, outline=0.0, snow_from=0.35, name='far')
    NH.peaks(L, rng, 0, 3.6, 6.0, 3.0, 4.6, 'rock', 'snow', 2.0, outline=1.0, snow_from=0.42, name='near', gap=(1.5, 2.1))


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'ridge', y=3.0, depth=3.0, top=0.0, bottom=-3.0)
    zr = periodic_profile(rng, 1.2, 0.7, waves=((1, 1.0), (3, 0.3), (6, 0.1)))
    ridge_slab(L, 'L1_ridge', 'ridge', zr, y=2.0, shade='ridge_sh', shade_depth=0.7)
    # the far monastery: deliberately small and plain
    x = 640 / 1024 * P
    z = zr(x) - 0.1
    B = Builder('L1_gompa', L)
    B.box('wall', (x, 1.6, z + 0.55), (2.4, 0.8, 1.1), bevel=0.0)
    B.box('band', (x, 1.6, z + 1.15), (2.4, 0.82, 0.16), bevel=0.0)
    B.slab('gold', [(-0.7, 0.0), (0.7, 0.0), (0.0, 0.5)], 0.5, at=(x, 1.3, z + 1.22))
    for k in range(-2, 3):
        B.box('win', (x + k * 0.42, 1.18, z + 0.7), (0.12, 0.02, 0.24), bevel=0.0)
    B.done()
    F = Builder('L1_flags', L)
    NH.flag_line(F, x + 1.2, z + 1.0, x + 4.2, zr(x + 4.2) + 0.3, 1.1, rng)
    of = F.done()
    of['outline'] = 0


def build_L2(rng):
    L = 'L2'
    plain(L, 'L2_plain', 'crag_plain', y=3.0, depth=3.0, top=0.0, bottom=-3.0)
    NH.peaks(L, rng, 0, 1.6, 3.0, 2.0, 3.0, 'crag', 'csnow', 1.0, outline=1.0, snow_from=0.66, name='crag', gap=(1.8, 2.6))


BUILDERS = {'L0': build_L0, 'L1': build_L1, 'L2': build_L2}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def snow_lip(B, rng, x0, x1):
    for k in range(2):
        xc = x0 + (k + 0.5) * (x1 - x0) / 2
        B.sphere('g_lip', (xc, -0.02, -0.3), 0.2, scale=(1.3, 1.0, 0.45), subdiv=2)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.3, rows=(1, 2), cols=(1, 2), gap=0.1, jitter=0.3, roles=('g_rock', 'g_rock2'), rounded=True, cap_deco=snow_lip, hi_h=0.08)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
