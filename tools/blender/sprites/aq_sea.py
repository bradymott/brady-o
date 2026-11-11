# Antarctica 13-2 "Iceberg Drift" (theme aq_sea): original toon art for the open Southern Ocean.
#   L0  mountains (base 300, f 0.03, #a8c0d8, blur): a far, low coast of snowy peaks across the water, unlined
#   L1  aqBergs   (base 340, f 0.12, #f0f8ff): big peaked, domed and weathered icebergs (never flat tables) on the dark
#       sea ('#1a3a6a'), a light swell line and glints on the water, their submerged feet showing pale
#   ground snow: the shelf's snow-capped ice blocks (the level floats on bergs; the floor shows on the shore stretches)
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU
import aq_kit as AK

MODULE = 'aq_sea'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 340}
SKY = ['#4a7ab8', '#a8c8e8', '#f0f8ff']
PX = 28.1
PALETTE = {
    'base_far': '#7a9cc4', 'rock_far': '#a8c0d8', 'snow_far': '#dce8f4', 'rock': '#94acca', 'rock2': '#8ca4c4', 'snow': '#eaf2fa',
    'berg': '#c6dcef', 'berg2': '#bcd4ea', 'berg_top': '#e4f0fa', 'berg_sh': '#a2c0de', 'berg_streak': '#a4c4e2', 'berg_under': '#2e5f94',
    'sea': '#1a3a6a', 'sea_hi': '#5a8ac0', 'sea_glint': '#7aa8d8',
    'g_cap': '#eef6ff', 'g_cap_hi': '#ffffff', 'g_lip': '#f4faff', 'g_icicle': '#c8ecff', 'g_dirt': '#6a98c6',
    'g_rock': '#90bae2', 'g_rock2': '#84b0dc', 'g_rock3': '#9cc4e8',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    AK.far_peaks('L0', rng, hf=(2.6, 4.2), hn=(1.8, 3.2))


def build_L1(rng):
    AK.sea('L1', rng, y=2.6, glints=24)
    AK.bergs('L1', rng, y=1.6, wr=(3.0, 5.6), hr=(1.8, 3.4), outline=0.4)

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
