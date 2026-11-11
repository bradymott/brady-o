# Antarctica overhaul variant aq_aurora (13-2 "Upside-Down Pole", level overhaul §8: V aq_aurora): the drifting
# bergs re-lit for the polar night under the aurora (the engine's aurora:true draws the bands).
# Suggested theme entry: sky ['#050a1e', '#0c1e3c', '#1a3a52'], aurora: true, stars 1, liquid icewater,
# layers [{kind:'mountains', color:'#1c2c48', base:300, f:0.03}, {kind:'aqBergs', color:'#9ac8d8', base:340, f:0.1}].
#   L0  mountains (base 300, f 0.03): night peaks, their snow lit a faint aurora teal, unlined
#   L1  aqBergs   (base 340, f 0.1): peaked and domed icebergs glowing pale teal-blue on a near-black sea with green
#       glints from the aurora (never flat tables)
#   ground snow at night: a pale snow cap over slate-blue ice blocks
import math, random
import jp_kit as K
from jp_kit import P, Builder, plain, wraps, TAU
import aq_kit as AK

MODULE = 'aq_aurora'
LAYERS = ['L0', 'L1']
BASES = {'L0': 300, 'L1': 340}
SKY = ['#050a1e', '#0c1e3c', '#1a3a52']
PX = 28.1
PALETTE = {
    'base_far': '#122036', 'rock_far': '#1c2c48', 'snow_far': '#3a5a72', 'rock': '#1a2a44', 'rock2': '#18283e', 'snow': '#4a7488',
    'berg': '#6a94b0', 'berg2': '#5e88a6', 'berg_top': '#a8e0d8', 'berg_sh': '#4a7090', 'berg_streak': '#5a84a0', 'berg_under': '#163a4e',
    'sea': '#0a1a30', 'sea_hi': '#2a6a6a', 'sea_glint': '#4ac8a0',
    'g_cap': '#c4d4ea', 'g_cap_hi': '#dce8f6', 'g_lip': '#c8d8ee', 'g_icicle': '#9ab8dc', 'g_dirt': '#3a5478',
    'g_rock': '#5a7aa2', 'g_rock2': '#52709a', 'g_rock3': '#6284aa',
}
K.use(MODULE, PALETTE, LAYERS)


def build_L0(rng):
    AK.far_peaks('L0', rng, hf=(3.4, 5.4), hn=(2.4, 4.0))


def build_L1(rng):
    AK.sea('L1', rng, y=2.6, glints=26)
    AK.bergs('L1', rng, y=1.6, wr=(3.0, 5.4), hr=(1.8, 3.2), outline=0.5)

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
