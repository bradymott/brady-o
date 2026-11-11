# Antarctica 13-4 "The Blizzard Palace" (theme aq_storm): original toon art for the white-out over the glacier.
#   L0  mountains (base 300, f 0.03, #c8d4e4, dyn aqBlizzard, blur): faint grey-blue peaks lost in the blizzard (the
#       engine blows the snow streaks over it), unlined and very pale
#   L1  aqShelf   (base 350, f 0.15, #d8e8f8): the glacier's pressure ridge under drifting snow: grey-blue seracs
#       through soft drifts, muted so the gusts and Big Tusk's arena stay on top
#   ground snow: snow-capped ice blocks, a touch greyer than the shelf's
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU
import aq_kit as AK

MODULE = 'aq_storm'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 350}
SKY = ['#8a9ab0', '#c8d4e0', '#f0f4f8']
PX = 28.1
PALETTE = {
    'base_far': '#c0ccdc', 'rock_far': '#c8d4e4', 'snow_far': '#e2e8f0', 'rock': '#b8c6d8', 'rock2': '#b2c0d4', 'snow': '#e8eef6',
    'drift': '#e4eaf2', 'drift_sh': '#ccd6e4', 'serac': '#a8bed6', 'serac2': '#b6cade', 'serac_hi': '#d2deea',
    'g_cap': '#eaf0f8', 'g_cap_hi': '#ffffff', 'g_lip': '#eef3fa', 'g_icicle': '#c4dcf0', 'g_dirt': '#6e8eb4',
    'g_rock': '#94b2d4', 'g_rock2': '#88a8cc', 'g_rock3': '#a0bcdc',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    AK.far_peaks('L0', rng, hf=(4.6, 7.0), hn=(3.0, 5.0))


def build_L1(rng):
    AK.pressure_ridge('L1', rng, y=1.2, base=0.7, amp=0.4, n=6, hr=(1.2, 2.6), outline=0.6)

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
