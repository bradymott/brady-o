# Nepal 12-3 "Blizzard Night" (theme np_blizzard): original toon art for the night storm on the high slopes.
#   L0  npPeaks  (base 270, f 0.015, #2a3a5a, blur): dark night peaks, their snow a dim blue-grey (far unlined)
#   L1  npDrifts (base 330, f 0.08, #5a6a8a, dyn npStorm): wind-carved snow hummocks with dark rocks poking through
#       (the engine races the snowflakes over it)
#   ground npSnowRock at night: a pale-blue snow cap over dark slate blocks (values kept apart from the white yeti)
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, ridge_slab, periodic_profile, wraps, TAU
import np_hills as NH
import np_pass as NP

MODULE = 'np_blizzard'
LAYERS = ['L0', 'L1']
BASES = {'L0': 270, 'L1': 330}
SKY = ['#0a1430', '#1a2a50', '#3a4a70']
PX = 28.1
PALETTE = {
    'rock_far': '#26344e', 'rock': '#2a3a5a', 'rock2': '#26354f', 'snow': '#8a9abc', 'snow_far': '#6a7a9c', 'base_far': '#22304a',
    'drift': '#5a6a8a', 'drift_sh': '#4e5e7e', 'drift2': '#66769a', 'drift_plain': '#4e5e7e', 'drock': '#2a3044',
    'g_cap': '#a8b8d8', 'g_cap_hi': '#c8d4ec', 'g_dirt': '#2e3448', 'g_rock': '#444c62', 'g_rock2': '#3a4258', 'g_lip': '#98a8c8',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    L = 'L0'
    plain(L, 'L0_plain', 'base_far', y=6.0, depth=3.0, top=0.0, bottom=-3.0)
    NH.peaks(L, rng, 0, 4.6, 7.0, 3.6, 5.2, 'rock_far', 'snow_far', 4.0, outline=0.0, snow_from=0.45, name='far')
    NH.peaks(L, rng, 0, 3.0, 5.0, 3.0, 4.4, 'rock', 'snow', 2.0, outline=0.8, snow_from=0.5, name='near')


def build_L1(rng):
    L = 'L1'
    plain(L, 'L1_plain', 'drift_plain', y=3.0, depth=3.0, top=0.0, bottom=-3.0)
    z1 = periodic_profile(rng, 1.2, 0.5, waves=((3, 1.0), (5, 0.5), (11, 0.15)))
    ridge_slab(L, 'L1_drift_far', 'drift2', z1, y=2.4, shade='drift_sh', shade_depth=0.8, outline=0.0)
    z2 = periodic_profile(rng, 0.5, 0.45, waves=((4, 1.0), (7, 0.4), (13, 0.1)))
    ridge_slab(L, 'L1_drift', 'drift', z2, y=1.2, shade='drift_sh', shade_depth=1.0)
    B = Builder('L1_rocks', L)
    for k in range(9):
        x = (k + rng.uniform(0.1, 0.9)) * P / 9
        B.rbox('drock', (x, 0.9, z2(x) - 0.05), (rng.uniform(0.5, 0.9), 0.5, rng.uniform(0.3, 0.55)), bevel=0.14)
    B.done()


BUILDERS = {'L0': build_L0, 'L1': build_L1}


def build(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.run_builders(BUILDERS, LAYERS, seed)


def build_ground(seed=1):
    K.use(MODULE, PALETTE, LAYERS)
    return K.ground_blocks(seed, cap_h=0.3, rows=(1, 2), cols=(1, 2), gap=0.1, jitter=0.3, roles=('g_rock', 'g_rock2'), rounded=True, cap_deco=NP.snow_lip, hi_h=0.08)


def clear():
    K.use(MODULE, PALETTE, LAYERS)
    K.clear()
